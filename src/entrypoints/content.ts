import "~/assets/main.css";
import { ContentScriptContext } from "wxt/client";
import ReactDOM from 'react-dom/client';

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode:"ui",
  async main(ctx) {


  },
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "toggleGreyscale") {
    const existingStyle = document.getElementById("greyscale-style");

    if (existingStyle) {
      existingStyle.remove(); // Remove greyscale if already applied
    } else {
      const style = document.createElement("style");
      style.id = "greyscale-style";
      style.textContent = "html { filter: grayscale(100%); }";
      document.head.appendChild(style);
    }
  }
});
