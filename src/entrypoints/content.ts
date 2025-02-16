import "~/assets/main.css";
import { ContentScriptContext } from "wxt/client";

const getCurrentHostname = () => {
  return window.location.hostname.replace("www.", "");
};

export default defineContentScript({
  matches: ["<all_urls>"],
  async main(ctx: ContentScriptContext) {
    browser.storage.local.get("Monofilter").then((data) => {
      if (data.Monofilter?.enabled) {
        const currentSite = getCurrentHostname();
        const blacklist = data.Monofilter.blacklist ?? [];

        if (!blacklist.includes(currentSite)) {
          document.documentElement.style.filter = `grayscale(${
            data.Monofilter.intensity ?? 100
          }%)`;
        } else {
          document.documentElement.style.filter = "";
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

        document.documentElement.style.filter =
          enabled && !blacklist.includes(currentSite)
            ? `grayscale(${intensity ?? 100}%)`
            : "";
      }
    });
  },
});
