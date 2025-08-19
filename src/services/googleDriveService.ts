import type { GoogleDriveFile } from "../types";

const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";

export class GoogleDriveService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${GOOGLE_DRIVE_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.statusText}`);
    }

    return response.json();
  }

  async listFiles(
    folderId: string,
    pageToken?: string,
    includeShared: boolean = true
  ): Promise<{ files: GoogleDriveFile[]; nextPageToken?: string }> {
    let query = `'${folderId}' in parents and trashed=false`;
    
    // Include files shared with the user
    if (includeShared) {
      query = `(${query}) or (sharedWithMe=true and '${folderId}' in parents and trashed=false)`;
    }

    const params = new URLSearchParams({
      q: query,
      fields: "nextPageToken,files(id,name,mimeType,parents,modifiedTime,size,shared,sharingUser)",
      pageSize: "100",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });

    if (pageToken) {
      params.append("pageToken", pageToken);
    }

    return this.makeRequest(`/files?${params.toString()}`);
  }

  async getAllFilesInFolder(folderId: string): Promise<GoogleDriveFile[]> {
    let allFiles: GoogleDriveFile[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.listFiles(folderId, pageToken, true);
      allFiles = allFiles.concat(response.files);
      pageToken = response.nextPageToken;
    } while (pageToken);

    return allFiles;
  }

  // Get root folders including shared drives and shared folders
  async getRootFolders(): Promise<GoogleDriveFile[]> {
    let allFolders: GoogleDriveFile[] = [];

    try {
      // Get folders from "My Drive"
      const myDriveResponse = await this.listFiles('root', undefined, false);
      const myDriveFolders = myDriveResponse.files.filter(
        file => file.mimeType === 'application/vnd.google-apps.folder'
      );
      allFolders = allFolders.concat(myDriveFolders);

      // Get shared drives
      const sharedDrivesResponse = await this.makeRequest('/drives?fields=drives(id,name)');
      const sharedDrives = sharedDrivesResponse.drives || [];
      
      // Convert shared drives to folder format
      const sharedDriveFolders: GoogleDriveFile[] = sharedDrives.map((drive: { id: string; name: string }) => ({
        id: drive.id,
        name: `[Shared Drive] ${drive.name}`,
        mimeType: 'application/vnd.google-apps.folder',
        shared: true,
      }));
      allFolders = allFolders.concat(sharedDriveFolders);

      // Get folders shared with me (but not in shared drives)
      const sharedWithMeResponse = await this.makeRequest(
        `/files?q=sharedWithMe=true and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name,mimeType,parents,modifiedTime,size,shared,sharingUser)&supportsAllDrives=true&includeItemsFromAllDrives=true`
      );
      
      // Filter out folders that are already in shared drives or are children of other folders
      const sharedFolders = sharedWithMeResponse.files.filter((file: GoogleDriveFile) => {
        // Only include top-level shared folders (no parents or parents not accessible)
        return !file.parents || file.parents.length === 0 || 
               !allFolders.some(folder => file.parents?.includes(folder.id));
      });

      // Mark shared folders with a prefix
      const markedSharedFolders = sharedFolders.map((folder: GoogleDriveFile) => ({
        ...folder,
        name: `[Shared] ${folder.name}`,
      }));

      allFolders = allFolders.concat(markedSharedFolders);

    } catch (error) {
      console.warn('Some shared content could not be loaded:', error);
    }

    return allFolders;
  }

  async downloadFile(fileId: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  async getFileMetadata(fileId: string): Promise<GoogleDriveFile> {
    return this.makeRequest(
      `/files/${fileId}?fields=id,name,mimeType,parents,modifiedTime,size`
    );
  }

  async searchFiles(query: string): Promise<GoogleDriveFile[]> {
    const params = new URLSearchParams({
      q: query,
      fields: "files(id,name,mimeType,parents,modifiedTime,size)",
      pageSize: "100",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });

    const response = await this.makeRequest(`/files?${params.toString()}`);
    return response.files;
  }

  // Get folder contents recursively
  async getFolderStructure(folderId: string): Promise<{ folders: GoogleDriveFile[]; files: GoogleDriveFile[] }> {
    const allFiles = await this.getAllFilesInFolder(folderId);
    
    const folders = allFiles.filter(file => file.mimeType === 'application/vnd.google-apps.folder');
    const files = allFiles.filter(file => file.mimeType !== 'application/vnd.google-apps.folder');

    return { folders, files };
  }
}
