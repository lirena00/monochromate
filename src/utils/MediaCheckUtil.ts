export const isDirectImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    return imageExtensions.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
};

export const isDirectVideoUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.m4v'];
    return videoExtensions.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
};

export const isDirectMediaUrl = (url: string): boolean => {
  return isDirectImageUrl(url) || isDirectVideoUrl(url);
};

// Cache for media check results to avoid repeated expensive operations
const mediaCheckCache = new Map<string, { result: boolean; timestamp: number; mediaCount: number; type: 'image' | 'video' | 'mixed' | 'none' }>();
const CACHE_DURATION = 5000; // 5 seconds cache
const CONTENT_LENGTH_THRESHOLD = 100; // Threshold for text content

export const isMediaOnlyPage = (): boolean => {
  try {
    const url = window.location.href;
    const now = Date.now();
    
    // Check cache first
    const cached = mediaCheckCache.get(url);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.result;
    }

    // Quick check for direct media URLs
    if (isDirectMediaUrl(url)) {
      mediaCheckCache.set(url, { result: true, timestamp: now, mediaCount: 1, type: isDirectImageUrl(url) ? 'image' : 'video' });
      return true;
    }

    // Wait for page to be loaded
    if (document.readyState !== 'complete' || !document.body) {
      return false;
    }

    // Fast check using getElementsByTagName
    const images = document.getElementsByTagName('img');
    const videos = document.getElementsByTagName('video');
    const totalMediaCount = images.length + videos.length;
    
    // Quick exit for pages with no media or many media elements
    if (totalMediaCount === 0 || totalMediaCount > 3) {
      const result = false;
      mediaCheckCache.set(url, { result, timestamp: now, mediaCount: totalMediaCount, type: 'none' });
      return result;
    }

    // For pages with 1-3 media elements, do more detailed content analysis
    let result = false;
    let mediaType: 'image' | 'video' | 'mixed' | 'none' = 'none';
    
    if (totalMediaCount <= 3) {
      // Use textContent instead of innerText for better performance
      const textContent = document.body.textContent?.trim() || '';
      const hasMinimalText = textContent.length < CONTENT_LENGTH_THRESHOLD;
      
      // Additional checks for media-focused pages
      const hasMediaInTitle = document.title.toLowerCase().includes('image') || 
                             document.title.toLowerCase().includes('photo') ||
                             document.title.toLowerCase().includes('picture') ||
                             document.title.toLowerCase().includes('video') ||
                             document.title.toLowerCase().includes('watch');
      
      // Check if media takes up significant viewport space
      let isLargeMedia = false;
      
      if (images.length > 0) {
        const img = images[0];
        isLargeMedia = img && (img.naturalWidth > 400 || img.naturalHeight > 400);
        mediaType = videos.length > 0 ? 'mixed' : 'image';
      }
      
      if (videos.length > 0) {
        const video = videos[0];
        isLargeMedia = isLargeMedia || (video && (video.videoWidth > 400 || video.videoHeight > 400));
        mediaType = images.length > 0 ? 'mixed' : 'video';
      }
      
      // Check for common video player containers
      const hasVideoPlayer = document.querySelector('video, .video-player, .player, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="twitch"]') !== null;
      
      result = hasMinimalText || hasMediaInTitle || isLargeMedia || hasVideoPlayer;
    }

    // Cache the result
    mediaCheckCache.set(url, { result, timestamp: now, mediaCount: totalMediaCount, type: mediaType });
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