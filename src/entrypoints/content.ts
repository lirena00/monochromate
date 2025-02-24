import { ContentScriptContext } from "wxt/client";

const getCurrentHostname = () => {
  return window.location.hostname.replace("www.", "");
};

const createOrUpdateOverlay = (intensity: number) => {
  let overlay = document.getElementById("monochromate-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "monochromate-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 2147483647;
      backdrop-filter: grayscale(${intensity}%) !important;
    `;
    document.documentElement.appendChild(overlay);
  } else {
    overlay.style.backdropFilter = `grayscale(${intensity}%) !important`;
  }
};

const removeOverlay = () => {
  const overlay = document.getElementById("monochromate-overlay");
  if (overlay) {
    overlay.remove();
  }
};

export default defineContentScript({
  matches: ["<all_urls>"],
  async main(ctx: ContentScriptContext) {
    browser.storage.local.get("Monofilter").then((data) => {
      if (!data.Monofilter?.enabled) return;
      if (data.Monofilter?.enabled) {
        const currentSite = getCurrentHostname();
        const blacklist = data.Monofilter.blacklist ?? [];

        if (!blacklist.includes(currentSite)) {
          createOrUpdateOverlay(data.Monofilter.intensity ?? 100);
        }
      }
    });

    browser.storage.onChanged.addListener((changes) => {
      if (changes.Monofilter) {
        const {
          enabled,
          intensity,
          blacklist = [],
        } = changes.Monofilter.newValue ?? {};
        const currentSite = getCurrentHostname();

        if (enabled && !blacklist.includes(currentSite)) {
          createOrUpdateOverlay(intensity ?? 100);
        } else {
          removeOverlay();
        }
      }
    });
  },
});
