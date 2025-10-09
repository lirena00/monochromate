import { ContentScriptContext } from "#imports";
import {
  isDirectMediaUrl,
  isMediaOnlyPage,
  clearMediaCheckCache,
} from "@/utils/MediaCheckUtil";

const getCurrentHostname = () => {
  return window.location.hostname.replace("www.", "");
};

let overlayElement: HTMLDivElement | null = null;
let currentSettings = {
  enabled: false,
  intensity: 100,
  blacklist: [] as string[],
  temporaryDisable: false,
  temporaryDisableUntil: null as number | null,
  imageExceptionEnabled: false,
};

let isFullscreenActive = false;
let mutationObserver: MutationObserver | null = null;

// Cache media check result for the current page
let cachedMediaOnlyResult: boolean | null = null;
let lastUrl = "";

// Reduced debounce time for better responsiveness
const createDebouncer = (delay: number) => {
  let timeout: number;
  return (callback: () => void) => {
    clearTimeout(timeout);
    timeout = setTimeout(callback, delay) as unknown as number;
  };
};

const quickMediaCheck = createDebouncer(50); // Much faster debounce
const mediumMediaCheck = createDebouncer(150); // For mutation observer

const getMediaOnlyStatus = (): boolean => {
  const currentUrl = window.location.href;

  // Clear cache if URL changed
  if (currentUrl !== lastUrl) {
    cachedMediaOnlyResult = null;
    lastUrl = currentUrl;
    clearMediaCheckCache();
  }

  // Use cached result if available
  if (cachedMediaOnlyResult !== null) {
    return cachedMediaOnlyResult;
  }

  // Compute and cache result
  cachedMediaOnlyResult = isMediaOnlyPage();
  return cachedMediaOnlyResult;
};

const updateOverlay = (show: boolean, intensity: number = 100) => {
  if (show && !isFullscreenActive && !currentSettings.temporaryDisable) {
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
        z-index: 2147483647;
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

const shouldApplyGrayscale = (): boolean => {
  const currentSite = getCurrentHostname();
  const isBlacklisted = currentSettings.blacklist.includes(currentSite);
  const isMediaOnly = getMediaOnlyStatus();
  const isMediaException = isMediaOnly && currentSettings.imageExceptionEnabled;
  return (
    currentSettings.enabled &&
    !currentSettings.temporaryDisable &&
    !isBlacklisted &&
    !isMediaException
  );
};

const applyGrayscaleEffect = () => {
  const shouldApply = shouldApplyGrayscale();
  const fullscreenElement = getFullscreenElement();

  if (isFullscreenActive && fullscreenElement) {
    if (shouldApply) {
      applyFullscreenGreyscale(fullscreenElement, currentSettings.intensity);
    } else {
      removeFullscreenGreyscale(fullscreenElement);
    }
  } else {
    updateOverlay(shouldApply, currentSettings.intensity);
  }
};

const handleFullscreenChange = () => {
  const fullscreenElement = getFullscreenElement();
  const wasFullscreen = isFullscreenActive;
  isFullscreenActive = !!fullscreenElement;

  if (isFullscreenActive && fullscreenElement) {
    updateOverlay(false);
  } else if (wasFullscreen) {
    // Clean up any fullscreen grayscale
    document.querySelectorAll('[style*="grayscale"]').forEach((element) => {
      if (
        element instanceof HTMLElement &&
        element.style.filter.includes("grayscale")
      ) {
        removeFullscreenGreyscale(element);
      }
    });
  }

  // Apply effect immediately without debounce for fullscreen changes
  applyGrayscaleEffect();
};

const setupMutationObserver = () => {
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  mutationObserver = new MutationObserver((mutations) => {
    let hasSignificantChange = false;

    // Only check for significant changes that might affect media detection
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        const hasMediaChanges = [
          ...mutation.addedNodes,
          ...mutation.removedNodes,
        ].some((node) => {
          if (!(node instanceof Element)) return false;
          return (
            node.tagName === "IMG" ||
            node.tagName === "VIDEO" ||
            (node.querySelector &&
              (node.querySelector("img") || node.querySelector("video")))
          );
        });
        if (hasMediaChanges) {
          hasSignificantChange = true;
          break;
        }
      }
    }

    if (hasSignificantChange) {
      // Clear cache since content changed
      cachedMediaOnlyResult = null;

      // Use medium debounce for mutation changes
      mediumMediaCheck(() => {
        applyGrayscaleEffect();
      });
    }
  });

  mutationObserver.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    attributes: false,
  });
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
      imageExceptionEnabled: initialSettings.mediaExceptionEnabled,
      temporaryDisable: initialSettings.temporaryDisable,
      temporaryDisableUntil: initialSettings.temporaryDisableUntil,
    };

    const initializeGrayscale = () => {
      // Use quick debounce for initial load
      quickMediaCheck(() => {
        applyGrayscaleEffect();
      });
    };

    if (document.readyState === "complete") {
      initializeGrayscale();
    } else {
      window.addEventListener("load", initializeGrayscale);
    }

    setupMutationObserver();

    const unwatchSettings = settings.watch((newSettings) => {
      if (newSettings) {
        currentSettings = {
          enabled: newSettings.enabled,
          intensity: newSettings.intensity,
          blacklist: newSettings.blacklist,
          temporaryDisable: newSettings.temporaryDisable,
          temporaryDisableUntil: newSettings.temporaryDisableUntil,
          imageExceptionEnabled: newSettings.mediaExceptionEnabled,
        };

        // Apply changes immediately for settings updates
        applyGrayscaleEffect();
      }
    });

    // Initial application
    if (
      currentSettings.enabled &&
      !currentSettings.temporaryDisable &&
      !currentSettings.blacklist.includes(currentSite)
    ) {
      applyGrayscaleEffect();
    }

    browser.runtime.onMessage.addListener((message) => {
      if (message.type === "temporaryDisableSet") {
        console.log(
          `Monochromate temporarily disabled for ${message.duration} minutes`
        );
      }
    });

    ["fullscreenchange", "webkitfullscreenchange"].forEach((event) => {
      document.addEventListener(event, handleFullscreenChange);
    });

    // Clear cache on navigation
    const handleNavigation = () => {
      cachedMediaOnlyResult = null;
      clearMediaCheckCache();
    };

    window.addEventListener("beforeunload", handleNavigation);
    window.addEventListener("popstate", handleNavigation);

    ctx.onInvalidated(() => {
      ["fullscreenchange", "webkitfullscreenchange"].forEach((event) => {
        document.removeEventListener(event, handleFullscreenChange);
      });

      window.removeEventListener("load", initializeGrayscale);
      window.removeEventListener("beforeunload", handleNavigation);
      window.removeEventListener("popstate", handleNavigation);

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
      unwatchSettings();
      clearMediaCheckCache();
    });
  },
});
