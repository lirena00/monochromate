import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  AlertCircle,
  X,
  Shield,
  ShieldCheck,
  Link,
  Globe,
  Plus,
  Image,
} from "lucide-react";
import Footer from "./Footer";
import InfoTooltip from "./InfoTooltip";
import {
  getUnifiedExclusions,
  suggestUrlPattern,
  isValidUrlPattern,
  urlMatchesPattern,
  parseSitesFromText,
} from "@/utils/urlUtils";

interface SiteListManagementProps {
  mode: "blacklist" | "whitelist";
  searchTerm: string;
  currentUrl: string;
  currentFullUrl: string;
  blacklist: string[];
  urlPatternBlacklist: string[];
  whitelist: string[];
  urlPatternWhitelist: string[];
  filteredBlacklist: string[];
  isCurrentUrlInActiveList: boolean;
  onSearchChange: (value: string) => void;
  onReturnToMain: () => void;
  onAddCurrentSite: () => void;
  onAddCurrentUrl: () => void;
  onRemoveSite: (
    site: string,
    type?: "domain" | "pattern",
    targetMode?: "blacklist" | "whitelist"
  ) => void;
  onBulkImport: (
    sites: string[],
    type: "domain" | "pattern",
    targetMode: "blacklist" | "whitelist"
  ) => void;
  mediaExceptionEnabled: boolean;
  onToggleMediaException: () => void;
}

type FilterType = "all" | "domains" | "patterns";
type ListTab = "blacklist" | "whitelist";

