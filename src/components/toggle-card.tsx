import { Power } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import ShortcutBadge from "@/components/shortcut-badge";
import { getShortcutByName } from "@/utils/shortcuts";

interface ToggleCardProps {
  enabled: boolean;
  isTemporaryDisabled?: boolean;
  onToggle: () => void;
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

  const getButtonText = () => {
    if (isTemporaryDisabled) {
      return "Disabled";
    }
    if (enabled) {
      return "Active";
    }
    return "Inactive";
  };

  const getButtonClassName = () => {
    if (isDisabled) {
      return "cursor-not-allowed bg-neutral-200 text-neutral-400";
    }
    if (enabled) {
      return "bg-neutral-900 text-neutral-50 hover:bg-neutral-800 active:bg-neutral-950";
    }
    return "border border-neutral-300 bg-neutral-100 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-200";
  };

  return (
    <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-neutral-700">
            <Power size={18} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-neutral-800 text-sm">
              Greyscale Filter
            </h2>
            <p className="text-neutral-500 text-xs italic">
              Toggle monochrome mode
            </p>
            <ShortcutBadge shortcut={shortcut} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className={`rounded-lg px-3 py-2 text-xs transition-colors ${getButtonClassName()}`}
            disabled={isDisabled}
            onClick={isDisabled ? undefined : onToggle}
            title={
              isTemporaryDisabled
                ? "Cannot toggle while temporarily disabled"
                : undefined
            }
            type="button"
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToggleCard;
