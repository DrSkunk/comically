export interface ComicSeries {
  id: string;
  name: string;
  folderId: string;
  comics: Comic[];
  coverImage?: string;
}

export interface Comic {
  id: string;
  name: string;
  fileId: string;
  seriesId: string;
  pages: Page[];
  currentPage: number;
  totalPages: number;
  lastRead?: Date;
}

export interface Page {
  id: string;
  blob: Blob;
  url: string;
  index: number;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime?: string;
  size?: string;
  shared?: boolean;
  sharingUser?: {
    displayName: string;
    emailAddress: string;
  };
}

export interface ReadingSettings {
  fitMode: "width" | "height" | "page";
  pageLayout: "single" | "double" | "continuous";
  readingDirection: "ltr" | "rtl";
  backgroundColor: string;
  showProgress: boolean;
}

export interface AppState {
  isAuthenticated: boolean;
  accessToken: string | null;
  selectedFolder: string | null;
  series: ComicSeries[];
  currentComic: Comic | null;
  readingSettings: ReadingSettings;
}
