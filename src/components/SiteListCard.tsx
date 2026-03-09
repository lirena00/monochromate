import React, { useState, useEffect } from "react";
import { Shield, Link, Globe, ChevronRight } from "lucide-react";
import { getShortcutByName } from "@/utils/shortcuts";
import ShortcutBadge from "@/components/ShortcutBadge";
import InfoTooltip from "./InfoTooltip";
import { urlMatchesPattern } from "@/utils/urlUtils";

interface SiteListCardProps {
  mode: "blacklist" | "whitelist";
  onModeChange: (mode: "blacklist" | "whitelist") => void;
  currentUrl: string;
  currentFullUrl: string;
  blacklist: string[];
  urlPatternBlacklist: string[];
  whitelist: string[];
  urlPatternWhitelist: string[];
  isCurrentUrlInActiveList: boolean;
  onAddCurrentSite: () => void;
  onAddCurrentUrl: () => void;
  onRemoveSite: (site: string, type?: "domain" | "pattern") => void;
  onManageAllSites: () => void;
}

const SiteListCard: React.FC<SiteListCardProps> = ({
  mode,
  onModeChange,
  currentUrl,
  currentFullUrl,
  blacklist,
  urlPatternBlacklist,
  whitelist,
  urlPatternWhitelist,
  isCurrentUrlInActiveList,
  onAddCurrentSite,
  onAddCurrentUrl,
  onRemoveSite,
  onManageAllSites,
}) => {
  const [shortcut, setShortcut] = useState<string>("");

  useEffect(() => {
    getShortcutByName("quick_toggle_blacklist").then(setShortcut);
  }, []);

  const activeList = mode === "blacklist" ? blacklist : whitelist;
  const activePatternList =
    mode === "blacklist" ? urlPatternBlacklist : urlPatternWhitelist;
  const totalSites = activeList.length + activePatternList.length;

  const modeDesc = {
    blacklist: "Grayscale everywhere except listed sites",
    whitelist: "Grayscale only on listed sites",
  };

  const actionLabel = mode === "blacklist" ? "Exclude" : "Include";

  return (
    <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-neutral-700" />
          <h2 className="font-semibold text-neutral-800 text-sm flex items-center gap-1.5">
            Site Filter
            <InfoTooltip content={modeDesc[mode]} />
          </h2>
        </div>
        <ShortcutBadge shortcut={shortcut} />
      </div>

      {/* Segmented Mode Toggle */}
      <div className="flex bg-neutral-200/70 rounded-lg p-0.5 mb-2">
        <button
          onClick={() => onModeChange("blacklist")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            mode === "blacklist"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Blacklist
          {blacklist.length + urlPatternBlacklist.length > 0 && (
            <span className={`ml-1 ${mode === "blacklist" ? "text-neutral-500" : "text-neutral-400"}`}>
              ({blacklist.length + urlPatternBlacklist.length})
            </span>
          )}
        </button>
        <button
          onClick={() => onModeChange("whitelist")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            mode === "whitelist"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Whitelist
          {whitelist.length + urlPatternWhitelist.length > 0 && (
            <span className={`ml-1 ${mode === "whitelist" ? "text-neutral-500" : "text-neutral-400"}`}>
              ({whitelist.length + urlPatternWhitelist.length})
            </span>
          )}
        </button>
      </div>
      <p className="text-xs text-neutral-500 mb-3">{modeDesc[mode]}</p>

      {/* Current Site - One-click actions */}
      <div className="bg-white rounded-lg border border-neutral-200 p-2.5">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-neutral-100 rounded-full overflow-hidden flex-shrink-0">
            {currentUrl && (
              <img
                src={`https://www.google.com/s2/favicons?domain=${currentUrl}&sz=32`}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <span className="text-xs font-medium truncate flex-1">
            {currentUrl}
          </span>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isCurrentUrlInActiveList ? (
              <button
                onClick={() => {
                  const isDomainInList = activeList.includes(currentUrl);
                  const matchingPattern = activePatternList.find((p) =>
                    urlMatchesPattern(
                      currentFullUrl || `https://${currentUrl}`,
                      p
                    )
                  );
                  if (isDomainInList) onRemoveSite(currentUrl, "domain");
                  else if (matchingPattern)
                    onRemoveSite(matchingPattern, "pattern");
                }}
                className="text-xs px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-md hover:bg-neutral-200 transition-colors"
              >
                Remove
              </button>
            ) : (
              <>
                <button
                  onClick={onAddCurrentSite}
                  className="text-xs px-2.5 py-1 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors"
                  title={`${actionLabel} entire domain`}
                >
                  <Globe size={10} className="inline mr-1" />
                  {actionLabel}
                </button>
                <button
                  onClick={onAddCurrentUrl}
                  className="text-xs p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors"
                  title="Add as URL pattern"
                >
                  <Link size={12} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Manage Sites */}
      <button
        onClick={onManageAllSites}
        className="mt-3 w-full flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-neutral-900 text-neutral-50 hover:bg-neutral-800 active:bg-neutral-950 transition-colors"
      >
        <span>Manage{totalSites > 0 ? ` ${totalSites}` : ""} sites</span>
        <ChevronRight size={12} />
      </button>
    </div>
  );
};

export default SiteListCard;
