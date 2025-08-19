import localforage from "localforage";
import type { ComicSeries, Comic, ReadingSettings } from "../types";

// Configure localforage
localforage.config({
  name: "ComicallyApp",
  version: 1.0,
  storeName: "comics",
});

export class StorageService {
  private static readonly KEYS = {
    SERIES: "comic_series",
    READING_SETTINGS: "reading_settings",
    ACCESS_TOKEN: "access_token",
    SELECTED_FOLDER: "selected_folder",
    COMIC_PROGRESS: "comic_progress",
  };

  // Series management
  async saveSeries(series: ComicSeries[]): Promise<void> {
    await localforage.setItem(StorageService.KEYS.SERIES, series);
  }

  async getSeries(): Promise<ComicSeries[]> {
    const series = await localforage.getItem<ComicSeries[]>(
      StorageService.KEYS.SERIES
    );
    return series || [];
  }

  async saveComic(comic: Comic): Promise<void> {
    const series = await this.getSeries();
    const seriesIndex = series.findIndex((s) => s.id === comic.seriesId);

    if (seriesIndex !== -1) {
      const comicIndex = series[seriesIndex].comics.findIndex(
        (c) => c.id === comic.id
      );
      if (comicIndex !== -1) {
        series[seriesIndex].comics[comicIndex] = comic;
      } else {
        series[seriesIndex].comics.push(comic);
      }
      await this.saveSeries(series);
    }
  }

  async getComic(comicId: string): Promise<Comic | null> {
    const series = await this.getSeries();
    for (const s of series) {
      const comic = s.comics.find((c) => c.id === comicId);
      if (comic) return comic;
    }
    return null;
  }

  // Reading settings
  async saveReadingSettings(settings: ReadingSettings): Promise<void> {
    await localforage.setItem(StorageService.KEYS.READING_SETTINGS, settings);
  }

  async getReadingSettings(): Promise<ReadingSettings> {
    const settings = await localforage.getItem<ReadingSettings>(
      StorageService.KEYS.READING_SETTINGS
    );
    return (
      settings || {
        fitMode: "width",
        pageLayout: "single",
        readingDirection: "ltr",
        backgroundColor: "#000000",
        showProgress: true,
      }
    );
  }

  // Authentication
  async saveAccessToken(token: string): Promise<void> {
    await localforage.setItem(StorageService.KEYS.ACCESS_TOKEN, token);
  }

  async getAccessToken(): Promise<string | null> {
    return await localforage.getItem<string>(StorageService.KEYS.ACCESS_TOKEN);
  }

  async clearAccessToken(): Promise<void> {
    await localforage.removeItem(StorageService.KEYS.ACCESS_TOKEN);
  }

  // Folder selection
  async saveSelectedFolder(folderId: string): Promise<void> {
    await localforage.setItem(StorageService.KEYS.SELECTED_FOLDER, folderId);
  }

  async getSelectedFolder(): Promise<string | null> {
    return await localforage.getItem<string>(
      StorageService.KEYS.SELECTED_FOLDER
    );
  }

  // Comic progress
  async saveComicProgress(
    comicId: string,
    progress: { currentPage: number; lastRead: Date }
  ): Promise<void> {
    const allProgress =
      (await localforage.getItem<
        Record<string, { currentPage: number; lastRead: Date }>
      >(StorageService.KEYS.COMIC_PROGRESS)) || {};
    allProgress[comicId] = progress;
    await localforage.setItem(StorageService.KEYS.COMIC_PROGRESS, allProgress);
  }

  async getComicProgress(
    comicId: string
  ): Promise<{ currentPage: number; lastRead: Date } | null> {
    const allProgress =
      (await localforage.getItem<
        Record<string, { currentPage: number; lastRead: Date }>
      >(StorageService.KEYS.COMIC_PROGRESS)) || {};
    return allProgress[comicId] || null;
  }

  // Cache management
  async clearCache(): Promise<void> {
    await localforage.clear();
  }

  async getCacheSize(): Promise<number> {
    let totalSize = 0;
    await localforage.iterate((value) => {
      if (value) {
        totalSize += JSON.stringify(value).length;
      }
    });
    return totalSize;
  }

  async removeOldComics(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const series = await this.getSeries();
    const updatedSeries = series.map((s) => ({
      ...s,
      comics: s.comics.filter((comic) => {
        if (!comic.lastRead) return true;
        return new Date(comic.lastRead) > cutoffDate;
      }),
    }));

    await this.saveSeries(updatedSeries);
  }
}
