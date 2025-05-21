import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Power,
  Sliders,
  Shield,
  X,
  Heart,
  Github,
  Search,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  AlarmClock,
  Loader2,
} from "lucide-react";
import { Discord } from "@/components/Icons/Discord";
import "./App.css";

const Icons = {
  Power: () => <Power size={20} />,
  Adjust: () => <Sliders size={20} />,
  Shield: () => <Shield size={20} />,
  AlarmClock: () => <AlarmClock size={20} />,
  X: () => <X size={15} />,
  Heart: () => <Heart size={15} color="red" />,
  Github: () => <Github size={15} />,
  Search: () => <Search size={15} />,
  AlertCircle: () => <AlertCircle size={15} />,
  ChevronDown: () => <ChevronDown size={15} />,
  ChevronUp: () => <ChevronUp size={15} />,
  ArrowLeft: () => <ArrowLeft size={18} />,
  Discord: () => <Discord />,
  Loader: () => <Loader2 size={24} className="animate-spin" />,
};

// Debounce helper function
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
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [startMonochromate, setStartMonochromate] = useState("");
  const [endMonochromate, setEndMonochromate] = useState("");
  const [scheduleToggle, setScheduleToggle] = useState(false);
  const [view, setView] = useState<"main" | "blacklist">("main");

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoize derived state
  const isCurrentUrlBlacklisted = useMemo(
    () => blacklist.includes(currentUrl),
    [blacklist, currentUrl]
  );

  // Memoize filtered blacklist to avoid recalculation on every render
  const filteredBlacklist = useMemo(
    () =>
      debouncedSearchTerm
        ? blacklist.filter((site) =>
            site.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          )
        : blacklist,
    [blacklist, debouncedSearchTerm]
  );
  // Load initial data only once
  useEffect(() => {
    // Set loading state to true until data is fetched
    setLoading(true);

    // Create a flag to track if the component is still mounted
    let isMounted = true;

    browser.storage.local
      .get("Monofilter")
      .then((data) => {
        // Only update state if component is still mounted
        if (!isMounted) return;

        if (data.Monofilter) {
          // Use nullish coalescing to provide defaults only when needed
          setEnabled(data.Monofilter.enabled ?? false);
          setIntensity(data.Monofilter.intensity ?? 100);
          setBlacklist(data.Monofilter.blacklist ?? []);
          setStartMonochromate(data.Monofilter.scheduleStart ?? "17:00");
          setEndMonochromate(data.Monofilter.scheduleEnd ?? "09:00");
          setScheduleToggle(data.Monofilter.schedule ?? true);
        }
        // Only turn off loading when data is actually loaded
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading settings:", error);
        // In case of error, still set loading to false to prevent UI lockup
        if (isMounted) {
          setLoading(false);
        }
      });

    // Listen for storage changes to keep UI in sync
    const storageListener = (changes: any) => {
      if (changes.Monofilter) {
        const newValue = changes.Monofilter.newValue;
        if (newValue) {
          setEnabled(newValue.enabled ?? false);
          setIntensity(newValue.intensity ?? 100);
          setBlacklist(newValue.blacklist ?? []);
          setStartMonochromate(newValue.scheduleStart ?? "17:00");
          setEndMonochromate(newValue.scheduleEnd ?? "09:00");
          setScheduleToggle(newValue.schedule ?? true);
        }
      }
    };

    browser.storage.onChanged.addListener(storageListener);
    return () => {
      isMounted = false;
      browser.storage.onChanged.removeListener(storageListener);
    };
  }, []);

  // Get current URL only once
  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url).hostname.replace("www.", "");
        setCurrentUrl(url);
      }
    });
  }, []);
  const toggleGreyscale = useCallback(() => {
    // Prevent toggle during loading
    if (loading) return;

    const newEnabled = !enabled;
    setEnabled(newEnabled);
    browser.runtime.sendMessage({ type: "toggleGreyscale", intensity });
  }, [enabled, intensity, loading]);
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
  const changeStartTime = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (loading) return;

      const newStartTime = e.target.value;
      setStartMonochromate(newStartTime);
      browser.runtime.sendMessage({
        type: "setScheduleStart",
        value: newStartTime,
      });
    },
    [loading]
  );

  const changeEndTime = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (loading) return;

      const newEndTime = e.target.value;
      setEndMonochromate(newEndTime);
      browser.runtime.sendMessage({
        type: "setScheduleEnd",
        value: newEndTime,
      });
    },
    [loading]
  );

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
    <div className="w-[420px] h-[550px] bg-white text-neutral-800 p-6 flex flex-col">
      {loading ? (
        <div className="flex justify-center items-center flex-1">
          <Icons.Loader />
        </div>
      ) : view === "main" ? (
        <>
          <div className="flex items-center gap-1 mb-6">
            <img src="/logo.png" alt="Monochromate Logo" className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-neutral-800">
              Monochromate
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-4 flex-1">
            {/* Toggle Card*/}
            <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-neutral-700">
                    <Icons.Power />
                  </div>
                  <div>
                    <h2 className="font-semibold text-neutral-800">
                      Greyscale Filter
                    </h2>
                    <p className="text-sm text-neutral-500 italic">
                      Toggle monochrome mode
                    </p>
                  </div>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    enabled
                      ? "bg-neutral-900 text-neutral-50 hover:bg-neutral-800 active:bg-neutral-950"
                      : "bg-neutral-100 text-neutral-700 border border-neutral-300 hover:bg-neutral-200 hover:border-neutral-400"
                  }`}
                  onClick={toggleGreyscale}
                >
                  {enabled ? "Active" : "Inactive"}
                </button>
              </div>
            </div>

            {/* Blacklist Card */}
            <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-neutral-700">
                    <Icons.Shield />
                  </div>
                  <div>
                    <h2 className="font-semibold text-neutral-800">
                      Excluded Sites
                      {blacklist.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-neutral-200 rounded-full">
                          {blacklist.length}
                        </span>
                      )}
                    </h2>
                    <p className="text-sm text-neutral-500 italic">
                      Manage exceptions
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-neutral-200 rounded-full overflow-hidden">
                    {currentUrl && (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${currentUrl}&sz=64`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <span className="text-sm font-medium truncate max-w-[180px]">
                    {currentUrl}
                  </span>
                </div>

                {isCurrentUrlBlacklisted ? (
                  <button
                    onClick={() => removeSite(currentUrl)}
                    className="text-xs px-2 py-1 bg-neutral-200 text-neutral-700 rounded-sm hover:bg-neutral-300 transition-colors"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={addCurrentSite}
                    className="text-xs px-2 py-1 bg-neutral-900 text-white rounded-sm hover:bg-neutral-800 transition-colors"
                  >
                    Exclude
                  </button>
                )}
              </div>

              <button
                onClick={() => setView("blacklist")}
                className="mt-3 w-full text-sm flex items-center justify-center gap-2 py-2   transition-colors  rounded-lg  bg-neutral-900 text-neutral-50 hover:bg-neutral-800 active:bg-neutral-950"
              >
                Manage all excluded sites
              </button>
            </div>

            {/* Schedule Card */}
            <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="text-neutral-700">
                    <Icons.AlarmClock />
                  </div>
                  <div>
                    <h2 className="font-semibold text-neutral-800">Schedule</h2>
                    <p className="text-sm text-neutral-500 italic">
                      Schedule monochrome mode
                    </p>
                  </div>
                </div>
                <button
                  className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                    scheduleToggle
                      ? "bg-neutral-900 text-neutral-50 hover:bg-neutral-800 active:bg-neutral-950"
                      : "bg-neutral-100 text-neutral-700 border border-neutral-300 hover:bg-neutral-200 hover:border-neutral-400"
                  }`}
                  onClick={toggleSchedule}
                >
                  {scheduleToggle ? "On" : "Off"}
                </button>
              </div>

              <div
                className={`flex gap-2 items-center ${
                  !scheduleToggle ? "opacity-60" : ""
                }`}
              >
                <div className="flex-1 bg-white rounded-lg border border-neutral-200 px-3 py-2 hover:border-neutral-400 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">Start:</span>
                    <input
                      type="time"
                      className="bg-transparent border-0 text-sm text-right focus:outline-hidden"
                      value={startMonochromate}
                      onChange={(e) => changeStartTime(e)}
                      disabled={!scheduleToggle}
                    />
                  </div>
                </div>

                <div className="flex-1 bg-white rounded-lg border border-neutral-200 px-3 py-2 hover:border-neutral-400 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">End:</span>
                    <input
                      type="time"
                      className="bg-transparent border-0 text-sm text-right focus:outline-hidden"
                      value={endMonochromate}
                      onChange={(e) => changeEndTime(e)}
                      disabled={!scheduleToggle}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Intensity Card */}
            <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-neutral-700">
                  <Icons.Adjust />
                </div>
                <div>
                  <h2 className="font-semibold text-neutral-800">
                    Filter Intensity
                  </h2>
                  <p className="text-sm text-neutral-500 italic">
                    Adjust the strength
                  </p>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={changeIntensity}
                disabled={!enabled}
                className="w-full accent-neutral-900"
              />
              <div className="text-right text-sm text-neutral-500">
                {intensity}%
              </div>
            </div>
          </div>

          <footer className="mt-8 mb-4 pt-4 border-t border-neutral-200">
            <div className="flex justify-center items-center space-x-5 text-sm">
              <a
                href="https://buymeacoffee.com/lirena00"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1.5 group"
              >
                <span className="text-red-500 group-hover:scale-110 transition-transform">
                  <Icons.Heart />
                </span>
                <span>Support</span>
              </a>

              <a
                href="https://discord.gg/pdxMMNGWCU"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1.5 group"
              >
                <span className="group-hover:scale-110 transition-transform">
                  <Icons.Discord />
                </span>
                <span>Discord</span>
              </a>

              <a
                href="https://github.com/lirena00/monochromate"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1.5 group"
              >
                <span className="group-hover:scale-110 transition-transform">
                  <Icons.Github />
                </span>
                <span>Github</span>
              </a>
            </div>

            <div className="my-3 text-center">
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`https://monochromate.lirena.in/release-notes/#${
                  browser.runtime.getManifest().version
                }`}
                className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                v.{browser.runtime.getManifest().version}
              </a>
            </div>
          </footer>
        </>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleReturnToMain}
              className="p-1 rounded-full hover:bg-neutral-100"
            >
              <Icons.ArrowLeft />
            </button>
            <h1 className="text-xl font-bold">Manage Excluded Sites</h1>
          </div>
          <div className="relative mb-3">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <Icons.Search />
            </div>
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm"
              placeholder="Search excluded sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="mb-4">
            <h2 className="text-sm font-medium text-neutral-500 mb-2">
              Current Site
            </h2>
            <div className="bg-white rounded-lg border border-neutral-200 p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-neutral-200 rounded-full overflow-hidden">
                  {currentUrl && (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${currentUrl}&sz=64`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {currentUrl}
                </span>
              </div>

              {isCurrentUrlBlacklisted ? (
                <button
                  onClick={() => removeSite(currentUrl)}
                  className="text-sm px-3 py-1 bg-neutral-200 text-neutral-700 rounded-sm hover:bg-neutral-300 transition-colors"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={addCurrentSite}
                  className="text-sm px-3 py-1 bg-neutral-900 text-white rounded-sm hover:bg-neutral-800 transition-colors flex items-center gap-1"
                >
                  Exclude
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <h2 className="text-sm font-medium text-neutral-500 mb-2">
              All Excluded Sites
            </h2>
            <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-neutral-200">
              {filteredBlacklist.length > 0 ? (
                filteredBlacklist.map((site) => (
                  <div
                    key={site}
                    className="flex justify-between items-center py-3 px-3 border-b border-neutral-200 last:border-0 hover:bg-neutral-50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-neutral-200 rounded-full overflow-hidden">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${site}&sz=64`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-neutral-700">{site}</span>
                    </div>
                    <button
                      onClick={() => removeSite(site)}
                      className="text-neutral-500 hover:text-red-500"
                    >
                      <Icons.X />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 px-3 text-center flex flex-col items-center gap-2">
                  {searchTerm ? (
                    <p className="text-sm text-neutral-500">
                      No results match "{searchTerm}"
                    </p>
                  ) : (
                    <>
                      <div className="text-neutral-400">
                        <Icons.AlertCircle />
                      </div>
                      <p className="text-sm text-neutral-500">
                        No sites in exclusion list yet
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
