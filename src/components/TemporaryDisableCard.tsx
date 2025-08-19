import React, { useState, useEffect, useRef } from "react";
import { Clock, X, Info, ChevronDown, Check } from "lucide-react";
import { settings } from "@/utils/storage"; // ADD THIS IMPORT

interface TemporaryDisableCardProps {
  enabled: boolean;
  onTemporaryStateChange?: (isDisabled: boolean) => void;
}

const TemporaryDisableCard: React.FC<TemporaryDisableCardProps> = ({
  enabled,
  onTemporaryStateChange,
}) => {
  const [customValue, setCustomValue] = useState("");
  const [timeUnit, setTimeUnit] = useState<"minutes" | "hours">("minutes");
  const [inputError, setInputError] = useState<string>("");
  const [isTemporaryDisabled, setIsTemporaryDisabled] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [disableUntil, setDisableUntil] = useState<number | null>(null);
  const [displayTime, setDisplayTime] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const predefinedDurations = [
    { label: "5m", value: 5 },
    { label: "15m", value: 15 },
    { label: "30m", value: 30 },
    { label: "1h", value: 60 },
    { label: "2h", value: 120 },
  ];

  const timeUnitOptions = [
    { value: "minutes", label: "Minutes" },
    { value: "hours", label: "Hours" },
  ];

  // Firefox-specific: Force refresh storage state
  const refreshStorageState = async () => {
    try {
      const currentSettings = await settings.getValue();
      const tempDisable = currentSettings.temporaryDisable || false;
      const tempUntil = currentSettings.temporaryDisableUntil || null;

      setIsTemporaryDisabled(tempDisable);
      setDisableUntil(tempUntil);
      onTemporaryStateChange?.(tempDisable);

      if (tempDisable && tempUntil) {
        const remaining = tempUntil - Date.now();
        setRemainingTime(Math.max(0, remaining));
        setDisplayTime(formatTime(remaining));
      } else {
        setRemainingTime(0);
        setDisplayTime("");
      }
    } catch (error) {
      console.error("Failed to refresh storage state:", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsSelectOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Initial state load
    refreshStorageState();

    // Watch for storage changes with Firefox-compatible polling
    const unwatchSettings = settings.watch((newSettings) => {
      if (newSettings) {
        const tempDisable = newSettings.temporaryDisable || false;
        const tempUntil = newSettings.temporaryDisableUntil || null;

        setIsTemporaryDisabled(tempDisable);
        setDisableUntil(tempUntil);
        onTemporaryStateChange?.(tempDisable);

        if (tempDisable && tempUntil) {
          const remaining = tempUntil - Date.now();
          setRemainingTime(Math.max(0, remaining));
          setDisplayTime(formatTime(remaining));
        } else {
          setRemainingTime(0);
          setDisplayTime("");
        }
      }
    });

    // Firefox fallback: Periodic storage polling
    const pollInterval = setInterval(refreshStorageState, 500);

    return () => {
      unwatchSettings();
      clearInterval(pollInterval);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onTemporaryStateChange]);

  // Separate countdown timer effect
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isTemporaryDisabled && disableUntil) {
      intervalRef.current = setInterval(async () => {
        const remaining = disableUntil - Date.now();
        if (remaining <= 0) {
          // Time expired - force cancel and refresh
          try {
            await browser.runtime.sendMessage({
              type: "cancelTemporaryDisable",
            });
            setTimeout(refreshStorageState, 100);
          } catch (error) {
            console.error("Failed to auto-cancel expired timer:", error);
            // Force refresh anyway
            refreshStorageState();
          }
        } else {
          setRemainingTime(remaining);
          setDisplayTime(formatTime(remaining));
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTemporaryDisabled, disableUntil]);

  const handleTemporaryDisable = async (minutes: number) => {
    try {
      // Immediate UI feedback
      const until = Date.now() + minutes * 60 * 1000;
      setIsTemporaryDisabled(true);
      setDisableUntil(until);
      setRemainingTime(minutes * 60 * 1000);
      setDisplayTime(formatTime(minutes * 60 * 1000));
      setCustomValue("");
      onTemporaryStateChange?.(true);

      // Send to background
      await browser.runtime.sendMessage({
        type: "temporaryDisable",
        minutes,
      });

      // Firefox: Double-check state after delay
      setTimeout(refreshStorageState, 200);
    } catch (error) {
      console.error("Failed to set temporary disable:", error);
      // Revert UI on error
      refreshStorageState();
    }
  };

  const cancelTemporaryDisable = async () => {
    try {
      // Immediate UI feedback
      setIsTemporaryDisabled(false);
      setDisableUntil(null);
      setRemainingTime(0);
      setDisplayTime("");
      onTemporaryStateChange?.(false);

      // Send to background
      await browser.runtime.sendMessage({
        type: "cancelTemporaryDisable",
      });

      // Firefox: Double-check state after delay
      setTimeout(refreshStorageState, 200);
    } catch (error) {
      console.error("Failed to cancel temporary disable:", error);
      // Revert to actual state on error
      refreshStorageState();
    }
  };

  const validateInput = (value: string, unit: "minutes" | "hours"): string => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return "Please enter a valid positive number";
    }

    const minutes = unit === "hours" ? num * 60 : num;
    if (minutes > 360) {
      return unit === "hours"
        ? "Maximum 6 hours allowed"
        : "Maximum 360 minutes (6 hours) allowed";
    }

    if (unit === "minutes" && !Number.isInteger(num)) {
      return "Minutes must be a whole number";
    }

    return "";
  };

  const handleCustomDisable = () => {
    const error = validateInput(customValue, timeUnit);
    if (error) {
      setInputError(error);
      return;
    }

    const value = parseFloat(customValue);
    const minutes = timeUnit === "hours" ? Math.round(value * 60) : value;

    setInputError("");
    handleTemporaryDisable(minutes);
  };

  const handleInputChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setCustomValue(value);
      setInputError("");
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getPlaceholder = () => {
    return timeUnit === "hours"
      ? "Enter hours (max 6)"
      : "Enter minutes (max 360)";
  };

  const handleSelectOption = (value: "minutes" | "hours") => {
    setTimeUnit(value);
    setIsSelectOpen(false);
    setInputError("");
  };

  return (
    <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-neutral-700">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800">
              Temporary Disable
            </h2>
            <p className="text-sm text-neutral-500 italic">
              Auto-enable after time expires
            </p>
          </div>
        </div>
      </div>

      {isTemporaryDisabled ? (
        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="text-neutral-600">
                  <Info size={12} />
                </div>
                <p className="text-sm font-medium text-neutral-800">
                  Filter temporarily disabled
                </p>
              </div>
              <p className="text-xs text-neutral-600 ml-5">
                {remainingTime > 0
                  ? `Auto-enabling in ${displayTime}`
                  : "Re-enabling now..."}
              </p>
            </div>
            <button
              onClick={cancelTemporaryDisable}
              className="p-1.5 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Cancel and re-enable now"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className={`space-y-3 ${!enabled ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-5 gap-1.5">
            {predefinedDurations.map((duration) => (
              <button
                key={duration.value}
                onClick={() => handleTemporaryDisable(duration.value)}
                disabled={!enabled}
                className={`px-2 py-1.5 text-xs rounded-lg transition-colors border ${
                  enabled
                    ? "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-400"
                    : "bg-neutral-200 text-neutral-400 border-neutral-200 cursor-not-allowed"
                }`}
              >
                {duration.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={customValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCustomDisable();
                    }
                  }}
                  placeholder={getPlaceholder()}
                  disabled={!enabled}
                  className={`w-full bg-white rounded-lg border px-3 py-2 text-sm focus:outline-none transition-colors ${
                    inputError
                      ? "border-red-500"
                      : "border-neutral-200 hover:border-neutral-400 focus:border-neutral-500"
                  } ${!enabled ? "opacity-60 cursor-not-allowed" : ""}`}
                />
              </div>

              <div ref={selectRef} className="relative">
                <button
                  onClick={() => enabled && setIsSelectOpen(!isSelectOpen)}
                  disabled={!enabled}
                  className={`flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm hover:border-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors min-w-[90px] ${
                    !enabled ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  <span className="capitalize">
                    {
                      timeUnitOptions.find(
                        (option) => option.value === timeUnit
                      )?.label
                    }
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      isSelectOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isSelectOpen && enabled && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
                    <div className="p-1">
                      {timeUnitOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() =>
                            handleSelectOption(
                              option.value as "minutes" | "hours"
                            )
                          }
                          className="flex items-center justify-between w-full px-3 py-2 text-sm cursor-pointer hover:bg-neutral-50 rounded-md outline-none"
                        >
                          <span>{option.label}</span>
                          {timeUnit === option.value && (
                            <Check size={14} className="text-neutral-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleCustomDisable}
                disabled={!enabled || !customValue}
                className={`px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                  enabled && customValue
                    ? "bg-neutral-900 text-white hover:bg-neutral-800"
                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                }`}
              >
                Set
              </button>
            </div>

            {inputError && <p className="text-xs text-red-500">{inputError}</p>}

            <p className="text-xs text-neutral-400">
              Maximum 6 hours •{" "}
              {timeUnit === "hours"
                ? "Decimals allowed (e.g., 1.5)"
                : "Whole numbers only"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemporaryDisableCard;
