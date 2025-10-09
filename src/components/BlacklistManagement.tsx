import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  AlertCircle,
  X,
  Shield,
  Filter,
  Link,
  Globe,
} from "lucide-react";
import Footer from "./Footer";
import InfoTooltip from "./InfoTooltip";
import { getShortcutByName } from "@/utils/shortcuts";
import {
  getUnifiedExclusions,
  URLExclusion,
  getDomainFromUrl,
  suggestUrlPattern,
  isValidUrlPattern,
  urlMatchesPattern,
} from "@/utils/urlUtils";
import ShortcutBadge from "@/components/ShortcutBadge";

interface BlacklistManagementProps {
  searchTerm: string;
  currentUrl: string;
  currentFullUrl: string;
  blacklist: string[];
  urlPatternBlacklist: string[];
  filteredBlacklist: string[];
  isCurrentUrlBlacklisted: boolean;
  onSearchChange: (value: string) => void;
  onReturnToMain: () => void;
  onAddCurrentSite: () => void;
  onAddCurrentUrl: () => void;
  onRemoveSite: (site: string, type?: "domain" | "pattern") => void;
  mediaExceptionEnabled: boolean;
  onToggleMediaException: () => void;
}

type FilterType = "all" | "domains" | "patterns";

const BlacklistManagement: React.FC<BlacklistManagementProps> = ({
  searchTerm,
  currentUrl,
  currentFullUrl,
  blacklist,
  urlPatternBlacklist,
  isCurrentUrlBlacklisted,
  onSearchChange,
  onReturnToMain,
  onAddCurrentSite,
  onAddCurrentUrl,
  onRemoveSite,
  mediaExceptionEnabled,
  onToggleMediaException,
}) => {
  const [shortcut, setShortcut] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [showUrlOption, setShowUrlOption] = useState(false);
  const [showPatternInput, setShowPatternInput] = useState(false);
  const [customPattern, setCustomPattern] = useState("");

  useEffect(() => {
    getShortcutByName("quick_toggle_blacklist").then(setShortcut);
  }, []);

  // Update the suggested pattern when URL changes
  useEffect(() => {
    if (currentFullUrl) {
      setCustomPattern(suggestUrlPattern(currentFullUrl));
    }
  }, [currentFullUrl]);

  const unifiedExclusions = useMemo(
    () => getUnifiedExclusions(blacklist, urlPatternBlacklist),
    [blacklist, urlPatternBlacklist]
  );

  const filteredExclusions = useMemo(() => {
    let filtered = unifiedExclusions;

    // Apply type filter
    if (activeFilter === "domains") {
      filtered = filtered.filter((item) => item.type === "domain");
    } else if (activeFilter === "patterns") {
      filtered = filtered.filter((item) => item.type === "pattern");
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.value.toLowerCase().includes(searchLower) ||
          item.displayName.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [unifiedExclusions, activeFilter, searchTerm]);

  const filterCounts = useMemo(() => {
    const domains = unifiedExclusions.filter(
      (item) => item.type === "domain"
    ).length;
    const patterns = unifiedExclusions.filter(
      (item) => item.type === "pattern"
    ).length;

    return {
      all: domains + patterns,
      domains,
      patterns,
    };
  }, [unifiedExclusions]);

  const handleAddCustomPattern = () => {
    if (!customPattern.trim() || !isValidUrlPattern(customPattern)) {
      return;
    }

    // Add the custom pattern
    const newPatternBlacklist = [...urlPatternBlacklist, customPattern];
    browser.runtime.sendMessage({
      type: "setUrlPatternBlacklist",
      value: newPatternBlacklist,
    });

    setShowPatternInput(false);
    setCustomPattern("");
  };

  const FilterButton: React.FC<{
    type: FilterType;
    label: string;
    icon: React.ReactNode;
    count: number;
  }> = ({ type, label, icon, count }) => (
    <button
      onClick={() => setActiveFilter(type)}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
        activeFilter === type
          ? "bg-neutral-900 text-white"
          : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
      }`}
    >
      {icon}
      <span>{label}</span>
      {count > 0 && (
        <span
          className={`px-1 py-0.5 text-xs rounded-full ${
            activeFilter === type
              ? "bg-white/20 text-white"
              : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col min-h-[800px] overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onReturnToMain}
          className="p-1 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-neutral-800">
          Manage Excluded Sites
        </h1>
      </div>

      {/* Current Site Card */}
      <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-neutral-700">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800 text-sm">
              Current Site & Settings
            </h2>
            <div className="flex items-center gap-1">
              <p className="text-xs text-neutral-500 italic">
                Manage current site exclusion settings
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-3">
          <div className="flex justify-between items-center mb-3">
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
                    const matchingPattern = urlPatternBlacklist.find(
                      (pattern) => urlMatchesPattern(currentFullUrl, pattern)
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
                    <X
                      size={10}
                      className={`transition-transform ${
                        showUrlOption ? "rotate-45" : "rotate-0"
                      }`}
                    />
                  </button>

                  {showUrlOption && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 min-w-[180px] text-xs">
                      <div className="p-1.5">
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
                              All pages on {currentUrl}
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
                            <div className="text-xs text-neutral-500 truncate">
                              {suggestUrlPattern(currentFullUrl).substring(
                                0,
                                20
                              )}
                              ...
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setShowPatternInput(true);
                            setShowUrlOption(false);
                          }}
                          className="flex items-center gap-2 w-full px-2 py-1.5 text-xs hover:bg-neutral-50 rounded transition-colors"
                        >
                          <Filter size={12} className="text-neutral-600" />
                          <div className="text-left">
                            <div className="font-medium">Custom pattern</div>
                            <div className="text-xs text-neutral-500">
                              Define your own rule
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

          {/* Custom Pattern Input */}
          {showPatternInput && (
            <div className="mt-3 p-2.5 bg-neutral-50 rounded-lg border">
              <div className="flex items-center gap-1.5 mb-2">
                <Filter size={12} className="text-neutral-600" />
                <span className="text-xs font-medium">Custom URL Pattern</span>
                <InfoTooltip content="Use * as wildcard. Example: google.com/maps/* will match all Google Maps URLs" />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPattern}
                  onChange={(e) => setCustomPattern(e.target.value)}
                  placeholder="example.com/path/*"
                  className="flex-1 px-2 py-1.5 text-xs border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddCustomPattern();
                    } else if (e.key === "Escape") {
                      setShowPatternInput(false);
                    }
                  }}
                />
                <button
                  onClick={handleAddCustomPattern}
                  disabled={
                    !customPattern.trim() || !isValidUrlPattern(customPattern)
                  }
                  className="px-2 py-1.5 text-xs bg-neutral-900 text-white rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowPatternInput(false)}
                  className="px-2 py-1.5 text-xs border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {customPattern && !isValidUrlPattern(customPattern) && (
                <p className="text-xs text-red-500 mt-1">
                  Invalid pattern. Use format: domain.com/path/*
                </p>
              )}
            </div>
          )}

          {/* Media Exception */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
            <div className="flex items-center gap-1">
              <span className="text-xs text-neutral-600">
                Exclude media-only pages
              </span>
              <InfoTooltip content="Automatically exclude pages that only contain images or videos (like photo galleries, video players)" />
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={mediaExceptionEnabled}
                onChange={onToggleMediaException}
              />
              <div className="w-9 h-5 bg-neutral-200 rounded-full peer-checked:bg-neutral-900 transition-colors"></div>
              <div className="absolute top-0.5 left-0.5 bg-white border border-neutral-300 rounded-full h-4 w-4 transition-transform peer-checked:translate-x-4"></div>
            </label>
          </div>
        </div>
      </div>

      {/* All Excluded Sites Card */}
      <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-neutral-700">
            <Filter size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800 text-sm">
              All Excluded Sites
              {filterCounts.all > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-neutral-200 rounded-full">
                  {filterCounts.all}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1">
              <p className="text-xs text-neutral-500 italic">
                Search and filter all exclusions
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 mb-3">
          <FilterButton
            type="all"
            label="All"
            icon={<Filter size={12} />}
            count={filterCounts.all}
          />
          <FilterButton
            type="domains"
            label="Domains"
            icon={<Globe size={12} />}
            count={filterCounts.domains}
          />
          <FilterButton
            type="patterns"
            label="Patterns"
            icon={<Link size={12} />}
            count={filterCounts.patterns}
          />
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500">
            <Search size={12} />
          </div>
          <input
            type="text"
            className="w-full pl-8 pr-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs hover:border-neutral-400 transition-all focus:outline-none focus:border-neutral-400"
            placeholder={`Search ${
              activeFilter === "all" ? "all exclusions" : activeFilter
            }...`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
          />
        </div>

        {/* Sites List */}
        <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-neutral-200 min-h-0">
          {filteredExclusions.length > 0 ? (
            filteredExclusions.map((exclusion) => (
              <div
                key={`${exclusion.type}-${exclusion.value}`}
                className="flex justify-between items-center py-2.5 px-3 border-b border-neutral-200 last:border-0 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-3.5 h-3.5 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={exclusion.favicon}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-neutral-700 truncate">
                        {exclusion.displayName}
                      </span>
                      <div
                        className={`flex items-center gap-1 px-1 py-0.5 rounded text-xs ${
                          exclusion.type === "domain"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {exclusion.type === "domain" ? (
                          <Globe size={8} />
                        ) : (
                          <Link size={8} />
                        )}
                        <span className="text-xs">{exclusion.type}</span>
                      </div>
                    </div>
                    {exclusion.type === "pattern" &&
                      exclusion.value !== exclusion.displayName && (
                        <div className="text-xs text-neutral-400 truncate mt-0.5 font-mono">
                          {exclusion.value}
                        </div>
                      )}
                  </div>
                </div>

                <button
                  onClick={() => onRemoveSite(exclusion.value, exclusion.type)}
                  className="text-neutral-500 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                  title={`Remove ${exclusion.type} exclusion`}
                >
                  <X size={12} />
                </button>
              </div>
            ))
          ) : (
            <div className="py-6 px-3 text-center flex flex-col items-center gap-2">
              {searchTerm ? (
                <>
                  <div className="text-neutral-400">
                    <AlertCircle size={16} />
                  </div>
                  <p className="text-xs text-neutral-500">
                    No {activeFilter === "all" ? "exclusions" : activeFilter}{" "}
                    match "{searchTerm}"
                  </p>
                </>
              ) : (
                <>
                  <div className="text-neutral-400">
                    {activeFilter === "all" ? (
                      <Filter size={16} />
                    ) : activeFilter === "domains" ? (
                      <Globe size={16} />
                    ) : (
                      <Link size={16} />
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">
                    No {activeFilter === "all" ? "exclusions" : activeFilter}{" "}
                    yet
                  </p>
                  {activeFilter !== "all" && (
                    <button
                      onClick={() => setActiveFilter("all")}
                      className="text-xs text-neutral-400 hover:text-neutral-600 underline"
                    >
                      View all exclusions
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlacklistManagement;
