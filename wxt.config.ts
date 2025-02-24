import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  outDir: "dist",
  extensionApi: "chrome",
  runner: {
    startUrls: ["https://www.gogle.com/"],
  },
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Monochromate",
    version: "1.0.1",
    description:
      "An extension that greyscales the webpage to reduce doomscrolling",
    permissions: ["storage", "scripting"],
  },
});
