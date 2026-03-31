import { AlarmClock, Info, Save } from "lucide-react";
import type React from "react";

interface ScheduleCardProps {
  endMonochromate: string;
  onEndTimeChange: (time: string) => void;
  onSaveSchedule: () => void;
  onStartTimeChange: (time: string) => void;
  onToggleSchedule: () => void;
  scheduleToggle: boolean;
  startMonochromate: string;
  tempEndTime: string;
  tempStartTime: string;
}

interface ScheduleEvent {
  time: number;
  type: "active" | "inactive";
}

const parseTimeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};

const getNextEventForNormalSchedule = (
  currentTime: number,
  startTime: number,
  endTime: number
): ScheduleEvent => {
  if (currentTime < startTime) {
    return { time: startTime, type: "active" };
  }
  if (currentTime < endTime) {
    return { time: endTime, type: "inactive" };
  }
  return { time: startTime + 24 * 60, type: "active" };
};

const getNextEventForOvernightSchedule = (
  currentTime: number,
  startTime: number,
  endTime: number
): ScheduleEvent => {
  if (currentTime < endTime) {
    return { time: endTime, type: "inactive" };
  }
  if (currentTime < startTime) {
    return { time: startTime, type: "active" };
  }
  return { time: endTime + 24 * 60, type: "inactive" };
};

const formatTimeRemaining = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    const hourText = hours === 1 ? "1 hour" : `${hours} hours`;
    if (remainingMinutes > 0) {
      const minuteText =
        remainingMinutes === 1 ? "1 minute" : `${remainingMinutes} minutes`;
      return `${hourText} and ${minuteText}`;
    }
    return hourText;
  }
  return remainingMinutes === 1 ? "1 minute" : `${remainingMinutes} minutes`;
};

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  scheduleToggle,
  tempStartTime,
  tempEndTime,
  startMonochromate,
  endMonochromate,
  onToggleSchedule,
  onStartTimeChange,
  onEndTimeChange,
  onSaveSchedule,
}) => {
  // Helper function to calculate time until next schedule event
  const getNextScheduleText = () => {
    if (!(scheduleToggle && startMonochromate && endMonochromate)) {
      return null;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTimeInMinutes = parseTimeToMinutes(startMonochromate);
    const endTimeInMinutes = parseTimeToMinutes(endMonochromate);

    const isNormalSchedule = startTimeInMinutes <= endTimeInMinutes;
    const nextEvent = isNormalSchedule
      ? getNextEventForNormalSchedule(
          currentTime,
          startTimeInMinutes,
          endTimeInMinutes
        )
      : getNextEventForOvernightSchedule(
          currentTime,
          startTimeInMinutes,
          endTimeInMinutes
        );

    const minutesUntilNext = nextEvent.time - currentTime;
    const timeText = formatTimeRemaining(minutesUntilNext);

    return `Monochromate will automatically be ${nextEvent.type} in ${timeText}`;
  };

  const scheduleText = getNextScheduleText();

  return (
    <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-neutral-700">
            <AlarmClock size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800 text-sm">Schedule</h2>
            <p className="text-neutral-500 text-xs italic">
              Schedule monochrome mode
            </p>
          </div>
        </div>
        <button
          className={`rounded-lg px-3 py-2 text-xs transition-colors ${
            scheduleToggle
              ? "bg-neutral-900 text-neutral-50 hover:bg-neutral-800 active:bg-neutral-950"
              : "border border-neutral-300 bg-neutral-100 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-200"
          }`}
          onClick={onToggleSchedule}
          type="button"
        >
          {scheduleToggle ? "On" : "Off"}
        </button>
      </div>

      {scheduleText && (
        <div className="mb-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
          <div className="flex items-center gap-1.5">
            <div className="text-neutral-500">
              <Info size={10} />
            </div>
            <p className="text-neutral-600 text-xs">{scheduleText}</p>
          </div>
        </div>
      )}

      <div className={`space-y-2 ${scheduleToggle ? "" : "opacity-60"}`}>
        <div className="flex items-center gap-1.5">
          <div className="flex-1 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 transition-all hover:border-neutral-400">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 text-xs">Start:</span>
              <input
                className="border-0 bg-transparent text-right text-xs focus:outline-hidden"
                disabled={!scheduleToggle}
                onChange={(e) => onStartTimeChange(e.target.value)}
                type="time"
                value={tempStartTime}
              />
            </div>
          </div>

          <div className="flex-1 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 transition-all hover:border-neutral-400">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 text-xs">End:</span>
              <input
                className="border-0 bg-transparent text-right text-xs focus:outline-hidden"
                disabled={!scheduleToggle}
                onChange={(e) => onEndTimeChange(e.target.value)}
                type="time"
                value={tempEndTime}
              />
            </div>
          </div>
        </div>

        <button
          className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors ${
            !scheduleToggle ||
            (
              tempStartTime === startMonochromate &&
                tempEndTime === endMonochromate
            )
              ? "cursor-not-allowed bg-neutral-200 text-neutral-400"
              : "bg-neutral-900 text-white hover:bg-neutral-800"
          }`}
          disabled={
            !scheduleToggle ||
            (tempStartTime === startMonochromate &&
              tempEndTime === endMonochromate)
          }
          onClick={onSaveSchedule}
          type="button"
        >
          <Save size={12} />
          Save Schedule
        </button>
      </div>
    </div>
  );
};

export default ScheduleCard;
