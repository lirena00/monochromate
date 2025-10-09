import React, { useState, useEffect } from "react";
import { Sliders } from "lucide-react";
import { getShortcutByName } from "@/utils/shortcuts";
import ShortcutBadge from "@/components/ShortcutBadge";

interface IntensityCardProps {
  intensity: number;
  enabled: boolean;
  onIntensityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const IntensityCard: React.FC<IntensityCardProps> = ({
  intensity,
  enabled,
  onIntensityChange,
}) => {
  const [increaseShortcut, setIncreaseShortcut] = useState<string>("");
  const [decreaseShortcut, setDecreaseShortcut] = useState<string>("");

  useEffect(() => {
    getShortcutByName("increase_intensity").then(setIncreaseShortcut);
    getShortcutByName("decrease_intensity").then(setDecreaseShortcut);
  }, []);

  return (
    <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-neutral-700">
          <Sliders size={18} />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-sm text-neutral-800">
            Filter Intensity
          </h2>
          <p className="text-xs text-neutral-500 italic">Adjust the strength</p>
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={intensity}
          onChange={onIntensityChange}
          disabled={!enabled}
          className="w-full accent-neutral-900"
        />

        <div className="flex justify-between items-center mt-1.5">
          {decreaseShortcut && (
            <ShortcutBadge size="xs" shortcut={decreaseShortcut} />
          )}
          <div className="text-xs text-neutral-600 ">{intensity}%</div>
          {increaseShortcut && (
            <ShortcutBadge size="xs" shortcut={increaseShortcut} />
          )}
        </div>
      </div>
    </div>
  );
};

export default IntensityCard;
