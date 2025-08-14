import React, { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { getShortcutByName } from "@/utils/shortcuts";
import ShortcutBadge from "@/components/ShortcutBadge";

interface BlacklistCardProps {
  currentUrl: string;
  blacklist: string[];
  isCurrentUrlBlacklisted: boolean;
  onAddCurrentSite: () => void;
  onRemoveSite: (site: string) => void;
  onManageAllSites: () => void;
}

const BlacklistCard: React.FC<BlacklistCardProps> = ({
  currentUrl,
  blacklist,
  isCurrentUrlBlacklisted,
  onAddCurrentSite,
  onRemoveSite,
  onManageAllSites,
}) => {
  const [shortcut, setShortcut] = useState<string>("");

  useEffect(() => {
    getShortcutByName("quick_toggle_blacklist").then(setShortcut);
  }, []);

  return (
    <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-neutral-700">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800">
              Excluded Sites
              {blacklist.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-neutral-200 rounded-full">
                  {blacklist.length}
                </span>
              )}
            </h2>
            <p className="text-sm text-neutral-500 italic">Manage exceptions</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-neutral-200 rounded-full overflow-hidden">
            {currentUrl && (
              <img
                src={`https://www.google.com/s2/favicons?domain=${currentUrl}&sz=64`}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <span className="text-sm font-medium truncate max-w-[140px]">
            {currentUrl}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ShortcutBadge shortcut={shortcut} />
          {isCurrentUrlBlacklisted ? (
            <button
              onClick={() => onRemoveSite(currentUrl)}
              className="text-xs px-2 py-1 bg-neutral-200 text-neutral-700 rounded-sm hover:bg-neutral-300 transition-colors"
            >
              Remove
            </button>
          ) : (
            <button
              onClick={onAddCurrentSite}
              className="text-xs px-2 py-1 bg-neutral-900 text-white rounded-sm hover:bg-neutral-800 transition-colors"
            >
              Exclude
            </button>
          )}
        </div>
      </div>

      <button
        onClick={onManageAllSites}
        className="mt-3 w-full text-sm flex items-center justify-center gap-2 py-2 transition-colors rounded-lg bg-neutral-900 text-neutral-50 hover:bg-neutral-800 active:bg-neutral-950"
      >
        Manage all excluded sites
      </button>
    </div>
  );
};

export default BlacklistCard;
