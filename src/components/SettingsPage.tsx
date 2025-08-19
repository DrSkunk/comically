import { useState } from "react";
import { ArrowLeft, Trash2, Download, HardDrive } from "lucide-react";
import { StorageService } from "../services/storageService";
import type { ReadingSettings } from "../types";

interface SettingsPageProps {
  readingSettings: ReadingSettings;
  onSettingsChange: (settings: ReadingSettings) => void;
  onBack: () => void;
}

export function SettingsPage({
  readingSettings,
  onSettingsChange,
  onBack,
}: SettingsPageProps) {
  const [cacheSize, setCacheSize] = useState<number | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const storageService = new StorageService();

  const loadCacheSize = async () => {
    try {
      const size = await storageService.getCacheSize();
      setCacheSize(size);
    } catch (error) {
      console.error("Failed to get cache size:", error);
    }
  };

  const clearCache = async () => {
    setIsClearing(true);
    try {
      await storageService.clearCache();
      setCacheSize(0);
    } catch (error) {
      console.error("Failed to clear cache:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const removeOldComics = async () => {
    try {
      await storageService.removeOldComics(30);
      loadCacheSize();
    } catch (error) {
      console.error("Failed to remove old comics:", error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-xl font-semibold text-gray-900 ml-4">
              Settings
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Reading Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Reading Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fit Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Fit Mode
                </label>
                <select
                  value={readingSettings.fitMode}
                  onChange={(e) =>
                    onSettingsChange({
                      ...readingSettings,
                      fitMode: e.target.value as any,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="width">Fit to Width</option>
                  <option value="height">Fit to Height</option>
                  <option value="page">Fit to Page</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  How images should be sized by default
                </p>
              </div>

              {/* Page Layout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Layout
                </label>
                <select
                  value={readingSettings.pageLayout}
                  onChange={(e) =>
                    onSettingsChange({
                      ...readingSettings,
                      pageLayout: e.target.value as any,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="single">Single Page</option>
                  <option value="double">Double Page Spread</option>
                  <option value="continuous">Continuous Scroll</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Single page, double page, or continuous scrolling
                </p>
              </div>

              {/* Reading Direction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reading Direction
                </label>
                <select
                  value={readingSettings.readingDirection}
                  onChange={(e) =>
                    onSettingsChange({
                      ...readingSettings,
                      readingDirection: e.target.value as any,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ltr">Left to Right</option>
                  <option value="rtl">Right to Left (Manga)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Direction for page navigation
                </p>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={readingSettings.backgroundColor}
                    onChange={(e) =>
                      onSettingsChange({
                        ...readingSettings,
                        backgroundColor: e.target.value,
                      })
                    }
                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        onSettingsChange({
                          ...readingSettings,
                          backgroundColor: "#000000",
                        })
                      }
                      className="w-8 h-8 bg-black rounded border-2 border-gray-300 hover:border-blue-500"
                    />
                    <button
                      onClick={() =>
                        onSettingsChange({
                          ...readingSettings,
                          backgroundColor: "#ffffff",
                        })
                      }
                      className="w-8 h-8 bg-white rounded border-2 border-gray-300 hover:border-blue-500"
                    />
                    <button
                      onClick={() =>
                        onSettingsChange({
                          ...readingSettings,
                          backgroundColor: "#1f2937",
                        })
                      }
                      className="w-8 h-8 bg-gray-800 rounded border-2 border-gray-300 hover:border-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Background color for the reading area
                </p>
              </div>
            </div>

            {/* Show Progress */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Show Reading Progress
                  </h3>
                  <p className="text-xs text-gray-500">
                    Display progress bar and page numbers
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={readingSettings.showProgress}
                    onChange={(e) =>
                      onSettingsChange({
                        ...readingSettings,
                        showProgress: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Storage Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Storage Management
            </h2>

            <div className="space-y-6">
              {/* Cache Size */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <HardDrive className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Cache Size
                    </h3>
                    <p className="text-xs text-gray-500">
                      {cacheSize !== null ? formatBytes(cacheSize) : "Unknown"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={loadCacheSize}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Refresh
                </button>
              </div>

              {/* Clear Cache */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Trash2 className="w-5 h-5 text-red-400" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Clear All Data
                    </h3>
                    <p className="text-xs text-gray-500">
                      Remove all downloaded comics and progress
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearCache}
                  disabled={isClearing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 text-sm"
                >
                  {isClearing ? "Clearing..." : "Clear Cache"}
                </button>
              </div>

              {/* Remove Old Comics */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-orange-400" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Remove Old Comics
                    </h3>
                    <p className="text-xs text-gray-500">
                      Delete comics not read in the last 30 days
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeOldComics}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  Clean Up
                </button>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Keyboard Shortcuts
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Next Page</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">→</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Previous Page</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">←</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Zoom In</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">+</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Zoom Out</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">-</kbd>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Reset Zoom</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">0</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fullscreen</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">F</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Exit/Back</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">
                    Esc
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Zoom (Mouse)</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-xs rounded">
                    Ctrl + Scroll
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              About Comically
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Comically is a client-side comic book reader that connects to
                your Google Drive to provide a seamless reading experience for
                your CBR and CBZ files.
              </p>

              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  <strong>Version:</strong> 1.0.0
                </p>
                <p className="text-xs text-gray-500">
                  <strong>Supported Formats:</strong> CBR, CBZ
                </p>
                <p className="text-xs text-gray-500">
                  <strong>Privacy:</strong> All data is stored locally in your
                  browser
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
