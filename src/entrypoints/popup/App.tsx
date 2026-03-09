import { useState, useEffect, useMemo, useCallback } from "react";
import "./App.css";
import Backup from "@/components/BackupCard";
import Header from "@/components/Header";
import GreyscaleToggleCard from "@/components/ToggleCard";
import SiteListCard from "@/components/SiteListCard";
import ScheduleCard from "@/components/ScheduleCard";
import IntensityCard from "@/components/IntensityCard";
import WarningCard from "@/components/WarningCard";
import Footer from "@/components/Footer";
import SiteListManagement from "@/components/SiteListManagement";
import TemporaryDisableCard from "@/components/TemporaryDisableCard";
import SupportBanner from "@/components/SupportBanner";
import { Loader2 } from "lucide-react";
import {
  getDomainFromUrl,
  getCurrentFullUrl,
  suggestUrlPattern,
  urlMatchesPattern,
  isUrlInList,
} from "@/utils/urlUtils";

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
    } else {
      return isUrlInList(fullUrl, whitelist, urlPatternWhitelist);
    }
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
        if (!isMounted) return;

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
    if (loading) return;
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    browser.runtime.sendMessage({ type: "toggleGreyscale", intensity });
  }, [enabled, intensity, loading]);

  const toggleMediaException = useCallback(() => {
    if (loading) return;
    const newMediaExceptionEnabled = !mediaExceptionEnabled;
    setMediaExceptionEnabled(newMediaExceptionEnabled);
    browser.runtime.sendMessage({
      type: "toggleMediaException",
      value: newMediaExceptionEnabled,
    });
  }, [mediaExceptionEnabled, loading]);

  const changeIntensity = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (loading) return;
      const newIntensity = parseInt(e.target.value, 10);
      setIntensity(newIntensity);
      browser.runtime.sendMessage({
        type: "setIntensity",
        value: newIntensity,
      });
    },
    [loading]
  );

  const saveScheduleTimes = useCallback(() => {
    if (loading) return;
    setStartMonochromate(tempStartTime);
    setEndMonochromate(tempEndTime);
    browser.runtime.sendMessage({
      type: "saveSchedule",
      startTime: tempStartTime,
      endTime: tempEndTime,
    });
  }, [tempStartTime, tempEndTime, loading]);

  const toggleSchedule = useCallback(() => {
    if (loading) return;
    const newScheduleToggle = !scheduleToggle;
    setScheduleToggle(newScheduleToggle);
    browser.runtime.sendMessage({
      type: "toggleSchedule",
      value: newScheduleToggle,
    });
  }, [scheduleToggle, loading]);

  const handleModeChange = useCallback(
    (newMode: "blacklist" | "whitelist") => {
      if (loading || newMode === mode) return;
      setMode(newMode);
      browser.runtime.sendMessage({
        type: "setMode",
        value: newMode,
      });
    },
    [mode, loading]
  );

  const addCurrentSite = useCallback(async () => {
    if (loading || !currentUrl || isCurrentUrlInActiveList) return;

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
  }, [currentUrl, blacklist, whitelist, mode, loading, isCurrentUrlInActiveList]);

  const addCurrentUrl = useCallback(async () => {
    if (loading || !currentFullUrl || isCurrentUrlInActiveList) return;

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
      if (loading) return;

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
      } else {
        if (type === "domain") {
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
      }
    },
    [blacklist, urlPatternBlacklist, whitelist, urlPatternWhitelist, mode, loading]
  );

  const handleBulkImport = useCallback(
    (
      sites: string[],
      type: "domain" | "pattern",
      targetMode: "blacklist" | "whitelist"
    ) => {
      if (loading) return;

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
      } else {
        if (type === "domain") {
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
      }
    },
    [blacklist, urlPatternBlacklist, whitelist, urlPatternWhitelist, loading]
  );
  const handleReturnToMain = useCallback(() => {
    setView("main");
    setSearchTerm("");
  }, []);

  return (
    <div className="w-[420px] min-h-[800px] bg-white text-neutral-800 p-6 flex flex-col">
      {loading ? (
        <div className="flex justify-center items-center flex-1">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : view === "main" ? (
        <>
          <Header />

          <div className="grid grid-cols-1 gap-4 flex-1">
            <WarningCard currentUrl={currentUrl} />
            <SupportBanner />
            <GreyscaleToggleCard
              enabled={enabled}
              onToggle={toggleGreyscale}
              isTemporaryDisabled={isTemporaryDisabled}
            />
            <TemporaryDisableCard
              enabled={enabled}
              onTemporaryStateChange={setIsTemporaryDisabled}
            />
            <SiteListCard
              mode={mode}
              onModeChange={handleModeChange}
              currentUrl={currentUrl}
              currentFullUrl={currentFullUrl}
              blacklist={blacklist}
              urlPatternBlacklist={urlPatternBlacklist}
              whitelist={whitelist}
              urlPatternWhitelist={urlPatternWhitelist}
              isCurrentUrlInActiveList={isCurrentUrlInActiveList}
              onAddCurrentSite={addCurrentSite}
              onAddCurrentUrl={addCurrentUrl}
              onRemoveSite={removeSite}
              onManageAllSites={() => setView("sitelist")}
            />
            <ScheduleCard
              scheduleToggle={scheduleToggle}
              tempStartTime={tempStartTime}
              tempEndTime={tempEndTime}
              startMonochromate={startMonochromate}
              endMonochromate={endMonochromate}
              onToggleSchedule={toggleSchedule}
              onStartTimeChange={setTempStartTime}
              onEndTimeChange={setTempEndTime}
              onSaveSchedule={saveScheduleTimes}
            />

            <IntensityCard
              intensity={intensity}
              enabled={enabled}
              onIntensityChange={changeIntensity}
            />

            <Backup />
          </div>

          <Footer />
        </>
      ) : (
        <SiteListManagement
          mode={mode}
          searchTerm={searchTerm}
          currentUrl={currentUrl}
          currentFullUrl={currentFullUrl}
          blacklist={blacklist}
          urlPatternBlacklist={urlPatternBlacklist}
          whitelist={whitelist}
          urlPatternWhitelist={urlPatternWhitelist}
          filteredBlacklist={filteredBlacklist}
          isCurrentUrlInActiveList={isCurrentUrlInActiveList}
          onSearchChange={setSearchTerm}
          onReturnToMain={handleReturnToMain}
          onAddCurrentSite={addCurrentSite}
          onAddCurrentUrl={addCurrentUrl}
          onRemoveSite={removeSite}
          onBulkImport={handleBulkImport}
          mediaExceptionEnabled={mediaExceptionEnabled}
          onToggleMediaException={toggleMediaException}
        />
      )}
    </div>
  );
}
