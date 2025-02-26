export default defineBackground(() => {
  browser.storage.local.get("Monofilter").then((data) => {
    if (!data.Monofilter) {
      browser.storage.local.set({
        Monofilter: {
          enabled: false,
          intensity: 100,
          blacklist: ["localhost"],
        },
      });
    } else if (data.Monofilter.enabled) {
      applyGreyscaleToAllTabs(data.Monofilter.intensity ?? 100);
    }
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "toggleGreyscale") {
      browser.storage.local.get("Monofilter").then((data) => {
        const currentSettings = data.Monofilter;
        const intensity =
          message.intensity ?? currentSettings?.intensity ?? 100;
        const blacklist = currentSettings?.blacklist ?? [];

        if (currentSettings?.enabled) {
          disableGreyscaleForAllTabs();
          browser.storage.local.set({
            Monofilter: {
              ...currentSettings,
              enabled: false,
            },
          });
        } else {
          applyGreyscaleToAllTabs(intensity);
          browser.storage.local.set({
            Monofilter: {
              ...currentSettings,
              enabled: true,
              intensity,
            },
          });
        }
      });
    }

    if (message.type === "setIntensity") {
      browser.storage.local.get("Monofilter").then((data) => {
        const currentSettings = data.Monofilter;
        const intensity = message.value;

        browser.storage.local.set({
          Monofilter: {
            ...currentSettings,
            enabled: true,
            intensity,
          },
        });
        applyGreyscaleToAllTabs(intensity);
      });
    }
    if (message.type === "setBlacklist") {
      browser.storage.local.get("Monofilter").then((data) => {
        const currentSettings = data.Monofilter;
        const newBlacklist = message.value;

        browser.storage.local.set({
          Monofilter: {
            ...currentSettings,
            blacklist: newBlacklist,
          },
        });

        if (currentSettings.enabled) {
          applyGreyscaleToAllTabs(currentSettings.intensity);
        }
      });
    }
  });

  function applyGreyscaleToAllTabs(intensity: number) {
    browser.storage.local.get("Monofilter").then((data) => {
      const blacklist = data.Monofilter?.blacklist ?? [];

      browser.tabs.query({}).then((tabs) => {
        tabs.forEach((tab) => {
          if (tab.id && tab.url) {
            const url = new URL(tab.url);
            const domain = url.hostname.replace("www.", "");

            if (!blacklist.includes(domain)) {
              browser.scripting.executeScript({
                target: { tabId: tab.id },
                func: (intensity: number) => {
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
                      z-index: 100;
                      backdrop-filter: grayscale(${intensity}%) ;
                    `;
                    document.documentElement.appendChild(overlay);
                  } else {
                    overlay.style.backdropFilter = `grayscale(${intensity}%)`;
                  }
                },
                args: [intensity],
              });
            }
          }
        });
      });
    });
  }

  function disableGreyscaleForAllTabs() {
    browser.tabs.query({}).then((tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          browser.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              const overlay = document.getElementById("monochromate-overlay");
              if (overlay) {
                overlay.remove();
              }
            },
          });
        }
      });
    });
  }
});
