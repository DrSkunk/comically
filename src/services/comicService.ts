import JSZip from "jszip";
import type { Comic, Page } from "../types";

export class ComicService {
  async extractPagesFromCBR(
    arrayBuffer: ArrayBuffer,
    comicId: string
  ): Promise<Page[]> {
    try {
      const zip = new JSZip();
      const zipFile = await zip.loadAsync(arrayBuffer);
      const pages: Page[] = [];

      // Get all image files and sort them naturally
      const imageFiles = Object.keys(zipFile.files)
        .filter((fileName) => {
          const file = zipFile.files[fileName];
          return !file.dir && this.isImageFile(fileName);
        })
        .sort(this.naturalSort);

      for (let i = 0; i < imageFiles.length; i++) {
        const fileName = imageFiles[i];
        const file = zipFile.files[fileName];

        try {
          const blob = await file.async("blob");
          const url = URL.createObjectURL(blob);

          pages.push({
            id: `${comicId}-page-${i}`,
            blob,
            url,
            index: i,
          });
        } catch (error) {
          console.warn(`Failed to extract page ${fileName}:`, error);
        }
      }

      return pages;
    } catch (error) {
      console.error("Failed to extract pages from CBR:", error);
      throw new Error("Failed to extract pages from comic file");
    }
  }

  private isImageFile(fileName: string): boolean {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
    const extension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf("."));
    return imageExtensions.includes(extension);
  }

  private naturalSort(a: string, b: string): number {
    const regex = /(\d+)|(\D+)/g;
    const aParts = a.match(regex) || [];
    const bParts = b.match(regex) || [];

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || "";
      const bPart = bParts[i] || "";

      if (/^\d+$/.test(aPart) && /^\d+$/.test(bPart)) {
        const diff = parseInt(aPart, 10) - parseInt(bPart, 10);
        if (diff !== 0) return diff;
      } else {
        const diff = aPart.localeCompare(bPart);
        if (diff !== 0) return diff;
      }
    }

    return 0;
  }

  async preloadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  async preloadPages(
    pages: Page[],
    startIndex: number = 0,
    count: number = 3
  ): Promise<void> {
    const pagesToPreload = pages.slice(startIndex, startIndex + count);

    await Promise.allSettled(
      pagesToPreload.map((page) => this.preloadImage(page.url))
    );
  }

  cleanupPageUrls(pages: Page[]): void {
    pages.forEach((page) => {
      if (page.url.startsWith("blob:")) {
        URL.revokeObjectURL(page.url);
      }
    });
  }

  getComicProgress(comic: Comic): number {
    if (comic.totalPages === 0) return 0;
    return (comic.currentPage / comic.totalPages) * 100;
  }

  updateComicProgress(comic: Comic, pageIndex: number): Comic {
    return {
      ...comic,
      currentPage: pageIndex,
      lastRead: new Date(),
    };
  }
}
