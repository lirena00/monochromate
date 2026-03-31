import { useCallback, useEffect, useMemo, useState } from "react";
import "./app.css";
import { Loader2 } from "lucide-react";
import Backup from "@/components/backup-card";
import Footer from "@/components/footer";
import Header from "@/components/header";
import IntensityCard from "@/components/intensity-card";
import ScheduleCard from "@/components/schedule-card";
import SiteListCard from "@/components/site-list-card";
import SiteListManagement from "@/components/site-list-management";
import SupportBanner from "@/components/support-banner";
import TemporaryDisableCard from "@/components/temporary-disable-card";
import GreyscaleToggleCard from "@/components/toggle-card";
import WarningCard from "@/components/warning-card";
import {
  getDomainFromUrl,
  isUrlInList,
  suggestUrlPattern,
} from "@/utils/url-utils";

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function App() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [intensity, setIntensity] = useState(100);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [urlPatternBlacklist, setUrlPatternBlacklist] = useState<string[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [urlPatternWhitelist, setUrlPatternWhitelist] = useState<string[]>([]);
  const [mode, setMode] = useState<"blacklist" | "whitelist">("blacklist");
  const [currentFullUrl, setCurrentFullUrl] = useState<string>("");
  const [mediaExceptionEnabled, setMediaExceptionEnabled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [startMonochromate, setStartMonochromate] = useState("");
  const [endMonochromate, setEndMonochromate] = useState("");
  const [tempStartTime, setTempStartTime] = useState("");
  const [tempEndTime, setTempEndTime] = useState("");
  const [scheduleToggle, setScheduleToggle] = useState(false);
  const [isTemporaryDisabled, setIsTemporaryDisabled] = useState(false);
  const [view, setView] = useState<"main" | "sitelist">("main");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Check if current URL is in the active mode's list
  const isCurrentUrlInActiveList = useMemo(() => {
    const fullUrl = currentFullUrl || `https://${currentUrl}`;
    if (mode === "blacklist") {
      return isUrlInList(fullUrl, blacklist, urlPatternBlacklist);
    }
    return isUrlInList(fullUrl, whitelist, urlPatternWhitelist);
  }, [
    mode,
    blacklist,
    urlPatternBlacklist,
    whitelist,
    urlPatternWhitelist,
    currentUrl,
    currentFullUrl,
  ]);

  const filteredBlacklist = useMemo(
    () =>
      debouncedSearchTerm
        ? blacklist.filter((site) =>
            site.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          )
        : blacklist,
    [blacklist, debouncedSearchTerm]
  );

  useEffect(() => {
    setLoading(true);
    let isMounted = true;

    settings
      .getValue()
      .then((currentSettings) => {
        if (!isMounted) {
          return;
        }

        setEnabled(currentSettings.enabled);
        setIntensity(currentSettings.intensity);
        setBlacklist(currentSettings.blacklist);
        setUrlPatternBlacklist(currentSettings.urlPatternBlacklist || []);
        setWhitelist(currentSettings.whitelist || []);
        setUrlPatternWhitelist(currentSettings.urlPatternWhitelist || []);
        setMode(currentSettings.mode || "blacklist");
        setMediaExceptionEnabled(
          currentSettings.mediaExceptionEnabled ?? false
        );
        setStartMonochromate(currentSettings.scheduleStart);
        setEndMonochromate(currentSettings.scheduleEnd);
        setTempStartTime(currentSettings.scheduleStart);
        setTempEndTime(currentSettings.scheduleEnd);
        setScheduleToggle(currentSettings.schedule);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading settings:", error);
        if (isMounted) {
          setLoading(false);
        }
      });

    const unwatchSettings = settings.watch((newSettings) => {
      if (newSettings && isMounted) {
        setEnabled(newSettings.enabled);
        setIntensity(newSettings.intensity);
        setBlacklist(newSettings.blacklist);
        setUrlPatternBlacklist(newSettings.urlPatternBlacklist || []);
        setWhitelist(newSettings.whitelist || []);
        setUrlPatternWhitelist(newSettings.urlPatternWhitelist || []);
        setMode(newSettings.mode || "blacklist");
        setMediaExceptionEnabled(newSettings.mediaExceptionEnabled ?? false);
        setStartMonochromate(newSettings.scheduleStart);
        setEndMonochromate(newSettings.scheduleEnd);
        setTempStartTime(newSettings.scheduleStart);
        setTempEndTime(newSettings.scheduleEnd);
        setScheduleToggle(newSettings.schedule);
      }
    });

    return () => {
      isMounted = false;
      unwatchSettings();
    };
  }, []);

  useEffect(() => {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        const currentTab = tabs[0];
        if (currentTab?.url) {
          const domain = getDomainFromUrl(currentTab.url);
          setCurrentUrl(domain);
          setCurrentFullUrl(currentTab.url); // Store full URL
        }
      })
      .catch(() => {
        setCurrentUrl("");
        setCurrentFullUrl("");
      });
  }, []);

  const toggleGreyscale = useCallback(() => {
    if (loading) {
      return;
    }
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    browser.runtime.sendMessage({ type: "toggleGreyscale", intensity });
  }, [enabled, intensity, loading]);

  const toggleMediaException = useCallback(() => {
    if (loading) {
      return;
    }
    const newMediaExceptionEnabled = !mediaExceptionEnabled;
    setMediaExceptionEnabled(newMediaExceptionEnabled);
    browser.runtime.sendMessage({
      type: "toggleMediaException",
      value: newMediaExceptionEnabled,
    });
  }, [mediaExceptionEnabled, loading]);

  const changeIntensity = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (loading) {
        return;
      }
      const newIntensity = Number.parseInt(e.target.value, 10);
      setIntensity(newIntensity);
      browser.runtime.sendMessage({
        type: "setIntensity",
        value: newIntensity,
      });
    },
    [loading]
  );

  const saveScheduleTimes = useCallback(() => {
    if (loading) {
      return;
    }
    setStartMonochromate(tempStartTime);
    setEndMonochromate(tempEndTime);
    browser.runtime.sendMessage({
      type: "saveSchedule",
      startTime: tempStartTime,
      endTime: tempEndTime,
    });
  }, [tempStartTime, tempEndTime, loading]);

  const toggleSchedule = useCallback(() => {
    if (loading) {
      return;
    }
    const newScheduleToggle = !scheduleToggle;
    setScheduleToggle(newScheduleToggle);
    browser.runtime.sendMessage({
      type: "toggleSchedule",
      value: newScheduleToggle,
    });
  }, [scheduleToggle, loading]);

  const handleModeChange = useCallback(
    (newMode: "blacklist" | "whitelist") => {
      if (loading || newMode === mode) {
        return;
      }
      setMode(newMode);
      browser.runtime.sendMessage({
        type: "setMode",
        value: newMode,
      });
    },
    [mode, loading]
  );

  const addCurrentSite = useCallback(() => {
    if (loading || !currentUrl || isCurrentUrlInActiveList) {
      return;
    }

    if (mode === "blacklist") {
      const newBlacklist = [...blacklist, currentUrl];
      browser.runtime.sendMessage({
        type: "setBlacklist",
        value: newBlacklist,
      });
    } else {
      const newWhitelist = [...whitelist, currentUrl];
      browser.runtime.sendMessage({
        type: "setWhitelist",
        value: newWhitelist,
      });
    }
  }, [
    currentUrl,
    blacklist,
    whitelist,
    mode,
    loading,
    isCurrentUrlInActiveList,
  ]);

  const addCurrentUrl = useCallback(() => {
    if (loading || !currentFullUrl || isCurrentUrlInActiveList) {
      return;
    }

    const suggestedPattern = suggestUrlPattern(currentFullUrl);

    if (mode === "blacklist") {
      const newUrlPatternBlacklist = [...urlPatternBlacklist, suggestedPattern];
      browser.runtime.sendMessage({
        type: "setUrlPatternBlacklist",
        value: newUrlPatternBlacklist,
      });
    } else {
      const newUrlPatternWhitelist = [...urlPatternWhitelist, suggestedPattern];
      browser.runtime.sendMessage({
        type: "setUrlPatternWhitelist",
        value: newUrlPatternWhitelist,
      });
    }
  }, [
    currentFullUrl,
    urlPatternBlacklist,
    urlPatternWhitelist,
    mode,
    loading,
    isCurrentUrlInActiveList,
  ]);

  const removeSite = useCallback(
    (
      site: string,
      type: "domain" | "pattern" = "domain",
      targetMode: "blacklist" | "whitelist" = mode
    ) => {
      if (loading) {
        return;
      }

      if (targetMode === "blacklist") {
        if (type === "domain") {
          const newBlacklist = blacklist.filter((s) => s !== site);
          browser.runtime.sendMessage({
            type: "setBlacklist",
            value: newBlacklist,
          });
        } else {
          const newUrlPatternBlacklist = urlPatternBlacklist.filter(
            (s) => s !== site
          );
          browser.runtime.sendMessage({
            type: "setUrlPatternBlacklist",
            value: newUrlPatternBlacklist,
          });
        }
      } else if (type === "domain") {
        const newWhitelist = whitelist.filter((s) => s !== site);
        browser.runtime.sendMessage({
          type: "setWhitelist",
          value: newWhitelist,
        });
      } else {
        const newUrlPatternWhitelist = urlPatternWhitelist.filter(
          (s) => s !== site
        );
        browser.runtime.sendMessage({
          type: "setUrlPatternWhitelist",
          value: newUrlPatternWhitelist,
        });
      }
    },
    [
      blacklist,
      urlPatternBlacklist,
      whitelist,
      urlPatternWhitelist,
      mode,
      loading,
    ]
  );

  const handleBulkImport = useCallback(
    (
      sites: string[],
      type: "domain" | "pattern",
      targetMode: "blacklist" | "whitelist"
    ) => {
      if (loading) {
        return;
      }

      if (targetMode === "blacklist") {
        if (type === "domain") {
          const newBlacklist = [...new Set([...blacklist, ...sites])];
          browser.runtime.sendMessage({
            type: "setBlacklist",
            value: newBlacklist,
          });
        } else {
          const newUrlPatternBlacklist = [
            ...new Set([...urlPatternBlacklist, ...sites]),
          ];
          browser.runtime.sendMessage({
            type: "setUrlPatternBlacklist",
            value: newUrlPatternBlacklist,
          });
        }
      } else if (type === "domain") {
        const newWhitelist = [...new Set([...whitelist, ...sites])];
        browser.runtime.sendMessage({
          type: "setWhitelist",
          value: newWhitelist,
        });
      } else {
        const newUrlPatternWhitelist = [
          ...new Set([...urlPatternWhitelist, ...sites]),
        ];
        browser.runtime.sendMessage({
          type: "setUrlPatternWhitelist",
          value: newUrlPatternWhitelist,
        });
      }
    },
    [blacklist, urlPatternBlacklist, whitelist, urlPatternWhitelist, loading]
  );
  const handleReturnToMain = useCallback(() => {
    setView("main");
    setSearchTerm("");
  }, []);

  const renderContent = () => {
    if (view === "main") {
      return (
        <>
          <Header />

          <div className="grid flex-1 grid-cols-1 gap-4">
            <WarningCard currentUrl={currentUrl} />
            <SupportBanner />
            <GreyscaleToggleCard
              enabled={enabled}
              isTemporaryDisabled={isTemporaryDisabled}
              onToggle={toggleGreyscale}
            />
            <TemporaryDisableCard
              enabled={enabled}
              onTemporaryStateChange={setIsTemporaryDisabled}
            />
            <SiteListCard
              blacklist={blacklist}
              currentFullUrl={currentFullUrl}
              currentUrl={currentUrl}
              isCurrentUrlInActiveList={isCurrentUrlInActiveList}
              mode={mode}
              onAddCurrentSite={addCurrentSite}
              onAddCurrentUrl={addCurrentUrl}
              onManageAllSites={() => setView("sitelist")}
              onModeChange={handleModeChange}
              onRemoveSite={removeSite}
              urlPatternBlacklist={urlPatternBlacklist}
              urlPatternWhitelist={urlPatternWhitelist}
              whitelist={whitelist}
            />
            <ScheduleCard
              endMonochromate={endMonochromate}
              onEndTimeChange={setTempEndTime}
              onSaveSchedule={saveScheduleTimes}
              onStartTimeChange={setTempStartTime}
              onToggleSchedule={toggleSchedule}
              scheduleToggle={scheduleToggle}
              startMonochromate={startMonochromate}
              tempEndTime={tempEndTime}
              tempStartTime={tempStartTime}
            />

            <IntensityCard
              enabled={enabled}
              intensity={intensity}
              onIntensityChange={changeIntensity}
            />

            <Backup />
          </div>

          <Footer />
        </>
      );
    }

    return (
      <SiteListManagement
        blacklist={blacklist}
        currentFullUrl={currentFullUrl}
        currentUrl={currentUrl}
        filteredBlacklist={filteredBlacklist}
        isCurrentUrlInActiveList={isCurrentUrlInActiveList}
        mediaExceptionEnabled={mediaExceptionEnabled}
        mode={mode}
        onAddCurrentSite={addCurrentSite}
        onAddCurrentUrl={addCurrentUrl}
        onBulkImport={handleBulkImport}
        onRemoveSite={removeSite}
        onReturnToMain={handleReturnToMain}
        onSearchChange={setSearchTerm}
        onToggleMediaException={toggleMediaException}
        searchTerm={searchTerm}
        urlPatternBlacklist={urlPatternBlacklist}
        urlPatternWhitelist={urlPatternWhitelist}
        whitelist={whitelist}
      />
    );
  };

  return (
    <div className="flex min-h-[800px] w-[420px] flex-col bg-white p-6 text-neutral-800">
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
}
