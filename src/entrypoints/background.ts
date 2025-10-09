import { isMediaOnlyPage } from "@/utils/MediaCheckUtil";
import { settings } from "@/utils/storage";
import { shouldExcludeUrl, getDomainFromUrl } from "@/utils/urlUtils";

export default defineBackground(() => {
  let settingsInitialized = false;

  const updateBadge = (
    enabled: boolean,
    temporaryDisabled: boolean = false
  ) => {
    if (temporaryDisabled) {
      browser.action.setBadgeText({ text: "❚❚" });
      browser.action.setBadgeBackgroundColor({ color: "#f5f5f5" });
    } else if (enabled) {
      browser.action.setBadgeText({ text: "ON" });
      browser.action.setBadgeBackgroundColor({ color: "#f5f5f5" });
    } else {
      browser.action.setBadgeText({ text: "" });
    }
  };

  // Debounce helper to prevent too frequent tab updates
  const debounce = (func: Function, wait: number) => {
    let timeout: number | undefined;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait) as unknown as number;
    };
  };

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
  const shouldApplyGrayscale = (
    url: string,
    isMediaOnly: boolean,
    settings: any
  ): boolean => {
    const isExcluded = shouldExcludeUrl(
      url,
      settings.blacklist,
      settings.urlBlacklist || []
    );

    return (
      settings.enabled &&
      url &&
      !isExcluded &&
      !(isMediaOnly && settings.imageExceptionEnabled)
    );
  };

  // Debounced version of applyGreyscale
  const applyGreyscaleToAllTabsDebounced = debounce(
    (
      intensity: number = 100,
      blacklist: string[] = [],
      urlPatternBlacklist: string[] = [],
      imageExceptionEnabled: boolean = false
    ) => {
      browser.tabs.query({}).then((tabs) => {
        const tabsToUpdate = tabs.filter((tab) => {
          if (!tab.id || !tab.url) return false;
          return !shouldExcludeUrl(tab.url, blacklist, urlPatternBlacklist); // Updated
        });

        // Batch process tabs that need updating
        if (tabsToUpdate.length > 0) {
          for (const tab of tabsToUpdate) {
            if (tab.id) {
              const domain = getHostname(tab.url || "");

              // Check if it's a media-only page
              browser.scripting
                .executeScript({
                  target: { tabId: tab.id },
                  func: isMediaOnlyPage,
                })
                .then((results) => {
                  const isMediaOnly = results?.[0]?.result || false;

                  if (
                    !shouldApplyGrayscale(domain, isMediaOnly, {
                      enabled: true,
                      blacklist,
                      imageExceptionEnabled,
                    })
                  ) {
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
                          fullscreenElement.style.transition =
                            "filter 0.2s ease";
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
                            z-index: 2147483647;
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
                  const domain = getHostname(tab.url || "");
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
                            fullscreenElement.style.transition =
                              "filter 0.2s ease";
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
                              z-index: 2147483647;
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

  // NEW: Simplified temporary disable using alarms
  const setTemporaryDisable = async (minutes: number) => {
    try {
      const until = Date.now() + minutes * 60 * 1000;

      // Update settings
      await settings.setValue({
        ...(await settings.getValue()),
        temporaryDisable: true,
        temporaryDisableUntil: until,
      });

      // Clear any existing temporary disable alarm
      await browser.alarms.clear("EndTemporaryDisable");

      // Create alarm to auto-cancel
      await browser.alarms.create("EndTemporaryDisable", {
        when: until,
      });

      disableGreyscaleForAllTabs();
      updateBadge(false, true);
    } catch (error) {
      console.error("Failed to set temporary disable:", error);
    }
  };

  const cancelTemporaryDisable = async () => {
    try {
      const currentSettings = await settings.getValue();

      // Clear alarm
      await browser.alarms.clear("EndTemporaryDisable");

      // Update settings
      await settings.setValue({
        ...currentSettings,
        temporaryDisable: false,
        temporaryDisableUntil: null,
      });

      if (currentSettings.enabled) {
        applyGreyscaleToAllTabsDebounced(
          currentSettings.intensity,
          currentSettings.blacklist,
          currentSettings.mediaExceptionEnabled
        );
      }
      updateBadge(currentSettings.enabled, false);
    } catch (error) {
      console.error("Failed to cancel temporary disable:", error);
    }
  };

  // Check if temporary disable has expired on startup
  const checkTemporaryDisableExpiry = async () => {
    try {
      const currentSettings = await settings.getValue();
      if (
        currentSettings.temporaryDisable &&
        currentSettings.temporaryDisableUntil
      ) {
        const remaining = currentSettings.temporaryDisableUntil - Date.now();
        if (remaining <= 0) {
          // Expired - clear it immediately
          await settings.setValue({
            ...currentSettings,
            temporaryDisable: false,
            temporaryDisableUntil: null,
          });
          console.log("Cleared expired temporary disable on startup");
        } else {
          // Still valid - recreate alarm for remaining time
          await browser.alarms.create("EndTemporaryDisable", {
            when: currentSettings.temporaryDisableUntil,
          });
        }
      }
    } catch (error) {
      console.error("Failed to check temporary disable expiry:", error);
    }
  };

  // Check if support banner dismissal has expired on startup
  const checkSupportBannerDismissalExpiry = async () => {
    try {
      const result = await browser.storage.local.get([
        "supportBannerDismissed",
        "supportBannerDismissedUntil",
      ]);

      if (result.supportBannerDismissed && result.supportBannerDismissedUntil) {
        const remaining = result.supportBannerDismissedUntil - Date.now();
        if (remaining <= 0) {
          // Expired - clear it immediately
          await browser.storage.local.remove([
            "supportBannerDismissed",
            "supportBannerDismissedUntil",
          ]);
          console.log("Cleared expired support banner dismissal on startup");
        } else {
          // Still valid - recreate alarm for remaining time
          await browser.alarms.create("SupportBannerDismissed", {
            when: result.supportBannerDismissedUntil,
          });
        }
      }
    } catch (error) {
      console.error("Failed to check support banner dismissal expiry:", error);
    }
  };

  const initializeSettings = async () => {
    try {
      await checkTemporaryDisableExpiry();
      await checkSupportBannerDismissalExpiry();
      const currentSettings = await settings.getValue();
      updateBadge(
        currentSettings.enabled && !currentSettings.temporaryDisable,
        currentSettings.temporaryDisable
      );

      if (currentSettings.enabled && !currentSettings.temporaryDisable) {
        updateBadge(currentSettings.enabled);

        applyGreyscaleToAllTabsDebounced(
          currentSettings.intensity,
          currentSettings.blacklist,
          currentSettings.mediaExceptionEnabled
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
      updateBadge(
        newSettings?.enabled && !newSettings?.temporaryDisable,
        newSettings?.temporaryDisable
      );

      if (newSettings?.enabled) {
        applyGreyscaleToAllTabsDebounced(
          newSettings.intensity,
          newSettings.blacklist,
          newSettings.mediaExceptionEnabled
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
        newSettings.mediaExceptionEnabled
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
        newSettings.mediaExceptionEnabled
      );
    }

    if (
      newSettings?.mediaExceptionEnabled !==
        oldSettings?.mediaExceptionEnabled &&
      newSettings?.enabled
    ) {
      applyGreyscaleToAllTabsDebounced(
        newSettings.intensity,
        newSettings.blacklist,
        newSettings.mediaExceptionEnabled
      );
    }

    if (newSettings?.temporaryDisable !== oldSettings?.temporaryDisable) {
      updateBadge(
        newSettings?.enabled && !newSettings?.temporaryDisable,
        newSettings?.temporaryDisable
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

    if (alarm.name === "EndTemporaryDisable") {
      // Temporary disable expired
      await cancelTemporaryDisable();
      console.log("Temporary disable auto-expired via alarm");
      return;
    }

    if (alarm.name === "SupportBannerDismissed") {
      // Support banner dismissal period expired
      try {
        await browser.storage.local.remove([
          "supportBannerDismissed",
          "supportBannerDismissedUntil",
        ]);
        console.log("Support banner dismissal period expired");
      } catch (error) {
        console.error("Error clearing support banner dismissal:", error);
      }
      return;
    }

    if (
      alarm.name === "StartMonochromate" &&
      currentSettings.schedule &&
      settingsInitialized
    ) {
      // Don't override temporary disable
      if (!currentSettings.temporaryDisable) {
        await settings.setValue({
          ...currentSettings,
          enabled: true,
        });
        updateBadge(true, false);
      }
    } else if (
      alarm.name === "EndMonochromate" &&
      currentSettings.schedule &&
      settingsInitialized
    ) {
      await settings.setValue({
        ...currentSettings,
        enabled: false,
      });
      updateBadge(false, currentSettings.temporaryDisable);
    }
  });

  browser.runtime.onMessage.addListener(async (message) => {
    const currentSettings = await settings.getValue();
    switch (message.type) {
      case "toggleGreyscale":
        // Clear temporary disable when manually toggling
        await browser.alarms.clear("EndTemporaryDisable");
        const newEnabled = !currentSettings.enabled;
        await settings.setValue({
          ...currentSettings,
          enabled: newEnabled,
          temporaryDisable: false,
          temporaryDisableUntil: null,
        });
        updateBadge(newEnabled, false);
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
      case "setUrlPatternBlacklist": // Updated case name
        await settings.setValue({
          ...currentSettings,
          urlPatternBlacklist: message.value,
        });
        break;
      case "toggleMediaException":
        await settings.setValue({
          ...currentSettings,
          mediaExceptionEnabled: message.value,
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
      case "temporaryDisable":
        await setTemporaryDisable(message.minutes);
        break;

      case "cancelTemporaryDisable":
        await cancelTemporaryDisable();
        break;
    }
  });

  browser.commands.onCommand.addListener(async (command) => {
    const currentSettings = await settings.getValue();

    switch (command) {
      case "toggle_greyscale":
        const newEnabled = !currentSettings.enabled;
        await settings.setValue({
          ...currentSettings,
          enabled: newEnabled,
        });
        updateBadge(
          newEnabled && !currentSettings.temporaryDisable,
          currentSettings.temporaryDisable
        );
        break;

      case "quick_toggle_blacklist":
        browser.tabs
          .query({ active: true, currentWindow: true })
          .then((tabs) => {
            const currentTab = tabs[0];
            if (currentTab?.url) {
              const currentUrl = currentTab.url;
              const domain = getDomainFromUrl(currentUrl);

              // Check if current URL is excluded (domain or pattern)
              const isExcluded = shouldExcludeUrl(
                currentUrl,
                currentSettings.blacklist,
                currentSettings.urlPatternBlacklist || [] // Updated
              );
              if (isExcluded) {
                // Remove from both lists if present
                const updatedBlacklist = currentSettings.blacklist.filter(
                  (site) => site !== domain
                );
                const updatedUrlPatternBlacklist = (
                  currentSettings.urlPatternBlacklist || []
                ).filter((pattern) => !urlMatchesPattern(currentUrl, pattern));

                settings.setValue({
                  ...currentSettings,
                  blacklist: updatedBlacklist,
                  urlPatternBlacklist: updatedUrlPatternBlacklist, // Updated
                });
              } else {
                // Add domain (default behavior)
                settings.setValue({
                  ...currentSettings,
                  blacklist: [...currentSettings.blacklist, domain],
                });
              }
            }
          });
        break;
      case "increase_intensity":
        if (!currentSettings.enabled) break;
        const newIntensityUp = Math.min(100, currentSettings.intensity + 10);
        await settings.setValue({
          ...currentSettings,
          intensity: newIntensityUp,
        });
        break;

      case "decrease_intensity":
        if (!currentSettings.enabled) break;
        const newIntensityDown = Math.max(0, currentSettings.intensity - 10);
        await settings.setValue({
          ...currentSettings,
          intensity: newIntensityDown,
        });
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
            // Check if it's a media-only page first
            browser.scripting
              .executeScript({
                target: { tabId },
                func: isMediaOnlyPage,
              })
              .then((results) => {
                const isMediaOnly = results?.[0]?.result || false;

                // Skip applying greyscale if it's a media-only page and exception is enabled
                if (isMediaOnly && currentSettings.mediaExceptionEnabled) {
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
                            z-index: 2147483647;
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
      url: `https://monochromate.lirena.in/thanks?utm_source=extension&utm_medium=install&browser=${
        import.meta.env.BROWSER
      }`,
    });
  } else if (details.reason === "update") {
    const previousVersion = details.previousVersion;
    const currentVersion = browser.runtime.getManifest().version;
    if (previousVersion !== currentVersion) {
      browser.tabs.create({
        url: `https://monochromate.lirena.in/release-notes/?utm_source=extension&utm_medium=update&browser=${
          import.meta.env.BROWSER
        }#v${currentVersion}`,
      });
    }
  }
});
