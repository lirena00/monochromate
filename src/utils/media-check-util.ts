export const isDirectImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".bmp",
      ".svg",
    ];
    return imageExtensions.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
};

export const isDirectVideoUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const videoExtensions = [
      ".mp4",
      ".webm",
      ".ogg",
      ".avi",
      ".mov",
      ".wmv",
      ".flv",
      ".mkv",
      ".m4v",
    ];
    return videoExtensions.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
};

export const isDirectMediaUrl = (url: string): boolean => {
  return isDirectImageUrl(url) || isDirectVideoUrl(url);
};

// Cache for media check results to avoid repeated expensive operations
interface MediaCacheEntry {
  mediaCount: number;
  result: boolean;
  timestamp: number;
  type: "image" | "video" | "mixed" | "none";
}

const mediaCheckCache = new Map<string, MediaCacheEntry>();
const CACHE_DURATION = 5000; // 5 seconds cache
const CONTENT_LENGTH_THRESHOLD = 100; // Threshold for text content

const getCachedResult = (url: string): MediaCacheEntry | null => {
  const cached = mediaCheckCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached;
  }
  return null;
};

const setCachedResult = (
  url: string,
  result: boolean,
  mediaCount: number,
  type: MediaCacheEntry["type"]
): void => {
  mediaCheckCache.set(url, {
    result,
    timestamp: Date.now(),
    mediaCount,
    type,
  });
};

const hasMediaInTitle = (): boolean => {
  const titleLower = document.title.toLowerCase();
  const mediaKeywords = ["image", "photo", "picture", "video", "watch"];
  return mediaKeywords.some((keyword) => titleLower.includes(keyword));
};

const checkLargeMedia = (
  images: HTMLCollectionOf<HTMLImageElement>,
  videos: HTMLCollectionOf<HTMLVideoElement>
): boolean => {
  const LARGE_MEDIA_THRESHOLD = 400;

  for (const img of images) {
    if (
      img.naturalWidth > LARGE_MEDIA_THRESHOLD ||
      img.naturalHeight > LARGE_MEDIA_THRESHOLD
    ) {
      return true;
    }
  }

  for (const video of videos) {
    if (
      video.videoWidth > LARGE_MEDIA_THRESHOLD ||
      video.videoHeight > LARGE_MEDIA_THRESHOLD
    ) {
      return true;
    }
  }

  return false;
};

const hasVideoPlayer = (): boolean => {
  return (
    document.querySelector(
      'video, .video-player, .player, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="twitch"]'
    ) !== null
  );
};

const getMediaType = (
  imageCount: number,
  videoCount: number
): MediaCacheEntry["type"] => {
  if (imageCount > 0 && videoCount > 0) {
    return "mixed";
  }
  if (imageCount > 0) {
    return "image";
  }
  if (videoCount > 0) {
    return "video";
  }
  return "none";
};

export const isMediaOnlyPage = (): boolean => {
  try {
    const url = window.location.href;

    // Check cache first
    const cached = getCachedResult(url);
    if (cached) {
      return cached.result;
    }

    // Quick check for direct media URLs
    if (isDirectMediaUrl(url)) {
      const type = isDirectImageUrl(url) ? "image" : "video";
      setCachedResult(url, true, 1, type);
      return true;
    }

    // Wait for page to be loaded
    if (document.readyState !== "complete" || !document.body) {
      return false;
    }

    // Fast check using getElementsByTagName
    const images = document.getElementsByTagName("img");
    const videos = document.getElementsByTagName("video");
    const totalMediaCount = images.length + videos.length;

    // Quick exit for pages with no media or many media elements
    if (totalMediaCount === 0 || totalMediaCount > 3) {
      setCachedResult(url, false, totalMediaCount, "none");
      return false;
    }

    // For pages with 1-3 media elements, do more detailed content analysis
    const textContent = document.body.textContent?.trim() || "";
    const hasMinimalText = textContent.length < CONTENT_LENGTH_THRESHOLD;
    const isLargeMedia = checkLargeMedia(images, videos);

    const result =
      hasMinimalText || hasMediaInTitle() || isLargeMedia || hasVideoPlayer();
    const mediaType = getMediaType(images.length, videos.length);

    setCachedResult(url, result, totalMediaCount, mediaType);
    return result;
  } catch {
    return false;
  }
};

// Keep the old function for backward compatibility
export const isImageOnlyPage = (): boolean => {
  return isMediaOnlyPage();
};

// Clear cache when navigation occurs
export const clearImageCheckCache = () => {
  mediaCheckCache.clear();
};

export const clearMediaCheckCache = () => {
  mediaCheckCache.clear();
};
