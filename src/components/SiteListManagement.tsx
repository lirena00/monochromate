import {
  AlertCircle,
  ArrowLeft,
  Globe,
  Image,
  Link,
  Search,
  Shield,
  ShieldCheck,
  X,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { getUnifiedExclusions, parseSitesFromText } from "@/utils/urlUtils";
import Footer from "./Footer";
import InfoTooltip from "./InfoTooltip";

interface SiteListManagementProps {
  blacklist: string[];
  currentFullUrl: string;
  currentUrl: string;
  filteredBlacklist: string[];
  isCurrentUrlInActiveList: boolean;
  mediaExceptionEnabled: boolean;
  mode: "blacklist" | "whitelist";
  onAddCurrentSite: () => void;
  onAddCurrentUrl: () => void;
  onBulkImport: (
    sites: string[],
    type: "domain" | "pattern",
    targetMode: "blacklist" | "whitelist"
  ) => void;
  onRemoveSite: (
    site: string,
    type?: "domain" | "pattern",
    targetMode?: "blacklist" | "whitelist"
  ) => void;
  onReturnToMain: () => void;
  onSearchChange: (value: string) => void;
  onToggleMediaException: () => void;
  searchTerm: string;
  urlPatternBlacklist: string[];
  urlPatternWhitelist: string[];
  whitelist: string[];
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
    if (activeFilter === "domains") {
      filtered = filtered.filter((i) => i.type === "domain");
    } else if (activeFilter === "patterns") {
      filtered = filtered.filter((i) => i.type === "pattern");
    }

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
    if (domains.length > 0) {
      onBulkImport(domains, "domain", activeTab);
    }
    if (patterns.length > 0) {
      onBulkImport(patterns, "pattern", activeTab);
    }
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
    <div className="flex min-h-[800px] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          className="flex items-center justify-center rounded-full p-1 transition-colors hover:bg-neutral-100"
          onClick={onReturnToMain}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg text-neutral-800">Manage Sites</h1>
      </div>

      {/* Segmented Tabs */}
      <div className="mb-4 flex rounded-lg bg-neutral-100 p-0.5">
        <button
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-medium text-xs transition-all ${
            activeTab === "blacklist"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
          onClick={() => setActiveTab("blacklist")}
        >
          <Shield size={12} />
          Blacklist ({blacklistExclusions.length})
          {mode === "blacklist" && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-green-500"
              title="Active mode"
            />
          )}
        </button>
        <button
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-medium text-xs transition-all ${
            activeTab === "whitelist"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
          onClick={() => setActiveTab("whitelist")}
        >
          <ShieldCheck size={12} />
          Whitelist ({whitelistExclusions.length})
          {mode === "whitelist" && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-green-500"
              title="Active mode"
            />
          )}
        </button>
      </div>

      {/* Current site quick-add */}
      {currentUrl && !isCurrentUrlInActiveList && activeTab === mode && (
        <div className="mb-4 rounded-xl border border-neutral-300 bg-neutral-100 p-3 transition-all hover:border-neutral-400">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 flex-shrink-0 overflow-hidden rounded-full bg-neutral-200">
              <img
                alt=""
                className="h-full w-full object-cover"
                src={`https://www.google.com/s2/favicons?domain=${currentUrl}&sz=32`}
              />
            </div>
            <span className="flex-1 truncate text-neutral-600 text-xs">
              {currentUrl}
            </span>
            <button
              className="rounded-lg bg-neutral-900 px-2.5 py-1.5 text-neutral-50 text-xs transition-colors hover:bg-neutral-800 active:bg-neutral-950"
              onClick={onAddCurrentSite}
            >
              <Globe className="mr-1 inline" size={10} />
              Add
            </button>
            <button
              className="rounded-lg p-1.5 text-neutral-400 text-xs transition-colors hover:bg-neutral-200 hover:text-neutral-800"
              onClick={onAddCurrentUrl}
              title="Add as URL pattern"
            >
              <Link size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Search + Filter row */}
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute top-1/2 left-2.5 -translate-y-1/2 text-neutral-400"
            size={12}
          />
          <input
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-8 text-xs transition-all hover:border-neutral-400 focus:border-neutral-400 focus:outline-none"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            type="text"
            value={searchTerm}
          />
        </div>
        <div className="flex rounded-lg bg-neutral-100 p-0.5">
          {filterOptions.map(({ type, label, count }) => (
            <button
              className={`rounded-lg px-2 py-1.5 text-xs transition-all ${
                activeFilter === type
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
              key={type}
              onClick={() => setActiveFilter(type)}
            >
              {label}
              {count > 0 && <span className="ml-0.5 opacity-60">{count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Site List */}
      <div className="mb-4 min-h-[180px] flex-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white">
        {filteredExclusions.length > 0 ? (
          filteredExclusions.map((ex) => (
            <div
              className="group flex items-center gap-2.5 border-neutral-100 border-b px-3 py-2 transition-colors last:border-0 hover:bg-neutral-50"
              key={`${ex.type}-${ex.value}`}
            >
              <div className="h-3.5 w-3.5 flex-shrink-0 overflow-hidden rounded-full bg-neutral-200">
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={ex.favicon}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-neutral-700 text-xs">
                    {ex.displayName}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-xs ${
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
                  <div className="mt-0.5 truncate font-mono text-neutral-400 text-xs">
                    {ex.value}
                  </div>
                )}
              </div>
              <button
                className="text-neutral-300 opacity-0 transition-colors hover:text-red-500 group-hover:opacity-100"
                onClick={() => onRemoveSite(ex.value, ex.type, activeTab)}
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
                  className="mx-auto mb-2 text-neutral-300"
                  size={16}
                />
                <p className="text-neutral-400 text-xs">
                  No matches for &ldquo;{searchTerm}&rdquo;
                </p>
              </>
            ) : (
              <>
                {activeTab === "blacklist" ? (
                  <Shield className="mx-auto mb-2 text-neutral-300" size={16} />
                ) : (
                  <ShieldCheck
                    className="mx-auto mb-2 text-neutral-300"
                    size={16}
                  />
                )}
                <p className="text-neutral-400 text-xs">
                  No sites in {activeTab}
                </p>
                <p className="mt-1 text-neutral-300 text-xs">
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
      <div className="mb-4 rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
        <div className="mb-2 flex items-center gap-2">
          <div className="text-neutral-700">
            <Globe size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800 text-sm">
              Add Sites
            </h2>
            <p className="text-neutral-500 text-xs italic">
              Enter domains or patterns, press Enter to add
            </p>
          </div>
        </div>

        <textarea
          className="h-16 w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs transition-all hover:border-neutral-400 focus:border-neutral-400 focus:outline-none"
          onChange={(e) => setAddText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={
            "youtube.com, reddit.com/r/*\nComma or newline separated"
          }
          value={addText}
        />
        {addText.trim() && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-neutral-500 text-xs">
              {validCount} valid site{validCount === 1 ? "" : "s"} detected
            </span>
            <button
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                validCount > 0
                  ? "bg-neutral-900 text-neutral-50 hover:bg-neutral-800 active:bg-neutral-950"
                  : "cursor-not-allowed bg-neutral-200 text-neutral-400"
              }`}
              disabled={validCount === 0}
              onClick={handleAdd}
            >
              Add to {activeTab}
            </button>
          </div>
        )}
      </div>

      {/* Media Exception */}
      <div className="mb-4 rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-neutral-700">
              <Image size={18} />
            </div>
            <div>
              <h2 className="flex items-center gap-1.5 font-semibold text-neutral-800 text-sm">
                Skip Media Pages
                <InfoTooltip content="Pages with only images or videos won't be affected by grayscale" />
              </h2>
              <p className="text-neutral-500 text-xs italic">
                Exclude media-only pages
              </p>
            </div>
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

      <Footer />
    </div>
  );
};

export default SiteListManagement;
