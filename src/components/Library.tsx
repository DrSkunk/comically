import { useState, useEffect } from "react";
import {
  Book,
  Download,
  Play,
  Grid,
  List,
  Search,
  Settings,
  LogOut,
} from "lucide-react";
import { GoogleDriveService } from "../services/googleDriveService";
import { ComicService } from "../services/comicService";
import { StorageService } from "../services/storageService";
import type { ComicSeries, Comic } from "../types";

interface LibraryProps {
  accessToken: string;
  selectedFolder: string;
  folderName: string;
  onLogout: () => void;
  onOpenComic: (comic: Comic) => void;
  onSettings: () => void;
}

export function Library({
  accessToken,
  selectedFolder,
  folderName,
  onLogout,
  onOpenComic,
  onSettings,
}: LibraryProps) {
  const [series, setSeries] = useState<ComicSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingComics, setDownloadingComics] = useState<Set<string>>(
    new Set()
  );

  const driveService = new GoogleDriveService(accessToken);
  const comicService = new ComicService();
  const storageService = new StorageService();

  useEffect(() => {
    loadLibrary();
  }, [selectedFolder]);

  const loadLibrary = async () => {
    setLoading(true);
    setError(null);

    try {
      // First, try to load from storage
      const cachedSeries = await storageService.getSeries();
      if (cachedSeries.length > 0) {
        setSeries(cachedSeries);
      }

      // Then fetch fresh data from Google Drive
      const { folders: seriesFolders } = await driveService.getFolderStructure(
        selectedFolder
      );

      const newSeries: ComicSeries[] = [];

      for (const folder of seriesFolders) {
        try {
          const { files: comicFiles } = await driveService.getFolderStructure(
            folder.id
          );

          // Filter CBR/CBZ files
          const cbrFiles = comicFiles.filter(
            (file) =>
              file.name.toLowerCase().endsWith(".cbr") ||
              file.name.toLowerCase().endsWith(".cbz")
          );

          if (cbrFiles.length > 0) {
            const comics: Comic[] = cbrFiles.map((file) => ({
              id: file.id,
              name: file.name.replace(/\.(cbr|cbz)$/i, ""),
              fileId: file.id,
              seriesId: folder.id,
              pages: [],
              currentPage: 0,
              totalPages: 0,
            }));

            // Sort comics naturally
            comics.sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { numeric: true })
            );

            newSeries.push({
              id: folder.id,
              name: folder.name,
              folderId: folder.id,
              comics,
            });
          }
        } catch (err) {
          console.warn(`Failed to load series ${folder.name}:`, err);
        }
      }

      // Sort series alphabetically
      newSeries.sort((a, b) => a.name.localeCompare(b.name));

      setSeries(newSeries);
      await storageService.saveSeries(newSeries);
    } catch (err) {
      console.error("Failed to load library:", err);
      setError(
        "Failed to load library. Please check your permissions and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadAndOpenComic = async (comic: Comic) => {
    if (downloadingComics.has(comic.id)) return;

    setDownloadingComics((prev) => new Set([...prev, comic.id]));

    try {
      // Download and extract the comic
      const arrayBuffer = await driveService.downloadFile(comic.fileId);
      const pages = await comicService.extractPagesFromCBR(
        arrayBuffer,
        comic.id
      );

      const updatedComic: Comic = {
        ...comic,
        pages,
        totalPages: pages.length,
        currentPage: 0,
      };

      // Load reading progress if available
      const progress = await storageService.getComicProgress(comic.id);
      if (progress) {
        updatedComic.currentPage = progress.currentPage;
        updatedComic.lastRead = progress.lastRead;
      }

      // Update the comic in storage
      await storageService.saveComic(updatedComic);

      onOpenComic(updatedComic);
    } catch (err) {
      console.error("Failed to download comic:", err);
      setError(`Failed to open ${comic.name}. Please try again.`);
    } finally {
      setDownloadingComics((prev) => {
        const newSet = new Set(prev);
        newSet.delete(comic.id);
        return newSet;
      });
    }
  };

  const filteredSeries = series.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.comics.some((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (loading && series.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your comic library...</p>
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
              <Book className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Comically
                </h1>
                <p className="text-sm text-gray-500">{folderName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search comics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* View Toggle */}
              <div className="flex rounded-lg border border-gray-300">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600"
                  } rounded-l-lg`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600"
                  } rounded-r-lg`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={onSettings}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-800 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {filteredSeries.length === 0 ? (
          <div className="text-center py-12">
            <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "No comics found" : "No comics in library"}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? "Try adjusting your search terms."
                : "Add some CBR/CBZ files to your selected folder to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredSeries.map((seriesItem) => (
              <div
                key={seriesItem.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {seriesItem.name}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {seriesItem.comics.length} comic
                    {seriesItem.comics.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {seriesItem.comics.map((comic) => (
                      <div key={comic.id} className="group">
                        <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-2 relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Book className="w-8 h-8 text-gray-400" />
                          </div>
                          {comic.currentPage > 0 && (
                            <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                              {Math.round(
                                (comic.currentPage / comic.totalPages) * 100
                              )}
                              %
                            </div>
                          )}
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                          {comic.name}
                        </h3>
                        <button
                          onClick={() => downloadAndOpenComic(comic)}
                          disabled={downloadingComics.has(comic.id)}
                          className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 text-sm"
                        >
                          {downloadingComics.has(comic.id) ? (
                            <>
                              <Download className="w-4 h-4 animate-pulse" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              <span>Read</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {seriesItem.comics.map((comic) => (
                      <div
                        key={comic.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Book className="w-5 h-5 text-gray-400" />
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {comic.name}
                            </h3>
                            {comic.currentPage > 0 && (
                              <p className="text-sm text-gray-500">
                                Progress: {comic.currentPage}/{comic.totalPages}{" "}
                                pages
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => downloadAndOpenComic(comic)}
                          disabled={downloadingComics.has(comic.id)}
                          className="flex items-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                        >
                          {downloadingComics.has(comic.id) ? (
                            <>
                              <Download className="w-4 h-4 animate-pulse" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              <span>Read</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
