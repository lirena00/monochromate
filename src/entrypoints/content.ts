import { ContentScriptContext } from "#imports";

const getCurrentHostname = () => {
  return window.location.hostname.replace("www.", "");
};

// Cache DOM nodes and reduce layout operations
let overlayElement: HTMLDivElement | null = null;
let currentSettings = {
  enabled: false,
  intensity: 100,
  blacklist: [] as string[],
};
let isFullscreenActive = false;

// Use a single function to manage the overlay with efficient updates
const updateOverlay = (show: boolean, intensity: number = 100) => {
  if (show && !isFullscreenActive) {
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
        z-index: 100000;
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
    if (currentSettings.enabled) {
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

    if (currentSettings.enabled) {
      const currentSite = getCurrentHostname();
      const shouldShowOverlay =
        !currentSettings.blacklist.includes(currentSite);
      updateOverlay(shouldShowOverlay, currentSettings.intensity);
    }
  }
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
    };

    if (
      currentSettings.enabled &&
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
        };

        const shouldShowOverlay =
          newSettings.enabled && !newSettings.blacklist.includes(currentSite);

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
