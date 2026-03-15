import {
  AlertCircle,
  ArrowLeft,
  Filter,
  Globe,
  Link,
  Search,
  Shield,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import ShortcutBadge from "@/components/shortcut-badge";
import { getShortcutByName } from "@/utils/shortcuts";
import {
  getUnifiedExclusions,
  isValidUrlPattern,
  suggestUrlPattern,
  urlMatchesPattern,
} from "@/utils/url-utils";
import Footer from "./footer";
import InfoTooltip from "./info-tooltip";

interface BlacklistManagementProps {
  blacklist: string[];
  currentFullUrl: string;
  currentUrl: string;
  filteredBlacklist: string[];
  isCurrentUrlBlacklisted: boolean;
  mediaExceptionEnabled: boolean;
  onAddCurrentSite: () => void;
  onAddCurrentUrl: () => void;
  onRemoveSite: (site: string, type?: "domain" | "pattern") => void;
  onReturnToMain: () => void;
  onSearchChange: (value: string) => void;
  onToggleMediaException: () => void;
  searchTerm: string;
  urlPatternBlacklist: string[];
}

type FilterType = "all" | "domains" | "patterns";

interface FilterButtonProps {
  activeFilter: FilterType;
  count: number;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  type: FilterType;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  type,
  label,
  icon,
  count,
  activeFilter,
  onClick,
}) => (
  <button
    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
      activeFilter === type
        ? "bg-neutral-900 text-white"
        : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
    }`}
    onClick={onClick}
    type="button"
  >
    {icon}
    <span>{label}</span>
    {count > 0 && (
      <span
        className={`rounded-full px-1 py-0.5 text-xs ${
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

/**
 * Returns the appropriate icon for a given filter type
 */
const getFilterIcon = (filter: FilterType): React.ReactNode => {
  if (filter === "domains") {
    return <Globe size={16} />;
  }
  if (filter === "patterns") {
    return <Link size={16} />;
  }
  return <Filter size={16} />;
};

/**
 * Returns the display label for a given filter type
 */
const getFilterLabel = (filter: FilterType): string => {
  if (filter === "all") {
    return "exclusions";
  }
  return filter;
};

interface ExcludeDropdownProps {
  currentFullUrl: string;
  currentUrl: string;
  onAddCurrentSite: () => void;
  onAddCurrentUrl: () => void;
  onShowPatternInput: () => void;
  showUrlOption: boolean;
  toggleUrlOption: () => void;
}

const ExcludeDropdown: React.FC<ExcludeDropdownProps> = ({
  currentUrl,
  currentFullUrl,
  showUrlOption,
  toggleUrlOption,
  onAddCurrentSite,
  onAddCurrentUrl,
  onShowPatternInput,
}) => (
  <div className="relative">
    <button
      className="flex items-center gap-1 rounded bg-neutral-900 px-2 py-1 text-white text-xs transition-colors hover:bg-neutral-800"
      onClick={toggleUrlOption}
      type="button"
    >
      Exclude
      <X
        className={`transition-transform ${
          showUrlOption ? "rotate-45" : "rotate-0"
        }`}
        size={10}
      />
    </button>

    {showUrlOption && (
      <div className="absolute top-full right-0 z-50 mt-1 min-w-[180px] rounded-lg border border-neutral-200 bg-white text-xs shadow-lg">
        <div className="p-1.5">
          <button
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-neutral-50"
            onClick={onAddCurrentSite}
            type="button"
          >
            <Globe className="text-neutral-600" size={12} />
            <div className="text-left">
              <div className="font-medium">Entire domain</div>
              <div className="truncate text-neutral-500 text-xs">
                All pages on {currentUrl}
              </div>
            </div>
          </button>

          <button
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-neutral-50"
            onClick={onAddCurrentUrl}
            type="button"
          >
            <Link className="text-neutral-600" size={12} />
            <div className="text-left">
              <div className="font-medium">Smart pattern</div>
              <div className="truncate text-neutral-500 text-xs">
                {suggestUrlPattern(currentFullUrl).substring(0, 20)}...
              </div>
            </div>
          </button>

          <button
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-neutral-50"
            onClick={onShowPatternInput}
            type="button"
          >
            <Filter className="text-neutral-600" size={12} />
            <div className="text-left">
              <div className="font-medium">Custom pattern</div>
              <div className="text-neutral-500 text-xs">
                Define your own rule
              </div>
            </div>
          </button>
        </div>
      </div>
    )}
  </div>
);

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
    if (!(customPattern.trim() && isValidUrlPattern(customPattern))) {
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

  return (
    <div className="flex min-h-[800px] flex-col overflow-hidden">
      <div className="mb-4 flex items-center gap-3">
        <button
          className="flex items-center justify-center rounded-full p-1 transition-colors hover:bg-neutral-100"
          onClick={onReturnToMain}
          type="button"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg text-neutral-800">
          Manage Excluded Sites
        </h1>
      </div>

      {/* Current Site Card */}
      <div className="mb-4 rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
        <div className="mb-3 flex items-center gap-3">
          <div className="text-neutral-700">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800 text-sm">
              Current Site & Settings
            </h2>
            <div className="flex items-center gap-1">
              <p className="text-neutral-500 text-xs italic">
                Manage current site exclusion settings
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
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
                    const matchingPattern = urlPatternBlacklist.find(
                      (pattern) => urlMatchesPattern(currentFullUrl, pattern)
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
                <ExcludeDropdown
                  currentFullUrl={currentFullUrl}
                  currentUrl={currentUrl}
                  onAddCurrentSite={() => {
                    onAddCurrentSite();
                    setShowUrlOption(false);
                  }}
                  onAddCurrentUrl={() => {
                    onAddCurrentUrl();
                    setShowUrlOption(false);
                  }}
                  onShowPatternInput={() => {
                    setShowPatternInput(true);
                    setShowUrlOption(false);
                  }}
                  showUrlOption={showUrlOption}
                  toggleUrlOption={() => setShowUrlOption(!showUrlOption)}
                />
              )}
            </div>
          </div>

          {/* Custom Pattern Input */}
          {showPatternInput && (
            <div className="mt-3 rounded-lg border bg-neutral-50 p-2.5">
              <div className="mb-2 flex items-center gap-1.5">
                <Filter className="text-neutral-600" size={12} />
                <span className="font-medium text-xs">Custom URL Pattern</span>
                <InfoTooltip content="Use * as wildcard. Example: google.com/maps/* will match all Google Maps URLs" />
              </div>

              <div className="flex gap-2">
                <input
                  className="flex-1 rounded border border-neutral-200 px-2 py-1.5 text-xs focus:border-neutral-400 focus:outline-none"
                  onChange={(e) => setCustomPattern(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddCustomPattern();
                    } else if (e.key === "Escape") {
                      setShowPatternInput(false);
                    }
                  }}
                  placeholder="example.com/path/*"
                  type="text"
                  value={customPattern}
                />
                <button
                  className="rounded bg-neutral-900 px-2 py-1.5 text-white text-xs transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    !(customPattern.trim() && isValidUrlPattern(customPattern))
                  }
                  onClick={handleAddCustomPattern}
                  type="button"
                >
                  Add
                </button>
                <button
                  className="rounded border border-neutral-200 px-2 py-1.5 text-xs transition-colors hover:bg-neutral-50"
                  onClick={() => setShowPatternInput(false)}
                  type="button"
                >
                  Cancel
                </button>
              </div>

              {customPattern && !isValidUrlPattern(customPattern) && (
                <p className="mt-1 text-red-500 text-xs">
                  Invalid pattern. Use format: domain.com/path/*
                </p>
              )}
            </div>
          )}

          {/* Media Exception */}
          <div className="flex items-center justify-between border-neutral-200 border-t pt-3">
            <div className="flex items-center gap-1">
              <span className="text-neutral-600 text-xs">
                Exclude media-only pages
              </span>
              <InfoTooltip content="Automatically exclude pages that only contain images or videos (like photo galleries, video players)" />
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                checked={mediaExceptionEnabled}
                className="peer sr-only"
                onChange={onToggleMediaException}
                type="checkbox"
              />
              <div className="h-5 w-9 rounded-full bg-neutral-200 transition-colors peer-checked:bg-neutral-900" />
              <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full border border-neutral-300 bg-white transition-transform peer-checked:translate-x-4" />
            </label>
          </div>
        </div>
      </div>

      {/* All Excluded Sites Card */}
      <div className="flex min-h-[350px] flex-1 flex-col rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
        <div className="mb-3 flex items-center gap-3">
          <div className="text-neutral-700">
            <Filter size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800 text-sm">
              All Excluded Sites
              {filterCounts.all > 0 && (
                <span className="ml-2 rounded-full bg-neutral-200 px-1.5 py-0.5 text-xs">
                  {filterCounts.all}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1">
              <p className="text-neutral-500 text-xs italic">
                Search and filter all exclusions
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-3 flex gap-1.5">
          <FilterButton
            activeFilter={activeFilter}
            count={filterCounts.all}
            icon={<Filter size={12} />}
            label="All"
            onClick={() => setActiveFilter("all")}
            type="all"
          />
          <FilterButton
            activeFilter={activeFilter}
            count={filterCounts.domains}
            icon={<Globe size={12} />}
            label="Domains"
            onClick={() => setActiveFilter("domains")}
            type="domains"
          />
          <FilterButton
            activeFilter={activeFilter}
            count={filterCounts.patterns}
            icon={<Link size={12} />}
            label="Patterns"
            onClick={() => setActiveFilter("patterns")}
            type="patterns"
          />
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <div className="absolute top-1/2 left-2.5 -translate-y-1/2 text-neutral-500">
            <Search size={12} />
          </div>
          <input
            autoFocus
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-8 text-xs transition-all hover:border-neutral-400 focus:border-neutral-400 focus:outline-none"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search ${
              activeFilter === "all" ? "all exclusions" : activeFilter
            }...`}
            type="text"
            value={searchTerm}
          />
        </div>

        {/* Sites List */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white">
          {filteredExclusions.length > 0 ? (
            filteredExclusions.map((exclusion) => (
              <div
                className="flex items-center justify-between border-neutral-200 border-b px-3 py-2.5 transition-colors last:border-0 hover:bg-neutral-50"
                key={`${exclusion.type}-${exclusion.value}`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <div className="h-3.5 w-3.5 flex-shrink-0 overflow-hidden rounded-full bg-neutral-200">
                    <img
                      alt=""
                      className="h-full w-full object-cover"
                      height={14}
                      src={exclusion.favicon}
                      width={14}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-neutral-700 text-xs">
                        {exclusion.displayName}
                      </span>
                      <div
                        className={`flex items-center gap-1 rounded px-1 py-0.5 text-xs ${
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
                        <div className="mt-0.5 truncate font-mono text-neutral-400 text-xs">
                          {exclusion.value}
                        </div>
                      )}
                  </div>
                </div>

                <button
                  className="ml-2 flex-shrink-0 text-neutral-500 transition-colors hover:text-red-500"
                  onClick={() => onRemoveSite(exclusion.value, exclusion.type)}
                  title={`Remove ${exclusion.type} exclusion`}
                  type="button"
                >
                  <X size={12} />
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
              {searchTerm ? (
                <>
                  <div className="text-neutral-400">
                    <AlertCircle size={16} />
                  </div>
                  <p className="text-neutral-500 text-xs">
                    No {getFilterLabel(activeFilter)} match "{searchTerm}"
                  </p>
                </>
              ) : (
                <>
                  <div className="text-neutral-400">
                    {getFilterIcon(activeFilter)}
                  </div>
                  <p className="text-neutral-500 text-xs">
                    No {getFilterLabel(activeFilter)} yet
                  </p>
                  {activeFilter !== "all" && (
                    <button
                      className="text-neutral-400 text-xs underline hover:text-neutral-600"
                      onClick={() => setActiveFilter("all")}
                      type="button"
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
