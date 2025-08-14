import React, { useState, useEffect } from "react";
import { Power } from "lucide-react";
import { getShortcutByName } from "@/utils/shortcuts";
import ShortcutBadge from "@/components/ShortcutBadge";

interface ToggleCardProps {
  enabled: boolean;
  onToggle: () => void;
}

const ToggleCard: React.FC<ToggleCardProps> = ({ enabled, onToggle }) => {
  const [shortcut, setShortcut] = useState<string>("");

  useEffect(() => {
    getShortcutByName("toggle_greyscale").then(setShortcut);
  }, []);

  return (
    <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-neutral-700">
            <Power size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-neutral-800">Greyscale Filter</h2>
            <p className="text-sm text-neutral-500 italic">
              Toggle monochrome mode
            </p>
            <ShortcutBadge shortcut={shortcut} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`px-4 py-2 rounded-lg transition-colors ${
              enabled
                ? "bg-neutral-900 text-neutral-50 hover:bg-neutral-800 active:bg-neutral-950"
                : "bg-neutral-100 text-neutral-700 border border-neutral-300 hover:bg-neutral-200 hover:border-neutral-400"
            }`}
            onClick={onToggle}
          >
            {enabled ? "Active" : "Inactive"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToggleCard;
