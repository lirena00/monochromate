import React, { useState, useEffect } from "react";
import { Shield, ChevronDown, Link, Globe } from "lucide-react";
import { getShortcutByName } from "@/utils/shortcuts";
import ShortcutBadge from "@/components/ShortcutBadge";
import { urlMatchesPattern } from "@/utils/urlUtils";

interface BlacklistCardProps {
  currentUrl: string;
  currentFullUrl: string;
  blacklist: string[];
  urlPatternBlacklist: string[];
  isCurrentUrlBlacklisted: boolean;
  onAddCurrentSite: () => void;
  onAddCurrentUrl: () => void;
  onRemoveSite: (site: string, type?: "domain" | "pattern") => void;
  onManageAllSites: () => void;
}

const BlacklistCard: React.FC<BlacklistCardProps> = ({
  currentUrl,
  currentFullUrl,
  blacklist,
  urlPatternBlacklist,
  isCurrentUrlBlacklisted,
  onAddCurrentSite,
  onAddCurrentUrl,
  onRemoveSite,
  onManageAllSites,
}) => {
  const [shortcut, setShortcut] = useState<string>("");
  const [showUrlOption, setShowUrlOption] = useState(false);

  useEffect(() => {
    getShortcutByName("quick_toggle_blacklist").then(setShortcut);
  }, []);

  const totalExclusions = blacklist.length + urlPatternBlacklist.length;

  return (
    <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-neutral-700">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800 text-sm">
              Excluded Sites
              {totalExclusions > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-neutral-200 rounded-full">
                  {totalExclusions}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1">
              <p className="text-xs text-neutral-500 italic">
                Manage exceptions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-3.5 h-3.5 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0">
              {currentUrl && (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${currentUrl}&sz=32`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <span className="text-xs font-medium truncate">{currentUrl}</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ShortcutBadge shortcut={shortcut} />
            {isCurrentUrlBlacklisted ? (
              <button
                onClick={() => {
                  // Determine which type to remove
                  const domain = currentUrl;
                  const isDomainExcluded = blacklist.includes(domain);

                  // Find matching pattern
                  const matchingPattern = urlPatternBlacklist.find((pattern) =>
                    urlMatchesPattern(
                      currentFullUrl || `https://${currentUrl}`,
                      pattern
                    )
                  );

                  if (isDomainExcluded) {
                    onRemoveSite(domain, "domain");
                  } else if (matchingPattern) {
                    onRemoveSite(matchingPattern, "pattern");
                  }
                }}
                className="text-xs px-2 py-1 bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300 transition-colors"
              >
                Remove
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUrlOption(!showUrlOption)}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-neutral-900 text-white rounded hover:bg-neutral-800 transition-colors"
                >
                  Exclude
                  <ChevronDown
                    size={10}
                    className={`transition-transform ${
                      showUrlOption ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showUrlOption && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 min-w-[160px] text-xs">
                    <div className="p-1">
                      <button
                        onClick={() => {
                          onAddCurrentSite();
                          setShowUrlOption(false);
                        }}
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-xs hover:bg-neutral-50 rounded transition-colors"
                      >
                        <Globe size={12} className="text-neutral-600" />
                        <div className="text-left">
                          <div className="font-medium">Entire domain</div>
                          <div className="text-xs text-neutral-500 truncate">
                            All of {currentUrl}
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          onAddCurrentUrl();
                          setShowUrlOption(false);
                        }}
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-xs hover:bg-neutral-50 rounded transition-colors"
                      >
                        <Link size={12} className="text-neutral-600" />
                        <div className="text-left">
                          <div className="font-medium">Smart pattern</div>
                          <div className="text-xs text-neutral-500">
                            URL pattern match
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onManageAllSites}
        className="mt-3 w-full text-xs flex items-center justify-center gap-2 py-2 transition-colors rounded-lg bg-neutral-900 text-neutral-50 hover:bg-neutral-800 active:bg-neutral-950"
      >
        Manage all excluded sites
      </button>
    </div>
  );
};

export default BlacklistCard;
