import { ContentScriptContext } from "#imports";
import { isDirectImageUrl, isImageOnlyPage } from "@/utils/ImageCheckUtil";

const getCurrentHostname = () => {
  return window.location.hostname.replace("www.", "");
};

// Cache DOM nodes and reduce layout operations
let overlayElement: HTMLDivElement | null = null;
let currentSettings = {
  enabled: false,
  intensity: 100,
  blacklist: [] as string[],
  imageExceptionEnabled: true,
};
let isFullscreenActive = false;
let mutationObserver: MutationObserver | null = null;
let lastImageCheckTime = 0;
let lastImageCheckResult = false;

// Debounced image check to prevent excessive recalculations
const debouncedImageCheck = (() => {
  let timeout: number;
  return (callback: (isImageOnly: boolean) => void) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const now = Date.now();
      // Cache result for 2 seconds to prevent excessive checks
      if (now - lastImageCheckTime > 2000) {
        lastImageCheckResult = isImageOnlyPage();
        lastImageCheckTime = now;
      }
      callback(lastImageCheckResult);
    }, 300) as unknown as number;
  };
})();

// Use a single function to manage the overlay with efficient updates
const updateOverlay = (show: boolean, intensity: number = 100) => {
  if (show && !isFullscreenActive) {
    if (!overlayElement) {
      overlayElement = document.createElement("div");
      overlayElement.id = "monochromate-overlay";
      overlayElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 100000;
        backdrop-filter: grayscale(${intensity}%);
      `;
      document.documentElement.appendChild(overlayElement);
    } else {
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

// Improved function to determine if grayscale should be applied
const shouldApplyGrayscale = (isImageOnly: boolean): boolean => {
  const currentSite = getCurrentHostname();
  const isBlacklisted = currentSettings.blacklist.includes(currentSite);
  const isImageException = isImageOnly && currentSettings.imageExceptionEnabled;

  return currentSettings.enabled && !isBlacklisted && !isImageException;
};

const handleFullscreenChange = () => {
  const fullscreenElement = getFullscreenElement();
  const wasFullscreen = isFullscreenActive;
  isFullscreenActive = !!fullscreenElement;

  debouncedImageCheck((isImageOnly) => {
    const shouldApply = shouldApplyGrayscale(isImageOnly);

    if (isFullscreenActive && fullscreenElement) {
      updateOverlay(false);
      if (shouldApply) {
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

      // Apply overlay if needed
      if (shouldApply) {
        updateOverlay(true, currentSettings.intensity);
      }
    }
  });
};

// Function to handle content changes
const handleContentChange = () => {
  // Don't check too frequently
  debouncedImageCheck((isImageOnly) => {
    const shouldApply = shouldApplyGrayscale(isImageOnly);
    const fullscreenElement = getFullscreenElement();

    if (fullscreenElement && isFullscreenActive) {
      if (shouldApply) {
        applyFullscreenGreyscale(fullscreenElement, currentSettings.intensity);
      } else {
        removeFullscreenGreyscale(fullscreenElement);
      }
    } else {
      updateOverlay(shouldApply, currentSettings.intensity);
    }
  });
};

// Setup mutation observer to detect dynamic content changes
const setupMutationObserver = () => {
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  mutationObserver = new MutationObserver((mutations) => {
    let shouldCheck = false;

    for (const mutation of mutations) {
      // Check if significant changes occurred
      if (mutation.type === 'childList') {
        // New images or videos added/removed
        const hasMediaChanges = Array.from(mutation.addedNodes)
          .concat(Array.from(mutation.removedNodes))
          .some(node =>
            node instanceof Element &&
            (node.tagName === 'IMG' || node.tagName === 'VIDEO' || node.tagName === 'CANVAS' ||
              node.querySelector && node.querySelector('img, video, canvas'))
          );

        if (hasMediaChanges) {
          shouldCheck = true;
          break;
        }
      }
    }

    if (shouldCheck) {
      handleContentChange();
    }
  });

  mutationObserver.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    attributes: false
  });
};

export default defineContentScript({
  matches: ["<all_urls>"],
  async main(ctx: ContentScriptContext) {
    // Check if URL is a direct image file - moved inside main function
    const isDirectImage = isDirectImageUrl(window.location.href);
    
    const currentSite = getCurrentHostname();
    const initialSettings = await settings.getValue();

    currentSettings = {
      enabled: initialSettings.enabled,
      intensity: initialSettings.intensity,
      blacklist: initialSettings.blacklist,
      imageExceptionEnabled: initialSettings.imageExceptionEnabled ?? true,
    };

    const initializeGrayscale = () => {
      debouncedImageCheck((isImageOnly) => {
        const shouldApply = shouldApplyGrayscale(isImageOnly);

        if (shouldApply) {
          const fullscreenElement = getFullscreenElement();
          if (fullscreenElement) {
            isFullscreenActive = true;
            applyFullscreenGreyscale(fullscreenElement, currentSettings.intensity);
          } else {
            updateOverlay(true, currentSettings.intensity);
          }
        }
      });
    };

    // Initialize after page load
    if (document.readyState === 'complete') {
      initializeGrayscale();
    } else {
      window.addEventListener('load', initializeGrayscale);
    }

    // Setup mutation observer
    setupMutationObserver();

    const unwatchSettings = settings.watch((newSettings, oldSettings) => {
      if (newSettings) {
        currentSettings = {
          enabled: newSettings.enabled,
          intensity: newSettings.intensity,
          blacklist: newSettings.blacklist,
          imageExceptionEnabled: newSettings.imageExceptionEnabled ?? true,
        };

        // Re-evaluate when settings change
        debouncedImageCheck((isImageOnly) => {
          const shouldApply = shouldApplyGrayscale(isImageOnly);
          const fullscreenElement = getFullscreenElement();

          if (fullscreenElement && isFullscreenActive) {
            if (shouldApply) {
              applyFullscreenGreyscale(fullscreenElement, newSettings.intensity);
            } else {
              removeFullscreenGreyscale(fullscreenElement);
            }
          } else {
            updateOverlay(shouldApply, newSettings.intensity);
          }
        });
      }
    });

    // Event listeners for fullscreen changes
    ["fullscreenchange", "webkitfullscreenchange"].forEach((event) => {
      document.addEventListener(event, handleFullscreenChange);
    });

    // Cleanup function
    ctx.onInvalidated(() => {
      ["fullscreenchange", "webkitfullscreenchange"].forEach((event) => {
        document.removeEventListener(event, handleFullscreenChange);
      });

      window.removeEventListener('load', initializeGrayscale);

      if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
      }

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