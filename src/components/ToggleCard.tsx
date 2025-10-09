import React, { useState, useEffect } from "react";
import { Power } from "lucide-react";
import { getShortcutByName } from "@/utils/shortcuts";
import ShortcutBadge from "@/components/ShortcutBadge";

interface ToggleCardProps {
  enabled: boolean;
  onToggle: () => void;
  isTemporaryDisabled?: boolean;
}

const ToggleCard: React.FC<ToggleCardProps> = ({
  enabled,
  onToggle,
  isTemporaryDisabled = false,
}) => {
  const [shortcut, setShortcut] = useState<string>("");

  useEffect(() => {
    getShortcutByName("toggle_greyscale").then(setShortcut);
  }, []);

  const isDisabled = isTemporaryDisabled;
  const buttonText = isTemporaryDisabled
    ? "Disabled"
    : enabled
    ? "Active"
    : "Inactive";

  return (
    <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-neutral-700">
            <Power size={18} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-sm text-neutral-800">
              Greyscale Filter
            </h2>
            <p className="text-xs text-neutral-500 italic">
              Toggle monochrome mode
            </p>
            <ShortcutBadge shortcut={shortcut} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className={`px-3 py-2 rounded-lg text-xs transition-colors ${
              isDisabled
                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                : enabled
                ? "bg-neutral-900 text-neutral-50 hover:bg-neutral-800 active:bg-neutral-950"
                : "bg-neutral-100 text-neutral-700 border border-neutral-300 hover:bg-neutral-200 hover:border-neutral-400"
            }`}
            onClick={isDisabled ? undefined : onToggle}
            disabled={isDisabled}
            title={
              isTemporaryDisabled
                ? "Cannot toggle while temporarily disabled"
                : undefined
            }
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToggleCard;
