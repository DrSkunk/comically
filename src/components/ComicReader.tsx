import { useState, useEffect, useCallback, useRef } from "react";
import { useSpring, animated } from "@react-spring/web";
import { useGesture } from "@use-gesture/react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Settings,
  RotateCcw,
  X,
  BookOpen,
} from "lucide-react";
import { StorageService } from "../services/storageService";
import { ComicService } from "../services/comicService";
import type { Comic, ReadingSettings } from "../types";

interface ComicReaderProps {
  comic: Comic;
  onBack: () => void;
  onSettingsChange: (settings: ReadingSettings) => void;
  readingSettings: ReadingSettings;
}

export function ComicReader({
  comic,
  onBack,
  onSettingsChange,
  readingSettings,
}: ComicReaderProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(comic.currentPage);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const continuousScrollRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const storageService = new StorageService();
  const comicService = new ComicService();

  const isContinuousMode = readingSettings.pageLayout === "continuous";
  const currentPage = comic.pages[currentPageIndex];
  const progress = ((currentPageIndex + 1) / comic.totalPages) * 100;

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls]);

  // Save progress when page changes
  useEffect(() => {
    const saveProgress = async () => {
      await storageService.saveComicProgress(comic.id, {
        currentPage: currentPageIndex,
        lastRead: new Date(),
      });
    };
    saveProgress();
  }, [currentPageIndex, comic.id]);

  // Preload adjacent pages
  useEffect(() => {
    comicService.preloadPages(comic.pages, currentPageIndex, 3);
  }, [currentPageIndex, comic.pages]);

  // Update current page based on scroll position in continuous mode
  useEffect(() => {
    if (!isContinuousMode || !continuousScrollRef.current) return;

    const handleScroll = () => {
      const container = continuousScrollRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const centerY = scrollTop + containerHeight / 2;

      // Find which image is currently in the center of the viewport
      for (let i = 0; i < imageRefs.current.length; i++) {
        const img = imageRefs.current[i];
        if (!img) continue;

        const rect = img.getBoundingClientRect();
        const imgTop = rect.top + scrollTop;
        const imgBottom = imgTop + rect.height;

        if (centerY >= imgTop && centerY <= imgBottom) {
          if (i !== currentPageIndex) {
            setCurrentPageIndex(i);
          }
          break;
        }
      }
    };

    const container = continuousScrollRef.current;
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isContinuousMode, currentPageIndex]);

  // Spring animation for pan and zoom (single page mode)
  const [{ transform }, api] = useSpring(() => ({
    transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
  }));

  // Gesture handling for single page mode
  const bind = useGesture(
    {
      onDrag: ({ offset: [x, y], pinching }) => {
        if (pinching || zoom <= 1 || isContinuousMode) return;
        setPosition({ x, y });
        api.start({
          transform: `translate3d(${x}px, ${y}px, 0) scale(${zoom})`,
        });
      },
      onPinch: ({ offset: [scale] }) => {
        if (isContinuousMode) return;
        const newZoom = Math.max(0.5, Math.min(5, scale));
        setZoom(newZoom);
        if (newZoom <= 1) {
          setPosition({ x: 0, y: 0 });
          api.start({
            transform: `translate3d(0px, 0px, 0) scale(${newZoom})`,
          });
        } else {
          api.start({
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${newZoom})`,
          });
        }
      },
      onWheel: ({ delta: [, dy], ctrlKey }) => {
        if (isContinuousMode) return;
        if (ctrlKey) {
          // Zoom with Ctrl+wheel
          const newZoom = Math.max(0.5, Math.min(5, zoom - dy * 0.001));
          setZoom(newZoom);
          if (newZoom <= 1) {
            setPosition({ x: 0, y: 0 });
            api.start({
              transform: `translate3d(0px, 0px, 0) scale(${newZoom})`,
            });
          }
        }
      },
    },
    {
      drag: {
        bounds: () => {
          if (zoom <= 1 || isContinuousMode)
            return { left: 0, right: 0, top: 0, bottom: 0 };
          const img = imageRefs.current[currentPageIndex];
          if (!img) return { left: 0, right: 0, top: 0, bottom: 0 };
          return {
            left: -((zoom - 1) * img.width) / 2,
            right: ((zoom - 1) * img.width) / 2,
            top: -((zoom - 1) * img.height) / 2,
            bottom: ((zoom - 1) * img.height) / 2,
          };
        },
      },
      pinch: { scaleBounds: { min: 0.5, max: 5 } },
    }
  );

  const nextPage = useCallback(() => {
    if (isContinuousMode) {
      // Scroll to next page
      const nextImg = imageRefs.current[currentPageIndex + 1];
      if (nextImg && continuousScrollRef.current) {
        nextImg.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    if (readingSettings.readingDirection === "rtl") {
      if (currentPageIndex > 0) {
        setCurrentPageIndex(currentPageIndex - 1);
        resetView();
      }
    } else {
      if (currentPageIndex < comic.totalPages - 1) {
        setCurrentPageIndex(currentPageIndex + 1);
        resetView();
      }
    }
  }, [
    currentPageIndex,
    comic.totalPages,
    readingSettings.readingDirection,
    isContinuousMode,
  ]);

  const previousPage = useCallback(() => {
    if (isContinuousMode) {
      // Scroll to previous page
      const prevImg = imageRefs.current[currentPageIndex - 1];
      if (prevImg && continuousScrollRef.current) {
        prevImg.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    if (readingSettings.readingDirection === "rtl") {
      if (currentPageIndex < comic.totalPages - 1) {
        setCurrentPageIndex(currentPageIndex + 1);
        resetView();
      }
    } else {
      if (currentPageIndex > 0) {
        setCurrentPageIndex(currentPageIndex - 1);
        resetView();
      }
    }
  }, [
    currentPageIndex,
    comic.totalPages,
    readingSettings.readingDirection,
    isContinuousMode,
  ]);

  const resetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    api.start({ transform: "translate3d(0px, 0px, 0) scale(1)" });
  };

  const zoomIn = () => {
    if (isContinuousMode) return;
    const newZoom = Math.min(5, zoom * 1.5);
    setZoom(newZoom);
    api.start({
      transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${newZoom})`,
    });
  };

  const zoomOut = () => {
    if (isContinuousMode) return;
    const newZoom = Math.max(0.5, zoom / 1.5);
    setZoom(newZoom);
    if (newZoom <= 1) {
      setPosition({ x: 0, y: 0 });
      api.start({
        transform: `translate3d(0px, 0px, 0) scale(${newZoom})`,
      });
    } else {
      api.start({
        transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${newZoom})`,
      });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          previousPage();
          break;
        case "ArrowRight":
        case " ":
          nextPage();
          break;
        case "Escape":
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onBack();
          }
          break;
        case "+":
        case "=":
          zoomIn();
          break;
        case "-":
          zoomOut();
          break;
        case "0":
          resetView();
          break;
        case "f":
          toggleFullscreen();
          break;
        default:
          return;
      }
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPageIndex, isFullscreen, onBack, previousPage, nextPage]);

  const getImageStyle = () => {
    const style: React.CSSProperties = {};

    if (isContinuousMode) {
      // In continuous mode, always fit to width and maintain aspect ratio
      style.width = "100%";
      style.height = "auto";
      style.display = "block";
      style.margin = "0 auto";
    } else {
      switch (readingSettings.fitMode) {
        case "width":
          style.width = "100%";
          style.height = "auto";
          break;
        case "height":
          style.height = "100%";
          style.width = "auto";
          break;
        case "page":
          style.maxWidth = "100%";
          style.maxHeight = "100%";
          style.objectFit = "contain";
          break;
      }
    }

    return style;
  };

  const handleImageLoad = (pageIndex: number) => {
    setLoadedImages((prev) => new Set([...prev, pageIndex]));
  };

  const handleImageError = (pageIndex: number) => {
    setImageErrors((prev) => new Set([...prev, pageIndex]));
  };

  if (!currentPage && !isContinuousMode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Page not found</p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50" : "min-h-screen"
      }`}
      style={{ backgroundColor: readingSettings.backgroundColor }}
      onClick={() => setShowControls(!showControls)}
      {...(isContinuousMode ? {} : bind())}
    >
      {isContinuousMode ? (
        // Continuous scroll mode
        <div
          ref={continuousScrollRef}
          className="h-screen overflow-y-auto overflow-x-hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>
            {`
              .continuous-scroll::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
          <div className="continuous-scroll">
            {comic.pages.map((page, index) => (
              <div key={page.id} className="relative">
                <img
                  ref={(el) => {
                    imageRefs.current[index] = el;
                  }}
                  src={page.url}
                  alt={`Page ${index + 1}`}
                  style={getImageStyle()}
                  className="block"
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                  draggable={false}
                />
                {!loadedImages.has(index) && !imageErrors.has(index) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p>Loading page {index + 1}...</p>
                    </div>
                  </div>
                )}
                {imageErrors.has(index) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-white text-center">
                      <p className="text-lg mb-4">
                        Failed to load page {index + 1}
                      </p>
                      <button
                        onClick={() => {
                          setImageErrors((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(index);
                            return newSet;
                          });
                          setLoadedImages((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(index);
                            return newSet;
                          });
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Single page mode
        <>
          <div className="w-full h-screen flex items-center justify-center">
            <animated.div
              style={{ transform }}
              className="flex items-center justify-center"
            >
              <img
                ref={(el) => {
                  imageRefs.current[currentPageIndex] = el;
                }}
                src={currentPage.url}
                alt={`Page ${currentPageIndex + 1}`}
                style={getImageStyle()}
                className="cursor-move"
                onLoad={() => handleImageLoad(currentPageIndex)}
                onError={() => handleImageError(currentPageIndex)}
                draggable={false}
              />
            </animated.div>
          </div>

          {/* Navigation Areas for single page */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              previousPage();
            }}
            className="absolute left-0 top-0 w-1/3 h-full z-10 flex items-center justify-start pl-4"
            style={{ background: "transparent" }}
          >
            <div
              className={`p-2 rounded-full bg-black/20 transition-opacity ${
                showControls ? "opacity-100" : "opacity-0"
              }`}
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </div>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextPage();
            }}
            className="absolute right-0 top-0 w-1/3 h-full z-10 flex items-center justify-end pr-4"
            style={{ background: "transparent" }}
          >
            <div
              className={`p-2 rounded-full bg-black/20 transition-opacity ${
                showControls ? "opacity-100" : "opacity-0"
              }`}
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </div>
          </button>

          {/* Loading State for single page */}
          {!loadedImages.has(currentPageIndex) &&
            !imageErrors.has(currentPageIndex) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Loading page...</p>
                </div>
              </div>
            )}

          {/* Error State for single page */}
          {imageErrors.has(currentPageIndex) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center">
                <p className="text-lg mb-4">Failed to load page</p>
                <button
                  onClick={() => {
                    setImageErrors((prev) => {
                      const newSet = new Set(prev);
                      newSet.delete(currentPageIndex);
                      return newSet;
                    });
                    setLoadedImages((prev) => {
                      const newSet = new Set(prev);
                      newSet.delete(currentPageIndex);
                      return newSet;
                    });
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Top Controls */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 transition-opacity duration-300 z-10 ${
          showControls
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-white font-medium">{comic.name}</h1>
            {isContinuousMode && (
              <div className="flex items-center space-x-2 text-white/80">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">Continuous</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="p-2 text-white hover:text-gray-300 transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className="p-2 text-white hover:text-gray-300 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 z-10 ${
          showControls
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-white text-sm">
              {currentPageIndex + 1} / {comic.totalPages}
            </span>
            <div className="w-32 bg-gray-300 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {!isContinuousMode && (
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  zoomOut();
                }}
                className="p-2 text-white hover:text-gray-300 transition-colors"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-white text-sm min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  zoomIn();
                }}
                className="p-2 text-white hover:text-gray-300 transition-colors"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetView();
                }}
                className="p-2 text-white hover:text-gray-300 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div 
          className="absolute top-0 right-0 bg-black/90 text-white p-6 w-80 h-full overflow-y-auto z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Reading Settings</h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(false);
              }}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Fit Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">Fit Mode</label>
              <select
                value={readingSettings.fitMode}
                onChange={(e) => {
                  e.stopPropagation();
                  onSettingsChange({
                    ...readingSettings,
                    fitMode: e.target.value as any,
                  });
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                disabled={isContinuousMode}
              >
                <option value="width">Fit Width</option>
                <option value="height">Fit Height</option>
                <option value="page">Fit Page</option>
              </select>
              {isContinuousMode && (
                <p className="text-xs text-gray-400 mt-1">
                  Disabled in continuous mode
                </p>
              )}
            </div>

            {/* Page Layout */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Page Layout
              </label>
              <select
                value={readingSettings.pageLayout}
                onChange={(e) => {
                  e.stopPropagation();
                  onSettingsChange({
                    ...readingSettings,
                    pageLayout: e.target.value as any,
                  });
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="single">Single Page</option>
                <option value="double">Double Page</option>
                <option value="continuous">Continuous Scroll</option>
              </select>
            </div>

            {/* Reading Direction */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Reading Direction
              </label>
              <select
                value={readingSettings.readingDirection}
                onChange={(e) => {
                  e.stopPropagation();
                  onSettingsChange({
                    ...readingSettings,
                    readingDirection: e.target.value as any,
                  });
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="ltr">Left to Right</option>
                <option value="rtl">Right to Left</option>
              </select>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Background Color
              </label>
              <input
                type="color"
                value={readingSettings.backgroundColor}
                onChange={(e) => {
                  e.stopPropagation();
                  onSettingsChange({
                    ...readingSettings,
                    backgroundColor: e.target.value,
                  });
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-10 bg-gray-800 border border-gray-600 rounded-lg"
              />
            </div>

            {/* Show Progress */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Show Progress</label>
              <input
                type="checkbox"
                checked={readingSettings.showProgress}
                onChange={(e) => {
                  e.stopPropagation();
                  onSettingsChange({
                    ...readingSettings,
                    showProgress: e.target.checked,
                  });
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
