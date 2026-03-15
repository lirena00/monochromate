import { browser } from "#imports";
import { isMediaOnlyPage } from "@/utils/media-check-util";
import { settings } from "@/utils/storage";
import {
  getDomainFromUrl,
  isUrlInList,
  shouldApplyFilter,
} from "@/utils/url-utils";

export default defineBackground(() => {
  let settingsInitialized = false;

  const updateBadge = (enabled: boolean, temporaryDisabled = false) => {
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
  const debounce = (func: (...args: unknown[]) => unknown, wait: number) => {
    let timeout: number | undefined;
    return (...args: unknown[]) => {
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

  // Function to determine if grayscale should be applied (mode-aware)
  const shouldApplyGrayscale = (
    url: string,
    isMediaOnly: boolean,
    currentSettings: Settings
  ): boolean => {
    const shouldApply = shouldApplyFilter(url, {
      mode: currentSettings.mode || "blacklist",
      blacklist: currentSettings.blacklist || [],
      urlPatternBlacklist: currentSettings.urlPatternBlacklist || [],
      whitelist: currentSettings.whitelist || [],
      urlPatternWhitelist: currentSettings.urlPatternWhitelist || [],
    });

    return (
      currentSettings.enabled &&
      !!url &&
      shouldApply &&
      !(isMediaOnly && currentSettings.mediaExceptionEnabled)
    );
  };

  const injectGreyscaleOverlay = (tabId: number, intensity: number) => {
    browser.scripting
      .executeScript({
        target: { tabId },
        func: (intensityArg: number) => {
          const fsEl =
            document.fullscreenElement ||
            (document as Document & { webkitFullscreenElement?: Element })
              .webkitFullscreenElement ||
            null;
          if (fsEl instanceof HTMLElement) {
            fsEl.style.filter = `grayscale(${intensityArg}%)`;
            fsEl.style.transition = "filter 0.2s ease";
          } else {
            let overlay = document.getElementById("monochromate-overlay");
            if (overlay) {
              overlay.style.backdropFilter = `grayscale(${intensityArg}%)`;
            } else {
              overlay = document.createElement("div");
              overlay.id = "monochromate-overlay";
              overlay.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483647;backdrop-filter:grayscale(${intensityArg}%)`;
              document.documentElement.appendChild(overlay);
            }
          }
        },
        args: [intensity],
      })
      .catch(() => {
        // Silently fail for tabs that can't be modified
      });
  };

  const applyGreyscaleToTab = (
    tabId: number,
    tabUrl: string,
    currentSettings: Settings
  ) => {
    const intensity = currentSettings.intensity || 100;
    const domain = getHostname(tabUrl);
    browser.scripting
      .executeScript({ target: { tabId }, func: isMediaOnlyPage })
      .then((results) => {
        const isMediaOnly = results?.[0]?.result ?? false;
        if (
          shouldApplyGrayscale(domain, isMediaOnly, {
            ...currentSettings,
            mediaExceptionEnabled: currentSettings.mediaExceptionEnabled,
          })
        ) {
          injectGreyscaleOverlay(tabId, intensity);
        }
      })
      .catch(() => {
        // If media detection fails, apply greyscale anyway
        const shouldApply = shouldApplyFilter(tabUrl, {
          mode: currentSettings.mode || "blacklist",
          blacklist: currentSettings.blacklist || [],
          urlPatternBlacklist: currentSettings.urlPatternBlacklist || [],
          whitelist: currentSettings.whitelist || [],
          urlPatternWhitelist: currentSettings.urlPatternWhitelist || [],
        });
        if (shouldApply) {
          injectGreyscaleOverlay(tabId, intensity);
        }
      });
  };

  // Debounced version of applyGreyscale (mode-aware)
  const applyGreyscaleToAllTabsDebounced = debounce(
    (settingsArg: unknown) => {
      const currentSettings = settingsArg as Settings;

      browser.tabs.query({}).then((tabs) => {
        for (const tab of tabs) {
          if (tab.id && tab.url) {
            const shouldApply = shouldApplyFilter(tab.url, {
              mode: currentSettings.mode || "blacklist",
              blacklist: currentSettings.blacklist || [],
              urlPatternBlacklist: currentSettings.urlPatternBlacklist || [],
              whitelist: currentSettings.whitelist || [],
              urlPatternWhitelist: currentSettings.urlPatternWhitelist || [],
            });
            if (shouldApply) {
              applyGreyscaleToTab(tab.id, tab.url, currentSettings);
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

                for (const element of document.querySelectorAll(
                  '[style*="grayscale"]'
                )) {
                  if (
                    element instanceof HTMLElement &&
                    element.style.filter.includes("grayscale")
                  ) {
                    element.style.filter = "";
                    element.style.transition = "";
                  }
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
        applyGreyscaleToAllTabsDebounced(currentSettings);
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

        applyGreyscaleToAllTabsDebounced(currentSettings);
      }
      settingsInitialized = true;
      updateScheduleAlarm();
    } catch (error) {
      console.error("Failed to initialize settings:", error);
    }
  };

  const handleListOrModeChange = (
    newSettings: Settings | null,
    oldSettings: Settings | null
  ) => {
    if (!newSettings?.enabled) {
      return;
    }
    const listsChanged =
      JSON.stringify(newSettings.blacklist) !==
        JSON.stringify(oldSettings?.blacklist) ||
      JSON.stringify(newSettings.whitelist) !==
        JSON.stringify(oldSettings?.whitelist) ||
      JSON.stringify(newSettings.urlPatternBlacklist) !==
        JSON.stringify(oldSettings?.urlPatternBlacklist) ||
      JSON.stringify(newSettings.urlPatternWhitelist) !==
        JSON.stringify(oldSettings?.urlPatternWhitelist);
    const modeChanged = newSettings.mode !== oldSettings?.mode;
    const mediaChanged =
      newSettings.mediaExceptionEnabled !== oldSettings?.mediaExceptionEnabled;
    const intensityChanged = newSettings.intensity !== oldSettings?.intensity;
    if (listsChanged || modeChanged || mediaChanged || intensityChanged) {
      applyGreyscaleToAllTabsDebounced(newSettings);
    }
  };

  const _unwatchSettings = settings.watch((newSettings, oldSettings) => {
    if (!settingsInitialized) {
      return;
    }

    if (newSettings?.enabled !== oldSettings?.enabled) {
      updateBadge(
        newSettings?.enabled && !newSettings?.temporaryDisable,
        newSettings?.temporaryDisable
      );

      if (newSettings?.enabled) {
        applyGreyscaleToAllTabsDebounced(newSettings);
      } else {
        disableGreyscaleForAllTabs();
      }
    }

    handleListOrModeChange(newSettings ?? null, oldSettings ?? null);

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
      if (!currentSettings.scheduleStart) {
        return;
      }
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
      if (!currentSettings.scheduleEnd) {
        return;
      }
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
      case "toggleGreyscale": {
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
      }
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
      case "setUrlPatternBlacklist":
        await settings.setValue({
          ...currentSettings,
          urlPatternBlacklist: message.value,
        });
        break;
      case "setWhitelist":
        await settings.setValue({
          ...currentSettings,
          whitelist: message.value,
        });
        break;
      case "setUrlPatternWhitelist":
        await settings.setValue({
          ...currentSettings,
          urlPatternWhitelist: message.value,
        });
        break;
      case "setMode":
        await settings.setValue({
          ...currentSettings,
          mode: message.value,
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
      default:
        break;
    }
  });

  const toggleBlacklistForUrl = (
    currentUrl: string,
    domain: string,
    currentSettings: Settings
  ) => {
    const isInBlacklist = isUrlInList(
      currentUrl,
      currentSettings.blacklist,
      currentSettings.urlPatternBlacklist || []
    );
    if (isInBlacklist) {
      const updatedBlacklist = currentSettings.blacklist.filter(
        (site) => site !== domain
      );
      const updatedUrlPatternBlacklist = (
        currentSettings.urlPatternBlacklist || []
      ).filter((pattern) => !isUrlInList(currentUrl, [], [pattern]));
      settings.setValue({
        ...currentSettings,
        blacklist: updatedBlacklist,
        urlPatternBlacklist: updatedUrlPatternBlacklist,
      });
    } else {
      settings.setValue({
        ...currentSettings,
        blacklist: [...currentSettings.blacklist, domain],
      });
    }
  };

  const toggleWhitelistForUrl = (
    currentUrl: string,
    domain: string,
    currentSettings: Settings
  ) => {
    const isInWhitelist = isUrlInList(
      currentUrl,
      currentSettings.whitelist || [],
      currentSettings.urlPatternWhitelist || []
    );
    if (isInWhitelist) {
      const updatedWhitelist = (currentSettings.whitelist || []).filter(
        (site) => site !== domain
      );
      const updatedUrlPatternWhitelist = (
        currentSettings.urlPatternWhitelist || []
      ).filter((pattern) => !isUrlInList(currentUrl, [], [pattern]));
      settings.setValue({
        ...currentSettings,
        whitelist: updatedWhitelist,
        urlPatternWhitelist: updatedUrlPatternWhitelist,
      });
    } else {
      settings.setValue({
        ...currentSettings,
        whitelist: [...(currentSettings.whitelist || []), domain],
      });
    }
  };

  browser.commands.onCommand.addListener(async (command) => {
    const currentSettings = await settings.getValue();

    switch (command) {
      case "toggle_greyscale": {
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
      }

      case "quick_toggle_blacklist":
        browser.tabs
          .query({ active: true, currentWindow: true })
          .then((tabs) => {
            const currentTab = tabs[0];
            if (currentTab?.url) {
              const currentUrl = currentTab.url;
              const domain = getDomainFromUrl(currentUrl);
              const mode = currentSettings.mode || "blacklist";
              if (mode === "blacklist") {
                toggleBlacklistForUrl(currentUrl, domain, currentSettings);
              } else {
                toggleWhitelistForUrl(currentUrl, domain, currentSettings);
              }
            }
          });
        break;
      case "increase_intensity": {
        if (!currentSettings.enabled) {
          break;
        }
        const newIntensityUp = Math.min(100, currentSettings.intensity + 10);
        await settings.setValue({
          ...currentSettings,
          intensity: newIntensityUp,
        });
        break;
      }

      case "decrease_intensity": {
        if (!currentSettings.enabled) {
          break;
        }
        const newIntensityDown = Math.max(0, currentSettings.intensity - 10);
        await settings.setValue({
          ...currentSettings,
          intensity: newIntensityDown,
        });
        break;
      }
      default:
        break;
    }
  });
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    const currentSettings = await settings.getValue();
    if (changeInfo.status === "complete" && currentSettings.enabled) {
      browser.tabs.get(tabId).then((tab) => {
        if (tab.url) {
          const shouldApply = shouldApplyFilter(tab.url, {
            mode: currentSettings.mode || "blacklist",
            blacklist: currentSettings.blacklist || [],
            urlPatternBlacklist: currentSettings.urlPatternBlacklist || [],
            whitelist: currentSettings.whitelist || [],
            urlPatternWhitelist: currentSettings.urlPatternWhitelist || [],
          });

          if (shouldApply && !currentSettings.temporaryDisable) {
            applyGreyscaleToTab(tabId, tab.url, currentSettings);
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
