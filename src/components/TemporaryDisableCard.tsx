import React, { useState, useEffect } from "react";
import { Clock, X, Info } from "lucide-react";

interface TemporaryDisableCardProps {
  enabled: boolean;
}

const TemporaryDisableCard: React.FC<TemporaryDisableCardProps> = ({
  enabled,
}) => {
  const [customMinutes, setCustomMinutes] = useState("");
  const [inputError, setInputError] = useState<boolean>(false);
  const [isTemporaryDisabled, setIsTemporaryDisabled] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [disableUntil, setDisableUntil] = useState<number | null>(null);
  const [displayTime, setDisplayTime] = useState('');

  const predefinedDurations = [
    { label: "5m", value: 5 },
    { label: "10m", value: 10 },
    { label: "15m", value: 15 },
    { label: "30m", value: 30 },
    { label: "1h", value: 60 }
  ];

  useEffect(() => {
    // Check current temporary disable status from storage
    const checkStatus = async () => {
      try {
        const currentSettings = await settings.getValue();
        const tempDisable = currentSettings.temporaryDisable || false;
        const tempUntil = currentSettings.temporaryDisableUntil || null;

        setIsTemporaryDisabled(tempDisable);
        setDisableUntil(tempUntil);

        if (tempDisable && tempUntil) {
          const remaining = tempUntil - Date.now();
          setRemainingTime(Math.max(0, remaining));
          setDisplayTime(formatTime(remaining));
        }
      } catch (error) {
        console.error("Failed to check temporary disable status:", error);
      }
    };

    checkStatus();

    // Update remaining time every second for smooth countdown
    const interval = setInterval(() => {
      if (disableUntil) {
        const remaining = disableUntil - Date.now();
        if (remaining <= 0) {
          setIsTemporaryDisabled(false);
          setDisableUntil(null);
          setRemainingTime(0);
          setDisplayTime('');
        } else {
          setRemainingTime(remaining);
          setDisplayTime(formatTime(remaining));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [disableUntil]);

  const handleTemporaryDisable = async (minutes: number) => {
    try {
      await browser.runtime.sendMessage({
        type: "temporaryDisable",
        minutes
      });

      const until = Date.now() + (minutes * 60 * 1000);
      setIsTemporaryDisabled(true);
      setDisableUntil(until);
      setRemainingTime(minutes * 60 * 1000);
      setDisplayTime(formatTime(minutes * 60 * 1000));
      setCustomMinutes("");
    } catch (error) {
      console.error("Failed to set temporary disable:", error);
    }
  };

  const handleCustomDisable = () => {
    const minutes = parseInt(customMinutes);
    if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
      setInputError(true);
      return;
    }
    setInputError(false);
    handleTemporaryDisable(minutes);
  };

  const handleInputChange = (value: string) => {
    // Only allow numbers and empty string
    if (value === "" || /^\d+$/.test(value)) {
      setCustomMinutes(value);
      setInputError(false);
    }
  };

  const cancelTemporaryDisable = async () => {
    try {
      await browser.runtime.sendMessage({
        type: "cancelTemporaryDisable"
      });

      setIsTemporaryDisabled(false);
      setDisableUntil(null);
      setRemainingTime(0);
      setDisplayTime('');
    } catch (error) {
      console.error("Failed to cancel temporary disable:", error);
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

  return (
    <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="text-neutral-700">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800">Temporary Disable</h2>
            <p className="text-sm text-neutral-500 italic">
              Auto-enable after time expires
            </p>
          </div>
        </div>
      </div>

      {isTemporaryDisabled ? (
        <div className="space-y-3">
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
                    : "Re-enabling now..."
                  }
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
        </div>
      ) : (
        <div className={`space-y-3 ${!enabled ? "opacity-60" : ""}`}>
          {/* Predefined durations */}
          <div className="grid grid-cols-5 gap-1.5">
            {predefinedDurations.map((duration) => (
              <button
                key={duration.value}
                onClick={() => handleTemporaryDisable(duration.value)}
                disabled={!enabled}
                className={`px-2 py-1.5 text-xs rounded-lg transition-colors border ${enabled
                    ? "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-400"
                    : "bg-neutral-200 text-neutral-400 border-neutral-200 cursor-not-allowed"
                  }`}
              >
                {duration.label}
              </button>
            ))}
          </div>

          {/* Custom duration input */}
          <div className="space-y-1">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={customMinutes}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCustomDisable();
                    }
                  }}
                  placeholder="Enter minutes (1-1440)"
                  disabled={!enabled}
                  className={`w-full bg-white rounded-lg border px-3 py-2 text-sm focus:outline-none transition-colors ${inputError ? 'border-red-500' : 'border-neutral-200 hover:border-neutral-400'}`}
                />
                {inputError && (
                  <p className="absolute -bottom-5 left-0 text-xs text-red-500">
                    {inputError}
                  </p>
                )}
              </div>
              <button
                onClick={handleCustomDisable}
                disabled={!enabled || !customMinutes}
                className={`px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${enabled && customMinutes
                    ? "bg-neutral-900 text-white hover:bg-neutral-800"
                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  }`}
              >
                Set Time
              </button>
            </div>
            <p className="text-xs text-neutral-400 text-right">
              {customMinutes ? `${customMinutes} minutes (${formatTime(parseInt(customMinutes) * 60 * 1000)})` : "Max 24 hours"}
            </p>
          </div>

          <p className="text-xs text-neutral-500">
            {inputError ? "Please enter a valid number between 1 and 1440" : "Enter 1-1440 minutes (max 24 hours)"}
          </p>
        </div>
      )}
    </div>
  );
};

export default TemporaryDisableCard;
