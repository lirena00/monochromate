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
    name: "Monochromate - The Best Greyscale Extension",
    version: "1.4.2",
    description:
      "Transform your web browsing with greyscale filter, site exclusions, and scheduling to reduce digital distractions doomscrolling",
    permissions: ["storage", "activeTab", "scripting", "alarms"],
  },
});
