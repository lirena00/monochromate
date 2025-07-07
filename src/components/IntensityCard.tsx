import React from "react";
import { Sliders } from "lucide-react";

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
  return (
    <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-neutral-700">
          <Sliders size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-neutral-800">Filter Intensity</h2>
          <p className="text-sm text-neutral-500 italic">Adjust the strength</p>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={intensity}
        onChange={onIntensityChange}
        disabled={!enabled}
        className="w-full accent-neutral-900"
      />
      <div className="text-right text-sm text-neutral-500">{intensity}%</div>
    </div>
  );
};

export default IntensityCard;
