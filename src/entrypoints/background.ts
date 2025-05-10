export default defineBackground(() => {
  // Cache the current settings to reduce storage reads
  let currentSettings = {
    enabled: false,
    intensity: 100,
    blacklist: ["localhost"],
    scheduleStart: "17:00",
    scheduleEnd: "09:00",
  };

  // Debounce helper to prevent too frequent tab updates
  const debounce = (func: Function, wait: number) => {
    let timeout: number | undefined;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait) as unknown as number;
    };
  };

  // Optimized version with hostname extraction helper
  const getHostname = (url: string): string => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return "";
    }
  };

  // Debounced version of applyGreyscale to prevent rapid repeated calls
  const applyGreyscaleToAllTabsDebounced = debounce(
    (intensity: number = 100, blacklist: string[] = []) => {
      // Get all tabs once instead of multiple individual queries
      browser.tabs.query({}).then((tabs) => {
        // Process URLs outside the loop for efficiency
        const tabsToUpdate = tabs.filter((tab) => {
          if (!tab.id || !tab.url) return false;
          const domain = getHostname(tab.url);
          return domain && !blacklist.includes(domain);
        });

        // Batch process tabs that need updating
        if (tabsToUpdate.length > 0) {
          for (const tab of tabsToUpdate) {
            if (tab.id) {
              browser.scripting
                .executeScript({
                  target: { tabId: tab.id },
                  func: (intensity: number) => {
                    let overlay = document.getElementById(
                      "monochromate-overlay"
                    );
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
                      z-index: 100000;
                      backdrop-filter: grayscale(${intensity}%) ;
                    `;
                      document.documentElement.appendChild(overlay);
                    } else {
                      overlay.style.backdropFilter = `grayscale(${intensity}%)`;
                    }
                  },
                  args: [intensity],
                })
                .catch(() => {
                  // Silently fail for tabs that can't be modified
                  // (e.g., chrome:// URLs, extension pages, etc.)
                });
            }
          }
        }
      });
    },
    100 // Debounce time in ms
  );

  // Optimized version with error handling
  const disableGreyscaleForAllTabs = () => {
    browser.tabs.query({}).then((tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          browser.scripting
            .executeScript({
              target: { tabId: tab.id },
              func: () => {
                const overlay = document.getElementById("monochromate-overlay");
                if (overlay) {
                  overlay.remove();
                }
              },
            })
            .catch(() => {
              // Silently fail for restricted tabs
            });
        }
      }
    });
  };

  // Optimized update function that only changes what's needed
  const updateSettings = (changes: Partial<typeof currentSettings>) => {
    const newSettings = { ...currentSettings, ...changes };

    // Only update storage if something changed
    if (JSON.stringify(newSettings) !== JSON.stringify(currentSettings)) {
      browser.storage.local.set({ Monofilter: newSettings });
      currentSettings = newSettings;

      // Apply changes if enabled
      if (newSettings.enabled) {
        applyGreyscaleToAllTabsDebounced(
          newSettings.intensity,
          newSettings.blacklist
        );
      } else if (changes.hasOwnProperty("enabled") && !newSettings.enabled) {
        disableGreyscaleForAllTabs();
      }
    }
  };

  // Initialize
  browser.storage.local.get("Monofilter").then((data) => {
    if (!data.Monofilter) {
      updateSettings({
        enabled: true,
        intensity: 100,
        blacklist: ["localhost"],
        scheduleStart: "17:00",
        scheduleEnd: "09:00",
      });
    } else {
      currentSettings = data.Monofilter;
      if (currentSettings.enabled) {
        applyGreyscaleToAllTabsDebounced(
          currentSettings.intensity,
          currentSettings.blacklist
        );
      }
    }
  });

  const updateScheduleAlarm = () => {
    browser.alarms.clear("StartMonochromate").then(() => {
      if (!currentSettings.scheduleStart) return;
      const [startHours, startMinutes] = currentSettings.scheduleStart
        .split(":")
        .map(Number);
      const startTime = getNextTime(startHours, startMinutes);
      browser.alarms.create("StartMonochromate", {
        when: startTime,
        periodInMinutes: 24 * 60,
      });
    });

    browser.alarms.clear("EndMonochromate").then(() => {
      if (!currentSettings.scheduleEnd) return;
      const [endHours, endMinutes] = currentSettings.scheduleEnd
        .split(":")
        .map(Number);
      const endTime = getNextTime(endHours, endMinutes);
      browser.alarms.create("EndMonochromate", {
        when: endTime,
        periodInMinutes: 24 * 60,
      });
    });
  };

  // Set initial alarm
  updateScheduleAlarm();

  function getNextTime(hour: number, minute: number): number {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    return target.getTime();
  }

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "StartMonochromate") {
      // Enable greyscale mode
      updateSettings({ enabled: true });
      applyGreyscaleToAllTabsDebounced(
        currentSettings.intensity,
        currentSettings.blacklist
      );
    } else if (alarm.name === "EndMonochromate") {
      // Disable greyscale mode
      updateSettings({ enabled: false });
      disableGreyscaleForAllTabs();
    }
  });

  // Optimized message handler
  browser.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      case "toggleGreyscale":
        updateSettings({
          enabled: !currentSettings.enabled,
          intensity: message.intensity || currentSettings.intensity,
        });
        break;
      case "setIntensity":
        updateSettings({
          enabled: true,
          intensity: message.value,
        });
        break;
      case "setBlacklist":
        updateSettings({
          blacklist: message.value,
        });
        break;
      case "setScheduleStart":
        updateSettings({
          scheduleStart: message.value,
        });
        updateScheduleAlarm();
        break;
      case "setScheduleEnd":
        updateSettings({
          scheduleEnd: message.value,
        });
        updateScheduleAlarm();
        break;
    }
  });

  // Listen for tab updates to apply greyscale to new tabs
  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === "complete" && currentSettings.enabled) {
      browser.tabs.get(tabId).then((tab) => {
        if (tab.url) {
          const domain = getHostname(tab.url);
          if (domain && !currentSettings.blacklist.includes(domain)) {
            browser.scripting
              .executeScript({
                target: { tabId },
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
                      z-index: 100000;
                      backdrop-filter: grayscale(${intensity}%) ;
                    `;
                    document.documentElement.appendChild(overlay);
                  } else {
                    overlay.style.backdropFilter = `grayscale(${intensity}%)`;
                  }
                },
                args: [currentSettings.intensity],
              })
              .catch(() => {
                // Ignore errors for restricted pages
              });
          }
        }
      });
    }
  });
});
