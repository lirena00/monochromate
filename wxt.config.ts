import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  outDir:"dist",
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
});
