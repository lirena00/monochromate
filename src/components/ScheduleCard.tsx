import React from "react";
import { AlarmClock, Save, Info } from "lucide-react";

interface ScheduleCardProps {
  scheduleToggle: boolean;
  tempStartTime: string;
  tempEndTime: string;
  startMonochromate: string;
  endMonochromate: string;
  onToggleSchedule: () => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  onSaveSchedule: () => void;
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
    if (!scheduleToggle || !startMonochromate || !endMonochromate) return null;

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
    <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="text-neutral-700">
            <AlarmClock size={20} />
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
          onClick={onToggleSchedule}
        >
          {scheduleToggle ? "On" : "Off"}
        </button>
      </div>

      {scheduleText && (
        <div className="mb-3 p-2 bg-neutral-50 border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="text-neutral-500">
              <Info size={12} />
            </div>
            <p className="text-xs text-neutral-600">{scheduleText}</p>
          </div>
        </div>
      )}

      <div className={`space-y-3 ${!scheduleToggle ? "opacity-60" : ""}`}>
        <div className="flex gap-2 items-center">
          <div className="flex-1 bg-white rounded-lg border border-neutral-200 px-3 py-2 hover:border-neutral-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Start:</span>
              <input
                type="time"
                className="bg-transparent border-0 text-sm text-right focus:outline-hidden"
                value={tempStartTime}
                onChange={(e) => onStartTimeChange(e.target.value)}
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
                value={tempEndTime}
                onChange={(e) => onEndTimeChange(e.target.value)}
                disabled={!scheduleToggle}
              />
            </div>
          </div>
        </div>

        <button
          onClick={onSaveSchedule}
          disabled={
            !scheduleToggle ||
            (tempStartTime === startMonochromate &&
              tempEndTime === endMonochromate)
          }
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            !scheduleToggle ||
            (tempStartTime === startMonochromate &&
              tempEndTime === endMonochromate)
              ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              : "bg-neutral-900 text-white hover:bg-neutral-800"
          }`}
        >
          <Save size={15} />
          Save Schedule
        </button>
      </div>
    </div>
  );
};

export default ScheduleCard;