const SiteListManagement: React.FC<SiteListManagementProps> = ({
  mode,
  searchTerm,
  currentUrl,
  currentFullUrl,
  blacklist,
  urlPatternBlacklist,
  whitelist,
  urlPatternWhitelist,
  isCurrentUrlInActiveList,
  onSearchChange,
  onReturnToMain,
  onAddCurrentSite,
  onAddCurrentUrl,
  onRemoveSite,
  onBulkImport,
  mediaExceptionEnabled,
  onToggleMediaException,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeTab, setActiveTab] = useState<ListTab>(mode);
  const [addInput, setAddInput] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const blacklistExclusions = useMemo(
    () => getUnifiedExclusions(blacklist, urlPatternBlacklist),
    [blacklist, urlPatternBlacklist]
  );

  const whitelistExclusions = useMemo(
    () => getUnifiedExclusions(whitelist, urlPatternWhitelist),
    [whitelist, urlPatternWhitelist]
  );

  const currentExclusions =
    activeTab === "blacklist" ? blacklistExclusions : whitelistExclusions;

  const filteredExclusions = useMemo(() => {
    let filtered = currentExclusions;
    if (activeFilter === "domains")
      filtered = filtered.filter((i) => i.type === "domain");
    else if (activeFilter === "patterns")
      filtered = filtered.filter((i) => i.type === "pattern");

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.value.toLowerCase().includes(q) ||
          i.displayName.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [currentExclusions, activeFilter, searchTerm]);

  const counts = useMemo(() => {
    const d = currentExclusions.filter((i) => i.type === "domain").length;
    const p = currentExclusions.filter((i) => i.type === "pattern").length;
    return { all: d + p, domains: d, patterns: p };
  }, [currentExclusions]);

  const handleImport = () => {
    const parsed = parseSitesFromText(bulkText);
    const valid = parsed.filter((s) => s.valid);
    const domains = valid
      .filter((s) => s.type === "domain")
      .map((s) => s.value);
    const patterns = valid
      .filter((s) => s.type === "pattern")
      .map((s) => s.value);
    if (domains.length > 0) onBulkImport(domains, "domain", activeTab);
    if (patterns.length > 0) onBulkImport(patterns, "pattern", activeTab);
    setBulkText("");
  };

  const handleAddCustom = () => {
    const value = addInput.trim();
    if (!value) return;

    const isPattern = value.includes("*");
    if (isPattern && isValidUrlPattern(value)) {
      onBulkImport([value], "pattern", activeTab);
    } else if (!isPattern && value.includes(".")) {
      onBulkImport([value], "domain", activeTab);
    }
    setAddInput("");
    setShowAddInput(false);
  };

  const parsedBulk = useMemo(() => parseSitesFromText(bulkText), [bulkText]);
  const validBulkCount = parsedBulk.filter((s) => s.valid).length;

  const filterOptions: { type: FilterType; label: string; count: number }[] = [
    { type: "all", label: "All", count: counts.all },
    { type: "domains", label: "Domains", count: counts.domains },
    { type: "patterns", label: "Patterns", count: counts.patterns },
  ];

  return (
    <div className="flex flex-col min-h-[800px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onReturnToMain}
          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-bold text-neutral-800">Manage Sites</h1>
      </div>

      {/* Segmented Tabs */}
      <div className="flex bg-neutral-100 rounded-lg p-0.5 mb-4">
        <button
          onClick={() => setActiveTab("blacklist")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
            activeTab === "blacklist"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <Shield size={12} />
          Blacklist ({blacklistExclusions.length})
          {mode === "blacklist" && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-green-500"
              title="Active mode"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("whitelist")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
            activeTab === "whitelist"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <ShieldCheck size={12} />
          Whitelist ({whitelistExclusions.length})
          {mode === "whitelist" && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-green-500"
              title="Active mode"
            />
          )}
        </button>
      </div>

      {/* Current site quick-add (only if not already in list and viewing active mode's tab) */}
      {currentUrl && !isCurrentUrlInActiveList && activeTab === mode && (
        <div className="flex items-center gap-2 p-2.5 mb-3 bg-neutral-50 border border-neutral-200 rounded-lg">
          <div className="w-4 h-4 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0">
            {currentUrl && (
              <img
                src={`https://www.google.com/s2/favicons?domain=${currentUrl}&sz=32`}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <span className="text-xs text-neutral-600 truncate flex-1">
            {currentUrl}
          </span>
          <button
            onClick={onAddCurrentSite}
            className="text-xs px-2 py-1 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors"
          >
            <Globe size={10} className="inline mr-1" />
            Add
          </button>
          <button
            onClick={onAddCurrentUrl}
            className="text-xs p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
            title="Add as URL pattern"
          >
            <Link size={12} />
          </button>
        </div>
      )}

      {/* Search + Filter row */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            className="w-full pl-8 pr-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-400 transition-colors"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex bg-neutral-100 rounded-lg p-0.5">
          {filterOptions.map(({ type, label, count }) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`px-2 py-1.5 text-xs rounded-md transition-all ${
                activeFilter === type
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {label}
              {count > 0 && (
                <span className="ml-0.5 opacity-60">{count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Site List */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-neutral-200 mb-3 min-h-[180px]">
        {filteredExclusions.length > 0 ? (
          filteredExclusions.map((ex) => (
            <div
              key={`${ex.type}-${ex.value}`}
              className="flex items-center gap-2.5 py-2 px-3 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors group"
            >
              <div className="w-3.5 h-3.5 bg-neutral-100 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src={ex.favicon}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-700 truncate">
                    {ex.displayName}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs px-1 py-0.5 rounded ${
                      ex.type === "domain"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {ex.type === "domain" ? (
                      <Globe size={8} />
                    ) : (
                      <Link size={8} />
                    )}
                  </span>
                </div>
                {ex.type === "pattern" && ex.value !== ex.displayName && (
                  <div className="text-xs text-neutral-400 truncate mt-0.5 font-mono">
                    {ex.value}
                  </div>
                )}
              </div>
              <button
                onClick={() =>
                  onRemoveSite(ex.value, ex.type, activeTab)
                }
                className="text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove"
              >
                <X size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            {searchTerm ? (
              <>
                <AlertCircle
                  size={16}
                  className="mx-auto text-neutral-300 mb-2"
                />
                <p className="text-xs text-neutral-400">
                  No matches for &ldquo;{searchTerm}&rdquo;
                </p>
              </>
            ) : (
              <>
                {activeTab === "blacklist" ? (
                  <Shield
                    size={16}
                    className="mx-auto text-neutral-300 mb-2"
                  />
                ) : (
                  <ShieldCheck
                    size={16}
                    className="mx-auto text-neutral-300 mb-2"
                  />
                )}
                <p className="text-xs text-neutral-400">
                  No sites in {activeTab}
                </p>
                <p className="text-xs text-neutral-300 mt-1">
                  {activeTab === "blacklist"
                    ? "Add sites to skip grayscale on them"
                    : "Add sites to apply grayscale only there"}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Sites Section */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-700">
            Add sites to {activeTab}
          </span>
          {!showAddInput && (
            <button
              onClick={() => setShowAddInput(true)}
              className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1 transition-colors"
            >
              <Plus size={10} />
              Single
            </button>
          )}
        </div>

        {/* Single add input */}
        {showAddInput && (
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              placeholder="domain.com or pattern.com/path/*"
              className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCustom();
                if (e.key === "Escape") {
                  setShowAddInput(false);
                  setAddInput("");
                }
              }}
              autoFocus
            />
            <button
              onClick={handleAddCustom}
              disabled={!addInput.trim()}
              className="px-2.5 py-1.5 text-xs bg-neutral-900 text-white rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddInput(false);
                setAddInput("");
              }}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Bulk textarea */}
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={`Paste domains or patterns separated by commas or new lines\ne.g. youtube.com, reddit.com/r/*`}
          className="w-full h-16 px-2.5 py-2 text-xs bg-white border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400 resize-none"
        />
        {bulkText.trim() && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-neutral-500">
              {validBulkCount} valid site{validBulkCount !== 1 ? "s" : ""}{" "}
              detected
            </span>
            <button
              onClick={handleImport}
              disabled={validBulkCount === 0}
              className="px-3 py-1.5 text-xs bg-neutral-900 text-white rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              Import
            </button>
          </div>
        )}
      </div>

      {/* Media Exception */}
      <div className="flex items-center justify-between py-2.5 px-3 bg-neutral-50 border border-neutral-200 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <Image size={14} className="text-neutral-500" />
          <span className="text-xs text-neutral-600">
            Skip media-only pages
          </span>
          <InfoTooltip content="Pages with only images or videos won't be affected" />
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

      <Footer />
    </div>
  );
};

export default SiteListManagement;
