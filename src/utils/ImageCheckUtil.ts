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
      if (document.readyState !== 'complete') {
        return false;
      }
  
      const body = document.body;
      if (!body) {
        return false;
      }
  
      // Check if it's a simple image viewer (like browsers' built-in image viewer)
      const images = Array.from(body.querySelectorAll('img'));
      if (images.length === 1) {
        const img = images[0];
        const rect = img.getBoundingClientRect();
        const viewportArea = window.innerWidth * window.innerHeight;
        const imageArea = rect.width * rect.height;
        
        // Single large image taking significant viewport space
        if (imageArea > viewportArea * 0.3) {
          const textContent = body.innerText.trim();
          // Very minimal text content suggests image-only page
          if (textContent.length < 100) {
            return true;
          }
        }
      }
  
      // Check for gallery-like pages with minimal content
      const allElements = body.querySelectorAll('*');
      const mediaElements = body.querySelectorAll('img, video, canvas');
      const textNodes = body.innerText.trim();
  
      // Few elements, mostly media, minimal text
      if (allElements.length <= 15 && mediaElements.length > 0 && textNodes.length < 50) {
        return true;
      }
  
      // Check for dominant media element
      const dominantMedia = Array.from(mediaElements).find(element => {
        const rect = element.getBoundingClientRect();
        const elementArea = rect.width * rect.height;
        const viewportArea = window.innerWidth * window.innerHeight;
        return elementArea > viewportArea * 0.6; // Takes up >60% of viewport
      });
  
      return !!dominantMedia;
    } catch {
      return false;
    }
  };
  