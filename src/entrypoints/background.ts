import { isImageOnlyPage } from "@/utils/ImageCheckUtil";
import { settings } from "@/utils/storage";

export default defineBackground(() => {
  let settingsInitialized = false;

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

  const getFullscreenElement = (): Element | null => {
    return (
      document.fullscreenElement || (document as any).webkitFullscreenElement
    );
  };

  // Function to determine if grayscale should be applied
  const shouldApplyGrayscale = (domain: string, isImageOnly: boolean, settings: any): boolean => {
    return (
      settings.enabled &&
      domain &&
      !settings.blacklist.includes(domain) &&
      !(isImageOnly && settings.imageExceptionEnabled)
    );
  };

  // Debounced version of applyGreyscale 
  const applyGreyscaleToAllTabsDebounced = debounce(
    (intensity: number = 100, blacklist: string[] = [], imageExceptionEnabled: boolean = false) => {
      browser.tabs.query({}).then((tabs) => {
        const tabsToUpdate = tabs.filter((tab) => {
          if (!tab.id || !tab.url) return false;
          const domain = getHostname(tab.url);
          return domain && !blacklist.includes(domain);
        });

        // Batch process tabs that need updating
        if (tabsToUpdate.length > 0) {
          for (const tab of tabsToUpdate) {
            if (tab.id) {
              const domain = getHostname(tab.url || '');

              // Check if it's an image-only page
              browser.scripting
                .executeScript({
                  target: { tabId: tab.id },
                  func: isImageOnlyPage,
                })
                .then((results) => {
                  const isImageOnly = results?.[0]?.result || false;

                  if (!shouldApplyGrayscale(domain, isImageOnly, {
                    enabled: true,
                    blacklist,
                    imageExceptionEnabled
                  })) {
                    return;
                  }

                  // Apply greyscale
                  browser.scripting
                    .executeScript({
                      target: { tabId: tab.id! },
                      func: (intensity: number) => {
                        const fullscreenElement = getFullscreenElement();

                        if (
                          fullscreenElement &&
                          fullscreenElement instanceof HTMLElement
                        ) {
                          fullscreenElement.style.filter = `grayscale(${intensity}%)`;
                          fullscreenElement.style.transition = "filter 0.2s ease";
                        } else {
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
                            backdrop-filter: grayscale(${intensity}%);
                          `;
                            document.documentElement.appendChild(overlay);
                          } else {
                            overlay.style.backdropFilter = `grayscale(${intensity}%)`;
                          }
                        }
                      },
                      args: [intensity],
                    })
                    .catch(() => {
                      // Silently fail for tabs that can't be modified
                    });
                })
                .catch(() => {
                  // If image detection fails, apply greyscale normally
                  const domain = getHostname(tab.url || '');
                  if (!blacklist.includes(domain)) {
                    browser.scripting
                      .executeScript({
                        target: { tabId: tab.id! },
                        func: (intensity: number) => {
                          const fullscreenElement = getFullscreenElement();

                          if (
                            fullscreenElement &&
                            fullscreenElement instanceof HTMLElement
                          ) {
                            fullscreenElement.style.filter = `grayscale(${intensity}%)`;
                            fullscreenElement.style.transition = "filter 0.2s ease";
                          } else {
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
                              backdrop-filter: grayscale(${intensity}%);
                            `;
                              document.documentElement.appendChild(overlay);
                            } else {
                              overlay.style.backdropFilter = `grayscale(${intensity}%)`;
                            }
                          }
                        },
                        args: [intensity],
                      })
                      .catch(() => {
                        // Silently fail
                      });
                  }
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

                document
                  .querySelectorAll('[style*="grayscale"]')
                  .forEach((element) => {
                    if (
                      element instanceof HTMLElement &&
                      element.style.filter.includes("grayscale")
                    ) {
                      element.style.filter = "";
                      element.style.transition = "";
                    }
                  });
              },
            })
            .catch(() => {
              // Silently fail for restricted tabs
            });
        }
      }
    });
  };

  const initializeSettings = async () => {
    try {
      const currentSettings = await settings.getValue();
      if (currentSettings.enabled) {
        applyGreyscaleToAllTabsDebounced(
          currentSettings.intensity,
          currentSettings.blacklist,
          currentSettings.imageExceptionEnabled ?? false
        );
      }
      settingsInitialized = true;
      updateScheduleAlarm();
    } catch (error) {
      console.error("Failed to initialize settings:", error);
    }
  };

  const unwatchSettings = settings.watch((newSettings, oldSettings) => {
    if (!settingsInitialized) return;

    if (newSettings?.enabled !== oldSettings?.enabled) {
      if (newSettings?.enabled) {
        applyGreyscaleToAllTabsDebounced(
          newSettings.intensity,
          newSettings.blacklist,
          newSettings.imageExceptionEnabled ?? false
        );
      } else {
        disableGreyscaleForAllTabs();
      }
    }

    if (
      newSettings?.intensity !== oldSettings?.intensity &&
      newSettings?.enabled
    ) {
      applyGreyscaleToAllTabsDebounced(
        newSettings.intensity,
        newSettings.blacklist,
        newSettings.imageExceptionEnabled ?? true
      );
    }

    if (
      JSON.stringify(newSettings?.blacklist) !==
      JSON.stringify(oldSettings?.blacklist) &&
      newSettings?.enabled
    ) {
      applyGreyscaleToAllTabsDebounced(
        newSettings.intensity,
        newSettings.blacklist,
        newSettings.imageExceptionEnabled ?? true
      );
    }

    if (
      newSettings?.imageExceptionEnabled !== oldSettings?.imageExceptionEnabled &&
      newSettings?.enabled
    ) {
      applyGreyscaleToAllTabsDebounced(
        newSettings.intensity,
        newSettings.blacklist,
        newSettings.imageExceptionEnabled ?? true
      );
    }

    if (
      newSettings?.schedule !== oldSettings?.schedule ||
      newSettings?.scheduleStart !== oldSettings?.scheduleStart ||
      newSettings?.scheduleEnd !== oldSettings?.scheduleEnd
    ) {
      updateScheduleAlarm();
    }
  });

  initializeSettings();

  const updateScheduleAlarm = async () => {
    const currentSettings = await settings.getValue();
    browser.alarms.clear("StartMonochromate").then(() => {
      if (!currentSettings.scheduleStart) return;
      const [startHours, startMinutes] = currentSettings.scheduleStart
        .split(":")
        .map(Number);
      const startTime = getTime(startHours, startMinutes);
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
      const endTime = getTime(endHours, endMinutes);
      browser.alarms.create("EndMonochromate", {
        when: endTime,
        periodInMinutes: 24 * 60,
      });
    });
  };

  function getTime(hour: number, minute: number): number {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);

    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    return target.getTime();
  }

  browser.alarms.onAlarm.addListener(async (alarm) => {
    const currentSettings = await settings.getValue();
    if (
      alarm.name === "StartMonochromate" &&
      currentSettings.schedule &&
      settingsInitialized
    ) {
      await settings.setValue({
        ...currentSettings,
        enabled: true,
      });
    } else if (
      alarm.name === "EndMonochromate" &&
      currentSettings.schedule &&
      settingsInitialized
    ) {
      await settings.setValue({
        ...currentSettings,
        enabled: false,
      });
    }
  });

  browser.runtime.onMessage.addListener(async (message) => {
    const currentSettings = await settings.getValue();
    switch (message.type) {
      case "toggleGreyscale":
        await settings.setValue({
          ...currentSettings,
          enabled: !currentSettings.enabled,
        });
        break;
      case "setIntensity":
        await settings.setValue({
          ...currentSettings,
          intensity: message.value,
        });
        break;
      case "setBlacklist":
        await settings.setValue({
          ...currentSettings,
          blacklist: message.value,
        });
        break;
      case "toggleImageException":
        await settings.setValue({
          ...currentSettings,
          imageExceptionEnabled: message.value,
        });
        break;
      case "saveSchedule":
        await settings.setValue({
          ...currentSettings,
          scheduleStart: message.startTime,
          scheduleEnd: message.endTime,
        });
        updateScheduleAlarm();
        break;
      case "toggleSchedule":
        await settings.setValue({
          ...currentSettings,
          schedule: !currentSettings.schedule,
        });
        updateScheduleAlarm();
        break;
    }
  });

  // Listen for tab updates to apply greyscale to new tabs
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    const currentSettings = await settings.getValue();
    if (changeInfo.status === "complete" && currentSettings.enabled) {
      browser.tabs.get(tabId).then((tab) => {
        if (tab.url) {
          const domain = getHostname(tab.url);
          if (domain && !currentSettings.blacklist.includes(domain)) {
            // Check if it's an image-only page first
            browser.scripting
              .executeScript({
                target: { tabId },
                func: isImageOnlyPage,
              })
              .then((results) => {
                const isImageOnly = results?.[0]?.result || false;

                // Skip applying greyscale if it's an image-only page and exception is enabled
                if (isImageOnly && (currentSettings.imageExceptionEnabled ?? false)) {
                  return;
                }

                // Apply greyscale normally
                browser.scripting
                  .executeScript({
                    target: { tabId },
                    func: (intensity: number) => {
                      const fullscreenElement = getFullscreenElement();

                      if (
                        fullscreenElement &&
                        fullscreenElement instanceof HTMLElement
                      ) {
                        fullscreenElement.style.filter = `grayscale(${intensity}%)`;
                        fullscreenElement.style.transition = "filter 0.2s ease";
                      } else {
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
                            backdrop-filter: grayscale(${intensity}%);
                          `;
                          document.documentElement.appendChild(overlay);
                        } else {
                          overlay.style.backdropFilter = `grayscale(${intensity}%)`;
                        }
                      }
                    },
                    args: [currentSettings.intensity],
                  })
                  .catch(() => {
                    // Ignore errors for restricted pages
                  });
              });
          }
        }
      });
    }
  });
});

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    browser.tabs.create({
      url: `https://monochromate.lirena.in/thanks?utm_source=extension&utm_medium=install&browser=${import.meta.env.BROWSER
        }`,
    });
  } else if (details.reason === "update") {
    const previousVersion = details.previousVersion;
    const currentVersion = browser.runtime.getManifest().version;
    if (previousVersion !== currentVersion) {
      browser.tabs.create({
        url: `https://monochromate.lirena.in/release-notes/?utm_source=extension&utm_medium=update&browser=${import.meta.env.BROWSER
          }#v${currentVersion}`,
      });
    }
  }
});
