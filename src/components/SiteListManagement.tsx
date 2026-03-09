import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  AlertCircle,
  X,
  Shield,
  ShieldCheck,
  Link,
  Globe,
  Image,
} from "lucide-react";
import Footer from "./Footer";
import InfoTooltip from "./InfoTooltip";
import {
  getUnifiedExclusions,
  isValidUrlPattern,
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
  const [addText, setAddText] = useState("");

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

  const handleAdd = () => {
    const parsed = parseSitesFromText(addText);
    const valid = parsed.filter((s) => s.valid);
    const domains = valid
      .filter((s) => s.type === "domain")
      .map((s) => s.value);
    const patterns = valid
      .filter((s) => s.type === "pattern")
      .map((s) => s.value);
    if (domains.length > 0) onBulkImport(domains, "domain", activeTab);
    if (patterns.length > 0) onBulkImport(patterns, "pattern", activeTab);
    setAddText("");
  };

  const parsedEntries = useMemo(() => parseSitesFromText(addText), [addText]);
  const validCount = parsedEntries.filter((s) => s.valid).length;

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
          className="p-1 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-neutral-800">Manage Sites</h1>
      </div>

      {/* Segmented Tabs */}
      <div className="flex bg-neutral-100 rounded-lg p-0.5 mb-4">
        <button
          onClick={() => setActiveTab("blacklist")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
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
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
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

      {/* Current site quick-add */}
      {currentUrl && !isCurrentUrlInActiveList && activeTab === mode && (
        <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-3 hover:border-neutral-400 transition-all mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={`https://www.google.com/s2/favicons?domain=${currentUrl}&sz=32`}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs text-neutral-600 truncate flex-1">
              {currentUrl}
            </span>
            <button
              onClick={onAddCurrentSite}
              className="text-xs px-2.5 py-1.5 bg-neutral-900 text-neutral-50 rounded-lg hover:bg-neutral-800 active:bg-neutral-950 transition-colors"
            >
              <Globe size={10} className="inline mr-1" />
              Add
            </button>
            <button
              onClick={onAddCurrentUrl}
              className="text-xs p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200 rounded-lg transition-colors"
              title="Add as URL pattern"
            >
              <Link size={12} />
            </button>
          </div>
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
            className="w-full pl-8 pr-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs hover:border-neutral-400 focus:outline-none focus:border-neutral-400 transition-all"
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
              className={`px-2 py-1.5 text-xs rounded-lg transition-all ${
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
      <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-neutral-200 mb-4 min-h-[180px]">
        {filteredExclusions.length > 0 ? (
          filteredExclusions.map((ex) => (
            <div
              key={`${ex.type}-${ex.value}`}
              className="flex items-center gap-2.5 py-2 px-3 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors group"
            >
              <div className="w-3.5 h-3.5 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0">
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

      {/* Add Sites */}
      <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-neutral-700">
            <Globe size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-neutral-800">
              Add Sites
            </h2>
            <p className="text-xs text-neutral-500 italic">
              Enter domains or patterns, press Enter to add
            </p>
          </div>
        </div>

        <textarea
          value={addText}
          onChange={(e) => setAddText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={`youtube.com, reddit.com/r/*\nComma or newline separated`}
          className="w-full h-16 px-3 py-2 text-xs bg-white rounded-lg border border-neutral-200 hover:border-neutral-400 focus:outline-none focus:border-neutral-400 transition-all resize-none"
        />
        {addText.trim() && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-neutral-500">
              {validCount} valid site{validCount !== 1 ? "s" : ""} detected
            </span>
            <button
              onClick={handleAdd}
              disabled={validCount === 0}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                validCount > 0
                  ? "bg-neutral-900 text-neutral-50 hover:bg-neutral-800 active:bg-neutral-950"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              }`}
            >
              Add to {activeTab}
            </button>
          </div>
        )}
      </div>

      {/* Media Exception */}
      <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-neutral-700">
              <Image size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-neutral-800 flex items-center gap-1.5">
                Skip Media Pages
                <InfoTooltip content="Pages with only images or videos won't be affected by grayscale" />
              </h2>
              <p className="text-xs text-neutral-500 italic">
                Exclude media-only pages
              </p>
            </div>
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

      <Footer />
    </div>
  );
};

export default SiteListManagement;
