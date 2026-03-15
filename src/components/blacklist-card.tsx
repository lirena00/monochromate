import { ChevronDown, Globe, Link, Shield } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import ShortcutBadge from "@/components/shortcut-badge";
import { getShortcutByName } from "@/utils/shortcuts";
import { urlMatchesPattern } from "@/utils/url-utils";

interface BlacklistCardProps {
  blacklist: string[];
  currentFullUrl: string;
  currentUrl: string;
  isCurrentUrlBlacklisted: boolean;
  onAddCurrentSite: () => void;
  onAddCurrentUrl: () => void;
  onManageAllSites: () => void;
  onRemoveSite: (site: string, type?: "domain" | "pattern") => void;
  urlPatternBlacklist: string[];
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
    <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-neutral-700">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800 text-sm">
              Excluded Sites
              {totalExclusions > 0 && (
                <span className="ml-2 rounded-full bg-neutral-200 px-1.5 py-0.5 text-xs">
                  {totalExclusions}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1">
              <p className="text-neutral-500 text-xs italic">
                Manage exceptions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
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
            <span className="truncate font-medium text-xs">{currentUrl}</span>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <ShortcutBadge shortcut={shortcut} />
            {isCurrentUrlBlacklisted ? (
              <button
                className="rounded bg-neutral-200 px-2 py-1 text-neutral-700 text-xs transition-colors hover:bg-neutral-300"
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
                type="button"
              >
                Remove
              </button>
            ) : (
              <div className="relative">
                <button
                  className="flex items-center gap-1 rounded bg-neutral-900 px-2 py-1 text-white text-xs transition-colors hover:bg-neutral-800"
                  onClick={() => setShowUrlOption(!showUrlOption)}
                  type="button"
                >
                  Exclude
                  <ChevronDown
                    className={`transition-transform ${
                      showUrlOption ? "rotate-180" : ""
                    }`}
                    size={10}
                  />
                </button>

                {showUrlOption && (
                  <div className="absolute top-full right-0 z-50 mt-1 min-w-[160px] rounded-lg border border-neutral-200 bg-white text-xs shadow-lg">
                    <div className="p-1">
                      <button
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-neutral-50"
                        onClick={() => {
                          onAddCurrentSite();
                          setShowUrlOption(false);
                        }}
                        type="button"
                      >
                        <Globe className="text-neutral-600" size={12} />
                        <div className="text-left">
                          <div className="font-medium">Entire domain</div>
                          <div className="truncate text-neutral-500 text-xs">
                            All of {currentUrl}
                          </div>
                        </div>
                      </button>

                      <button
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-neutral-50"
                        onClick={() => {
                          onAddCurrentUrl();
                          setShowUrlOption(false);
                        }}
                        type="button"
                      >
                        <Link className="text-neutral-600" size={12} />
                        <div className="text-left">
                          <div className="font-medium">Smart pattern</div>
                          <div className="text-neutral-500 text-xs">
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
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2 text-neutral-50 text-xs transition-colors hover:bg-neutral-800 active:bg-neutral-950"
        onClick={onManageAllSites}
        type="button"
      >
        Manage all excluded sites
      </button>
    </div>
  );
};

export default BlacklistCard;
