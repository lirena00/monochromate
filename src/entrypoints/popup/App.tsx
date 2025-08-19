import { useState, useEffect, useMemo, useCallback } from "react";
import "./App.css";
import Backup from "@/components/BackupCard";
import Header from "@/components/Header";
import GreyscaleToggleCard from "@/components/ToggleCard";
import ExcludedSitesCard from "@/components/BlacklistCard";
import ScheduleCard from "@/components/ScheduleCard";
import IntensityCard from "@/components/IntensityCard";
import WarningCard from "@/components/WarningCard";
import Footer from "@/components/Footer";
import BlacklistManagement from "@/components/BlacklistManagement";
import TemporaryDisableCard from "@/components/TemporaryDisableCard";
import { Loader2 } from "lucide-react";

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
  const [mediaExceptionEnabled, setMediaExceptionEnabled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [startMonochromate, setStartMonochromate] = useState("");
  const [endMonochromate, setEndMonochromate] = useState("");
  const [tempStartTime, setTempStartTime] = useState("");
  const [tempEndTime, setTempEndTime] = useState("");
  const [scheduleToggle, setScheduleToggle] = useState(false);
  const [isTemporaryDisabled, setIsTemporaryDisabled] = useState(false);
  const [view, setView] = useState<"main" | "blacklist">("main");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const isCurrentUrlBlacklisted = useMemo(
    () => blacklist.includes(currentUrl),
    [blacklist, currentUrl]
  );

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
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url).hostname.replace("www.", "");
        setCurrentUrl(url);
      }
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

  const addCurrentSite = useCallback(async () => {
    if (loading || !currentUrl || blacklist.includes(currentUrl)) return;
    const newBlacklist = [...blacklist, currentUrl];
    browser.runtime.sendMessage({
      type: "setBlacklist",
      value: newBlacklist,
    });
  }, [currentUrl, blacklist, loading]);

  const removeSite = useCallback(
    (site: string) => {
      if (loading) return;
      const newBlacklist = blacklist.filter((s) => s !== site);
      browser.runtime.sendMessage({
        type: "setBlacklist",
        value: newBlacklist,
      });
    },
    [blacklist, loading]
  );

  const handleReturnToMain = useCallback(() => {
    setView("main");
    setSearchTerm("");
  }, []);

  return (
    <div className="w-[420px] min-h-[675px] bg-white text-neutral-800 p-6 flex flex-col">
      {loading ? (
        <div className="flex justify-center items-center flex-1">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : view === "main" ? (
        <>
          <Header />
          <div className="grid grid-cols-1 gap-4 flex-1">
            <WarningCard currentUrl={currentUrl} />

            <GreyscaleToggleCard
              enabled={enabled}
              onToggle={toggleGreyscale}
              isTemporaryDisabled={isTemporaryDisabled}
            />
            <TemporaryDisableCard
              enabled={enabled}
              onTemporaryStateChange={setIsTemporaryDisabled}
            />
            <ExcludedSitesCard
              currentUrl={currentUrl}
              blacklist={blacklist}
              isCurrentUrlBlacklisted={isCurrentUrlBlacklisted}
              onAddCurrentSite={addCurrentSite}
              onRemoveSite={removeSite}
              onManageAllSites={() => setView("blacklist")}
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
        <BlacklistManagement
          searchTerm={searchTerm}
          currentUrl={currentUrl}
          filteredBlacklist={filteredBlacklist}
          isCurrentUrlBlacklisted={isCurrentUrlBlacklisted}
          onSearchChange={setSearchTerm}
          onReturnToMain={handleReturnToMain}
          onAddCurrentSite={addCurrentSite}
          onRemoveSite={removeSite}
          mediaExceptionEnabled={mediaExceptionEnabled}
          onToggleMediaException={toggleMediaException}
        />
      )}
    </div>
  );
}
