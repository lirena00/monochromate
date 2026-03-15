import { ChevronRight, Globe, Link, Shield } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import ShortcutBadge from "@/components/shortcut-badge";
import { getShortcutByName } from "@/utils/shortcuts";
import { urlMatchesPattern } from "@/utils/url-utils";
import InfoTooltip from "./info-tooltip";

interface SiteListCardProps {
  blacklist: string[];
  currentFullUrl: string;
  currentUrl: string;
  isCurrentUrlInActiveList: boolean;
  mode: "blacklist" | "whitelist";
  onAddCurrentSite: () => void;
  onAddCurrentUrl: () => void;
  onManageAllSites: () => void;
  onModeChange: (mode: "blacklist" | "whitelist") => void;
  onRemoveSite: (site: string, type?: "domain" | "pattern") => void;
  urlPatternBlacklist: string[];
  urlPatternWhitelist: string[];
  whitelist: string[];
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
    <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-neutral-700">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="flex items-center gap-1.5 font-semibold text-neutral-800 text-sm">
              Site Filter
              <InfoTooltip content={modeDesc[mode]} />
            </h2>
            <p className="text-neutral-500 text-xs italic">{modeDesc[mode]}</p>
          </div>
        </div>
        <ShortcutBadge shortcut={shortcut} />
      </div>

      {/* Segmented Mode Toggle */}
      <div className="mb-3 flex rounded-lg bg-neutral-200/70 p-0.5">
        <button
          className={`flex-1 rounded-lg py-1.5 font-medium text-xs transition-all ${
            mode === "blacklist"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
          onClick={() => onModeChange("blacklist")}
          type="button"
        >
          Blacklist
          {blacklist.length + urlPatternBlacklist.length > 0 && (
            <span
              className={`ml-1 ${mode === "blacklist" ? "text-neutral-500" : "text-neutral-400"}`}
            >
              ({blacklist.length + urlPatternBlacklist.length})
            </span>
          )}
        </button>
        <button
          className={`flex-1 rounded-lg py-1.5 font-medium text-xs transition-all ${
            mode === "whitelist"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
          onClick={() => onModeChange("whitelist")}
          type="button"
        >
          Whitelist
          {whitelist.length + urlPatternWhitelist.length > 0 && (
            <span
              className={`ml-1 ${mode === "whitelist" ? "text-neutral-500" : "text-neutral-400"}`}
            >
              ({whitelist.length + urlPatternWhitelist.length})
            </span>
          )}
        </button>
      </div>

      {/* Current Site */}
      <div className="rounded-lg border border-neutral-200 bg-white p-2.5">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 flex-shrink-0 overflow-hidden rounded-full bg-neutral-200">
            {currentUrl && (
              <img
                alt=""
                className="h-full w-full object-cover"
                height={14}
                src={`https://www.google.com/s2/favicons?domain=${currentUrl}&sz=32`}
                width={14}
              />
            )}
          </div>
          <span className="flex-1 truncate font-medium text-xs">
            {currentUrl}
          </span>

          <div className="flex flex-shrink-0 items-center gap-1.5">
            {isCurrentUrlInActiveList ? (
              <button
                className="rounded-lg bg-neutral-100 px-2.5 py-1 text-neutral-600 text-xs transition-colors hover:border-neutral-400 hover:bg-neutral-200"
                onClick={() => {
                  const isDomainInList = activeList.includes(currentUrl);
                  const matchingPattern = activePatternList.find((p) =>
                    urlMatchesPattern(
                      currentFullUrl || `https://${currentUrl}`,
                      p
                    )
                  );
                  if (isDomainInList) {
                    onRemoveSite(currentUrl, "domain");
                  } else if (matchingPattern) {
                    onRemoveSite(matchingPattern, "pattern");
                  }
                }}
                type="button"
              >
                Remove
              </button>
            ) : (
              <>
                <button
                  className="rounded-lg bg-neutral-900 px-2.5 py-1 text-neutral-50 text-xs transition-colors hover:bg-neutral-800 active:bg-neutral-950"
                  onClick={onAddCurrentSite}
                  title={`${actionLabel} entire domain`}
                  type="button"
                >
                  <Globe className="mr-1 inline" size={10} />
                  {actionLabel}
                </button>
                <button
                  className="rounded-lg p-1 text-neutral-400 text-xs transition-colors hover:bg-neutral-100 hover:text-neutral-800"
                  onClick={onAddCurrentUrl}
                  title="Add as URL pattern"
                  type="button"
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
        className="mt-3 flex w-full items-center justify-between rounded-lg bg-neutral-900 px-3 py-2 text-neutral-50 text-xs transition-colors hover:bg-neutral-800 active:bg-neutral-950"
        onClick={onManageAllSites}
        type="button"
      >
        <span>Manage{totalSites > 0 ? ` ${totalSites}` : ""} sites</span>
        <ChevronRight size={12} />
      </button>
    </div>
  );
};

export default SiteListCard;
