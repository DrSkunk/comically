import { useState, useEffect } from 'react';
import { Folder, ChevronRight, BookOpen, ArrowLeft, Loader2 } from 'lucide-react';
import { GoogleDriveService } from './services/googleDriveService';
import type { GoogleDriveFile } from './types';

interface FolderPickerProps {
  accessToken: string;
  onFolderSelected: (folderId: string, folderName: string) => void;
  onBack: () => void;
}

export function FolderPicker({ accessToken, onFolderSelected, onBack }: FolderPickerProps) {
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: 'My Drive' }
  ]);
  const [folders, setFolders] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const driveService = new GoogleDriveService(accessToken);

  useEffect(() => {
    loadFolders(currentFolder);
  }, [currentFolder]);

  const loadFolders = async (folderId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { folders: folderList } = await driveService.getFolderStructure(folderId);
      setFolders(folderList);
    } catch (err) {
      console.error('Failed to load folders:', err);
      setError('Failed to load folders. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folder: GoogleDriveFile) => {
    setCurrentFolder(folder.id);
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
  };

  const navigateToParent = (targetIndex: number) => {
    const targetFolder = folderPath[targetIndex];
    setCurrentFolder(targetFolder.id);
    setFolderPath(folderPath.slice(0, targetIndex + 1));
  };

  const selectCurrentFolder = () => {
    const currentFolderInfo = folderPath[folderPath.length - 1];
    onFolderSelected(currentFolder, currentFolderInfo.name);
  };

  if (loading && folders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg">Loading folders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Select Comic Library Folder
              </h1>
            </div>
            <button
              onClick={selectCurrentFolder}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Select This Folder
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />}
                <button
                  onClick={() => navigateToParent(index)}
                  className={`hover:text-blue-600 transition-colors ${
                    index === folderPath.length - 1 
                      ? 'text-gray-900 font-medium' 
                      : 'text-gray-600'
                  }`}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {folders.length === 0 && !loading ? (
          <div className="text-center py-12">
            <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No folders found
            </h3>
            <p className="text-gray-600">
              This folder doesn't contain any subfolders.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => navigateToFolder(folder)}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 text-left group"
              >
                <div className="flex items-center mb-3">
                  <Folder className="w-8 h-8 text-blue-500 group-hover:text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 truncate">
                  {folder.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Folder
                </p>
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border-t border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start space-x-3">
            <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Choose your comic library folder</p>
              <p>
                Select a folder that contains subfolders for each comic series. 
                Each series folder should contain CBR/CBZ files.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

  if (!authContext) {
    return <div>Authentication context not available</div>;
  }

  const { pickFolder, accessToken } = authContext;

  const handlePickFolder = async () => {
    if (!accessToken) {
      alert("Please log in first");
      return;
    }

    setIsLoading(true);
    try {
      const folder = await pickFolder();
      setSelectedFolder(folder);
    } catch (error) {
      console.error("Error picking folder:", error);
      alert(
        "Error picking folder. Make sure VITE_GOOGLE_API_KEY is set in your environment variables."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
            </div>
      </div>
    </div>
  );
}
  );
}
