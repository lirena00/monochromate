import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  outDir: "dist",
  webExt: {
    startUrls: ["https://www.google.com/"],
  },
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Monochromate",
    version: "1.3.1",
    description:
      "An extension that greyscales the webpage to reduce doomscrolling",
    permissions: ["storage", "activeTab", "scripting", "alarms"],
  },
});
