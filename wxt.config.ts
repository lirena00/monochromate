import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  outDir: "dist",
  extensionApi: "chrome",
  runner: {
    startUrls: ["https://www.google.com/"],
  },
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Monochromate",
    version: "1.0.2",
    description:
      "A browser extension that applies a grayscale filter to websites, reducing eye strain and helping prevent doomscrolling. Customize intensity, exclude sites, and browse more mindfully.",
    permissions: ["storage", "activeTab", "scripting"],
  },
});
