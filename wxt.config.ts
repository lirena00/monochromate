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
    version: "1.5.0",
    description:
      "Transform your web browsing with greyscale filter, site exclusions, and scheduling to reduce digital distractions doomscrolling",
    permissions: ["storage", "activeTab", "scripting", "alarms", "commands"],
    commands: {
      toggle_greyscale: {
        suggested_key: {
          default: "Alt+M",
          mac: "Alt+M",
        },
        description: "Toggle Monochromate on/off",
      },
      quick_toggle_blacklist: {
        suggested_key: {
          default: "Alt+B",
          mac: "Alt+B",
        },
        description: "Quick toggle current website blacklist",
      },
      increase_intensity: {
        suggested_key: {
          default: "Alt+Shift+Right",
          mac: "Alt+Shift+Right",
        },
        description: "Increase greyscale intensity",
      },
      decrease_intensity: {
        suggested_key: {
          default: "Alt+Shift+Left",
          mac: "Alt+Shift+Left",
        },
        description: "Decrease greyscale intensity",
      },
    },
  },
});
