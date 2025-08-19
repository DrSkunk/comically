import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { LoginPage } from "./components/LoginPage";
import { FolderPicker } from "./components/FolderPicker";
import { Library } from "./components/Library";
import { ComicReader } from "./components/ComicReader";
import { SettingsPage } from "./components/SettingsPage";
import { StorageService } from "./services/storageService";
import type { Comic, ReadingSettings } from "./types";

type AppState = "login" | "folder-picker" | "library" | "reader" | "settings";

export function App() {
  const [currentState, setCurrentState] = useState<AppState>("login");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string>("");
  const [currentComic, setCurrentComic] = useState<Comic | null>(null);
  const [readingSettings, setReadingSettings] = useState<ReadingSettings>({
    fitMode: "width",
    pageLayout: "single",
    readingDirection: "ltr",
    backgroundColor: "#000000",
    showProgress: true,
  });

  const storageService = new StorageService();

  // Load saved data on startup
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedToken = await storageService.getAccessToken();
        const savedFolder = await storageService.getSelectedFolder();
        const savedSettings = await storageService.getReadingSettings();

        if (savedToken) {
          setAccessToken(savedToken);
          if (savedFolder) {
            setSelectedFolder(savedFolder);
            setCurrentState("library");
          } else {
            setCurrentState("folder-picker");
          }
        }

        setReadingSettings(savedSettings);
      } catch (error) {
        console.error("Failed to load saved data:", error);
      }
    };

    loadSavedData();
  }, []);

  const handleLoginSuccess = async (token: string) => {
    setAccessToken(token);
    await storageService.saveAccessToken(token);
    setCurrentState("folder-picker");
  };

  const handleFolderSelected = async (folderId: string, folderName: string) => {
    setSelectedFolder(folderId);
    setFolderName(folderName);
    await storageService.saveSelectedFolder(folderId);
    setCurrentState("library");
  };

  const handleOpenComic = (comic: Comic) => {
    setCurrentComic(comic);
    setCurrentState("reader");
  };

  const handleCloseComic = () => {
    setCurrentComic(null);
    setCurrentState("library");
  };

  const handleSettingsChange = async (newSettings: ReadingSettings) => {
    setReadingSettings(newSettings);
    await storageService.saveReadingSettings(newSettings);
  };

  const handleLogout = async () => {
    await storageService.clearAccessToken();
    setAccessToken(null);
    setSelectedFolder(null);
    setFolderName("");
    setCurrentComic(null);
    setCurrentState("login");
  };

  const handleOpenSettings = () => {
    setCurrentState("settings");
  };

  const handleBackFromSettings = () => {
    if (currentComic) {
      setCurrentState("reader");
    } else {
      setCurrentState("library");
    }
  };

  // Render based on current state
  switch (currentState) {
    case "login":
      return <LoginPage onLoginSuccess={handleLoginSuccess} />;

    case "folder-picker":
      if (!accessToken) return <Navigate to="/" replace />;
      return (
        <FolderPicker
          accessToken={accessToken}
          onFolderSelected={handleFolderSelected}
          onBack={handleLogout}
        />
      );

    case "library":
      if (!accessToken || !selectedFolder) return <Navigate to="/" replace />;
      return (
        <Library
          accessToken={accessToken}
          selectedFolder={selectedFolder}
          folderName={folderName}
          onLogout={handleLogout}
          onOpenComic={handleOpenComic}
          onSettings={handleOpenSettings}
        />
      );

    case "reader":
      if (!currentComic) return <Navigate to="/" replace />;
      return (
        <ComicReader
          comic={currentComic}
          onBack={handleCloseComic}
          onSettingsChange={handleSettingsChange}
          readingSettings={readingSettings}
        />
      );

    case "settings":
      return (
        <SettingsPage
          readingSettings={readingSettings}
          onSettingsChange={handleSettingsChange}
          onBack={handleBackFromSettings}
        />
      );

    default:
      return <Navigate to="/" replace />;
  }
}
