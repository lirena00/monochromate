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

    const [startHours, startMinutes] = startMonochromate.split(":").map(Number);
    const [endHours, endMinutes] = endMonochromate.split(":").map(Number);

    const startTimeInMinutes = startHours * 60 + startMinutes;
    const endTimeInMinutes = endHours * 60 + endMinutes;

    let nextEventTime: number;
    let nextEventType: "active" | "inactive";

    // Determine next event
    if (startTimeInMinutes <= endTimeInMinutes) {
      // Normal case: start time is before end time in the same day
      if (currentTime < startTimeInMinutes) {
        nextEventTime = startTimeInMinutes;
        nextEventType = "active";
      } else if (currentTime < endTimeInMinutes) {
        nextEventTime = endTimeInMinutes;
        nextEventType = "inactive";
      } else {
        nextEventTime = startTimeInMinutes + 24 * 60; // Next day
        nextEventType = "active";
      }
    } else {
      // Overnight case: start time is after end time (crosses midnight)
      if (currentTime < endTimeInMinutes) {
        nextEventTime = endTimeInMinutes;
        nextEventType = "inactive";
      } else if (currentTime < startTimeInMinutes) {
        nextEventTime = startTimeInMinutes;
        nextEventType = "active";
      } else {
        nextEventTime = endTimeInMinutes + 24 * 60; // Next day
        nextEventType = "inactive";
      }
    }

    const minutesUntilNext = nextEventTime - currentTime;
    const hoursUntilNext = Math.floor(minutesUntilNext / 60);
    const remainingMinutes = minutesUntilNext % 60;

    let timeText = "";
    if (hoursUntilNext > 0) {
      timeText = hoursUntilNext === 1 ? "1 hour" : `${hoursUntilNext} hours`;
      if (remainingMinutes > 0) {
        timeText += ` and ${remainingMinutes} minute${
          remainingMinutes === 1 ? "" : "s"
        }`;
      }
    } else {
      timeText =
        remainingMinutes === 1 ? "1 minute" : `${remainingMinutes} minutes`;
    }

    return `Monochromate will automatically be ${nextEventType} in ${timeText}`;
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
        >
          <Save size={12} />
          Save Schedule
        </button>
      </div>
    </div>
  );
};

export default ScheduleCard;
