import "~/assets/main.css";
import { ContentScriptContext } from "wxt/client";
import ReactDOM from "react-dom/client";

export default defineContentScript({
  matches: ["<all_urls>"],
  async main(ctx: ContentScriptContext) {
    browser.storage.local.get("Monofilter").then((data) => {
      if (data.Monofilter?.enabled) {
        document.documentElement.style.filter = `grayscale(${
          data.Monofilter.intensity ?? 100
        }%)`;
      }
    });
  },
});
