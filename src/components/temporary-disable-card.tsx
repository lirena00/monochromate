import { Check, ChevronDown, Clock, Info, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { settings } from "@/utils/storage";

// Top-level regex constant for performance
const NUMERIC_INPUT_REGEX = /^\d*\.?\d*$/;

const PREDEFINED_DURATIONS = [
  { label: "5m", value: 5 },
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "1h", value: 60 },
  { label: "2h", value: 120 },
];

const TIME_UNIT_OPTIONS = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
];

/**
 * Formats milliseconds into human-readable time string
 */
const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

/**
 * Validates the custom time input value
 */
const validateInput = (value: string, unit: "minutes" | "hours"): string => {
  const num = Number.parseFloat(value);
  if (Number.isNaN(num) || num <= 0) {
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

interface DisabledStateViewProps {
  displayTime: string;
  onCancel: () => void;
  remainingTime: number;
}

const DisabledStateView: React.FC<DisabledStateViewProps> = ({
  remainingTime,
  displayTime,
  onCancel,
}) => (
  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2">
    <div className="flex items-center justify-between">
      <div>
        <div className="mb-1 flex items-center gap-1.5">
          <div className="text-neutral-600">
            <Info size={10} />
          </div>
          <p className="font-medium text-neutral-800 text-xs">
            Filter temporarily disabled
          </p>
        </div>
        <p className="ml-3.5 text-neutral-600 text-xs">
          {remainingTime > 0
            ? `Auto-enabling in ${displayTime}`
            : "Re-enabling now..."}
        </p>
      </div>
      <button
        className="rounded-lg p-1 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
        onClick={onCancel}
        title="Cancel and re-enable now"
        type="button"
      >
        <X size={12} />
      </button>
    </div>
  </div>
);

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

  // Helper to update temporary disable state
  const updateTemporaryState = useCallback(
    (tempDisable: boolean, tempUntil: number | null) => {
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
    },
    [onTemporaryStateChange]
  );

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

  // Load initial state and watch for changes
  useEffect(() => {
    const loadState = async () => {
      try {
        const currentSettings = await settings.getValue();
        const tempDisable = currentSettings.temporaryDisable;
        const tempUntil = currentSettings.temporaryDisableUntil || null;
        updateTemporaryState(tempDisable, tempUntil);
      } catch (error) {
        console.error("Failed to load temporary disable state:", error);
      }
    };

    loadState();

    // Watch for storage changes
    const unwatchSettings = settings.watch((newSettings) => {
      if (newSettings) {
        const tempDisable = newSettings.temporaryDisable;
        const tempUntil = newSettings.temporaryDisableUntil || null;
        updateTemporaryState(tempDisable, tempUntil);
      }
    });

    return () => {
      unwatchSettings();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateTemporaryState]);

  // Simple countdown timer for UI display
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isTemporaryDisabled && disableUntil) {
      intervalRef.current = setInterval(() => {
        const remaining = disableUntil - Date.now();
        if (remaining <= 0) {
          setRemainingTime(0);
          setDisplayTime("Re-enabling...");
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
      setCustomValue("");
      await browser.runtime.sendMessage({
        type: "temporaryDisable",
        minutes,
      });
    } catch (error) {
      console.error("Failed to set temporary disable:", error);
    }
  };

  const cancelTemporaryDisable = async () => {
    try {
      await browser.runtime.sendMessage({
        type: "cancelTemporaryDisable",
      });
    } catch (error) {
      console.error("Failed to cancel temporary disable:", error);
    }
  };

  const handleCustomDisable = () => {
    const error = validateInput(customValue, timeUnit);
    if (error) {
      setInputError(error);
      return;
    }

    const value = Number.parseFloat(customValue);
    const minutes = timeUnit === "hours" ? Math.round(value * 60) : value;

    setInputError("");
    handleTemporaryDisable(minutes);
  };

  const handleInputChange = (value: string) => {
    if (value === "" || NUMERIC_INPUT_REGEX.test(value)) {
      setCustomValue(value);
      setInputError("");
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
    <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-neutral-700">
            <Clock size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800 text-sm">
              Temporary Disable
            </h2>
            <p className="text-neutral-500 text-xs italic">
              Auto-enable after time expires
            </p>
          </div>
        </div>
      </div>

      {isTemporaryDisabled ? (
        <DisabledStateView
          displayTime={displayTime}
          onCancel={cancelTemporaryDisable}
          remainingTime={remainingTime}
        />
      ) : (
        <div className={`space-y-2 ${enabled ? "" : "opacity-60"}`}>
          <div className="grid grid-cols-5 gap-1">
            {PREDEFINED_DURATIONS.map((duration) => (
              <button
                className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                  enabled
                    ? "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                    : "cursor-not-allowed border-neutral-200 bg-neutral-200 text-neutral-400"
                }`}
                disabled={!enabled}
                key={duration.value}
                onClick={() => handleTemporaryDisable(duration.value)}
                type="button"
              >
                {duration.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <input
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-xs transition-colors focus:outline-none ${
                    inputError
                      ? "border-red-500"
                      : "border-neutral-200 hover:border-neutral-400 focus:border-neutral-500"
                  } ${enabled ? "" : "cursor-not-allowed opacity-60"}`}
                  disabled={!enabled}
                  inputMode="decimal"
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCustomDisable();
                    }
                  }}
                  placeholder={getPlaceholder()}
                  type="text"
                  value={customValue}
                />
              </div>

              <div className="relative" ref={selectRef}>
                <button
                  className={`flex min-w-[85px] items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs transition-colors hover:border-neutral-400 focus:border-neutral-500 focus:outline-none ${
                    enabled ? "" : "cursor-not-allowed opacity-60"
                  }`}
                  disabled={!enabled}
                  onClick={() => enabled && setIsSelectOpen(!isSelectOpen)}
                  type="button"
                >
                  <span className="capitalize">
                    {
                      TIME_UNIT_OPTIONS.find(
                        (option) => option.value === timeUnit
                      )?.label
                    }
                  </span>
                  <ChevronDown
                    className={`transition-transform ${
                      isSelectOpen ? "rotate-180" : ""
                    }`}
                    size={10}
                  />
                </button>

                {isSelectOpen && enabled && (
                  <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-lg border border-neutral-200 bg-white shadow-lg">
                    <div className="p-1">
                      {TIME_UNIT_OPTIONS.map((option) => (
                        <button
                          className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-xs outline-none hover:bg-neutral-50"
                          key={option.value}
                          onClick={() =>
                            handleSelectOption(
                              option.value as "minutes" | "hours"
                            )
                          }
                          type="button"
                        >
                          <span>{option.label}</span>
                          {timeUnit === option.value && (
                            <Check className="text-neutral-600" size={10} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs transition-colors ${
                  enabled && customValue
                    ? "bg-neutral-900 text-white hover:bg-neutral-800"
                    : "cursor-not-allowed bg-neutral-200 text-neutral-400"
                }`}
                disabled={!(enabled && customValue)}
                onClick={handleCustomDisable}
                type="button"
              >
                Set
              </button>
            </div>

            {inputError && <p className="text-red-500 text-xs">{inputError}</p>}

            <p className="text-neutral-400 text-xs">
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
