import { ContentScriptContext } from "#imports";

const getCurrentHostname = () => {
  return window.location.hostname.replace("www.", "");
};

// Cache DOM nodes and reduce layout operations
let overlayElement: HTMLDivElement | null = null;

// Use a single function to manage the overlay with efficient updates
const updateOverlay = (show: boolean, intensity: number = 100) => {
  if (show) {
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

export default defineContentScript({
  matches: ["<all_urls>"],
  async main(ctx: ContentScriptContext) {
    const currentSite = getCurrentHostname();

    // Get initial settings
    browser.storage.local.get("Monofilter").then((data) => {
      const settings = data.Monofilter;
      if (!settings?.enabled) return;

      const blacklist = settings.blacklist || [];
      if (!blacklist.includes(currentSite)) {
        updateOverlay(true, settings.intensity || 100);
      }
    });

    // Listen for settings changes
    browser.storage.onChanged.addListener((changes) => {
      if (changes.Monofilter) {
        const newValue = changes.Monofilter.newValue || {};
        const { enabled = false, intensity = 100, blacklist = [] } = newValue;

        const shouldShowOverlay = enabled && !blacklist.includes(currentSite);
        updateOverlay(shouldShowOverlay, intensity);
      }
    });
  },
});
