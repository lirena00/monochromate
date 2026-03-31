import { Sliders } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import ShortcutBadge from "@/components/shortcut-badge";
import { getShortcutByName } from "@/utils/shortcuts";

interface IntensityCardProps {
  enabled: boolean;
  intensity: number;
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
    <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
      <div className="mb-2 flex items-center gap-2">
        <div className="text-neutral-700">
          <Sliders size={18} />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-neutral-800 text-sm">
            Filter Intensity
          </h2>
          <p className="text-neutral-500 text-xs italic">Adjust the strength</p>
        </div>
      </div>

      <div className="relative">
        <input
          className="w-full accent-neutral-900"
          disabled={!enabled}
          max="100"
          min="0"
          onChange={onIntensityChange}
          type="range"
          value={intensity}
        />

        <div className="mt-1.5 flex items-center justify-between">
          {decreaseShortcut && (
            <ShortcutBadge shortcut={decreaseShortcut} size="xs" />
          )}
          <div className="text-neutral-600 text-xs">{intensity}%</div>
          {increaseShortcut && (
            <ShortcutBadge shortcut={increaseShortcut} size="xs" />
          )}
        </div>
      </div>
    </div>
  );
};

export default IntensityCard;
