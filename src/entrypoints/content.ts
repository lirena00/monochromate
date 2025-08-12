import { ContentScriptContext } from "#imports";

const getCurrentHostname = () => {
  return window.location.hostname.replace("www.", "");
};

// Cache DOM nodes and reduce layout operations
let overlayElement: HTMLDivElement | null = null;
let currentSettings = {
  enabled: false,
  intensity: 100,

  temporaryDisable: false,
  temporaryDisableUntil: null as number | null,
   skipMediaPage:true,

};
let isFullscreenActive = false;

// // Use a single function to manage the overlay with efficient updates
// const updateOverlay = (show: boolean, intensity: number = 100) => {
//   // Check if we should skip media-only pages
//   if (show && currentSettings.skipMediaOnlyPages && isMediaOnlyPage()) {
//     show = false;
//   }

//   if (show && !isFullscreenActive) {
//     // ...existing overlay creation code...
//   } else if (overlayElement) {
//     overlayElement.remove();
//     overlayElement = null;
//   }
// };


// Use a single function to manage the overlay with efficient updates
const updateOverlay = (show: boolean, intensity: number = 100) => {
  if (show && !isFullscreenActive && !currentSettings.temporaryDisable) {
    if (!overlayElement) {
      overlayElement = document.createElement("div");
      overlayElement.id = "monochromate-overlay";
      // Set all styles at once to reduce style recalculations
      overlayElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 2147483647;
        backdrop-filter: grayscale(${intensity}%);
      `;
      document.documentElement.appendChild(overlayElement);
    } else {
      // Only update the property that changed
      overlayElement.style.backdropFilter = `grayscale(${intensity}%)`;
    }
  } else if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
};

const applyFullscreenGreyscale = (element: Element, intensity: number) => {
  if (element instanceof HTMLElement) {
    element.style.filter = `grayscale(${intensity}%)`;
    element.style.transition = "filter 0.2s ease";
  }
};

const removeFullscreenGreyscale = (element: Element) => {
  if (element instanceof HTMLElement) {
    element.style.filter = "";
    element.style.transition = "";
  }
};

const getFullscreenElement = (): Element | null => {
  return (
    document.fullscreenElement || (document as any).webkitFullscreenElement
  );
};

const handleFullscreenChange = () => {
  const fullscreenElement = getFullscreenElement();
  const wasFullscreen = isFullscreenActive;
  isFullscreenActive = !!fullscreenElement;

  if (isFullscreenActive && fullscreenElement) {
    updateOverlay(false);
    const currentSite = getCurrentHostname();
    if (
      currentSettings.enabled &&
      !currentSettings.temporaryDisable &&
      !currentSettings.blacklist.includes(currentSite)
    ) {
      applyFullscreenGreyscale(fullscreenElement, currentSettings.intensity);
    }
  } else if (wasFullscreen) {
    if (fullscreenElement) {
      removeFullscreenGreyscale(fullscreenElement);
    }

    document.querySelectorAll('[style*="grayscale"]').forEach((element) => {
      if (
        element instanceof HTMLElement &&
        element.style.filter.includes("grayscale")
      ) {
        removeFullscreenGreyscale(element);
      }
    });

    if (currentSettings.enabled && !currentSettings.temporaryDisable) {
      const currentSite = getCurrentHostname();
      const shouldShowOverlay =
        !currentSettings.blacklist.includes(currentSite);
      updateOverlay(shouldShowOverlay, currentSettings.intensity);
    }
  }
};

const isMediaOnlyPage = (): boolean => {
  // Get all visible elements in the body
  const bodyElements = document.body?.children;
  if (!bodyElements || bodyElements.length === 0) return false;

  let mediaElementCount = 0;
  let totalRelevantElements = 0;

  // Helper function to check if element is meaningful content
  const isMeaningfulElement = (element: Element): boolean => {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    const style = window.getComputedStyle(element);
    
    // Skip hidden elements
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    
    // Skip script, style, meta, link tags
    if (['script', 'style', 'meta', 'link', 'noscript', 'head'].includes(tagName)) {
      return false;
    }
    
    return true;
  };

    // Helper function to check if element is media
  const isMediaElement = (element: Element): boolean => {
    const tagName = element.tagName.toLowerCase();
    return ['img', 'video', 'audio', 'canvas', 'svg', 'picture', 'source'].includes(tagName);
  };

  // Recursively analyze elements
  const analyzeElements = (elements: HTMLCollection) => {
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      
      if (!isMeaningfulElement(element)) continue;
      
      totalRelevantElements++;
      
      if (isMediaElement(element)) {
        mediaElementCount++;
      } else {
        // Check if this element contains significant text content
        const textContent = element.textContent?.trim() || '';
        const hasSignificantText = textContent.length > 50; // More than 50 chars of text
        
        // If it has significant text, it's not media-only
        if (hasSignificantText) {
          return false;
        }
        
        // Recursively check children
        if (element.children.length > 0) {
          const childResult = analyzeElements(element.children);
          if (childResult === false) return false;
        }
      }
    }
    return true;
  };

  const isMediaOnly = analyzeElements(bodyElements);
  
  // Consider it media-only if:
  // 1. We found meaningful elements
  // 2. At least 80% are media elements
  // 3. Or if we only have media elements and minimal other content
  const mediaRatio = totalRelevantElements > 0 ? mediaElementCount / totalRelevantElements : 0;
  
  return isMediaOnly && mediaRatio >= 0.8 && mediaElementCount > 0;
};

export default defineContentScript({
  matches: ["<all_urls>"],
  async main(ctx: ContentScriptContext) {
    const currentSite = getCurrentHostname();
    const initialSettings = await settings.getValue();

    currentSettings = {
      enabled: initialSettings.enabled,
      intensity: initialSettings.intensity,
      blacklist: initialSettings.blacklist,

      temporaryDisable: initialSettings.temporaryDisable || false,
      temporaryDisableUntil: initialSettings.temporaryDisableUntil || null,
        skipMediaPage:initialSettings.skipMediaPage
    };

    if (
      currentSettings.enabled &&
      !currentSettings.temporaryDisable &&
      !currentSettings.blacklist.includes(currentSite)
    ) {
      const fullscreenElement = getFullscreenElement();
      if (fullscreenElement) {
        isFullscreenActive = true;
        applyFullscreenGreyscale(fullscreenElement, currentSettings.intensity);
      } else {
        updateOverlay(true, currentSettings.intensity);
      }
    }

    const unwatchSettings = settings.watch((newSettings, oldSettings) => {
      if (newSettings) {
        currentSettings = {
          enabled: newSettings.enabled,
          intensity: newSettings.intensity,
          blacklist: newSettings.blacklist,

          temporaryDisable: newSettings.temporaryDisable || false,
          temporaryDisableUntil: newSettings.temporaryDisableUntil || null,
               skipMediaPage:newSettings.skipMediaPage

        };

        const shouldShowOverlay =
          newSettings.enabled &&
          !newSettings.temporaryDisable &&
          !newSettings.blacklist.includes(currentSite);

        const fullscreenElement = getFullscreenElement();
        if (fullscreenElement && isFullscreenActive) {
          if (shouldShowOverlay) {
            applyFullscreenGreyscale(fullscreenElement, newSettings.intensity);
          } else {
            removeFullscreenGreyscale(fullscreenElement);
          }
        } else {
          updateOverlay(shouldShowOverlay, newSettings.intensity);
        }
      }
    });

    // Listen for background script messages
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === "temporaryDisableSet") {
        console.log(`Monochromate temporarily disabled for ${message.duration} minutes`);
      }
    });

    ["fullscreenchange", "webkitfullscreenchange"].forEach((event) => {
      document.addEventListener(event, handleFullscreenChange);
    });

    ctx.onInvalidated(() => {
      ["fullscreenchange", "webkitfullscreenchange"].forEach((event) => {
        document.removeEventListener(event, handleFullscreenChange);
      });

      if (overlayElement) {
        overlayElement.remove();
        overlayElement = null;
      }

      document.querySelectorAll('[style*="grayscale"]').forEach((element) => {
        if (
          element instanceof HTMLElement &&
          element.style.filter.includes("grayscale")
        ) {
          removeFullscreenGreyscale(element);
        }
      });
    });
  },
});
