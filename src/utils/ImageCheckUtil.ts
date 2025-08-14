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
  
export const isImageOnlyPage = (): boolean => {
  try {
    // Check for direct image URLs first
    if (isDirectImageUrl(window.location.href)) {
      return true;
    }

    // Wait for page to be fully loaded
    if (document.readyState !== 'complete' || !document.body) {
      return false;
    }

    // Check for pages with a single image and minimal content
    const images = document.images;
    if (images.length === 1 && document.body.innerText.trim().length < 50) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};
  