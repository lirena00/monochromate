import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, AlertCircle, X, Shield } from "lucide-react";
import Footer from "./Footer";
import { getShortcutByName } from "@/utils/shortcuts";
import ShortcutBadge from "@/components/ShortcutBadge";

interface BlacklistManagementProps {
  searchTerm: string;
  currentUrl: string;
  filteredBlacklist: string[];
  isCurrentUrlBlacklisted: boolean;
  onSearchChange: (value: string) => void;
  onReturnToMain: () => void;
  onAddCurrentSite: () => void;
  onRemoveSite: (site: string) => void;
  mediaExceptionEnabled: boolean;
  onToggleMediaException: () => void;
}

const BlacklistManagement: React.FC<BlacklistManagementProps> = ({
  searchTerm,
  currentUrl,
  filteredBlacklist,
  isCurrentUrlBlacklisted,
  onSearchChange,
  onReturnToMain,
  onAddCurrentSite,
  onRemoveSite,
  mediaExceptionEnabled,
  onToggleMediaException,
}) => {
  const [shortcut, setShortcut] = useState<string>("");

  useEffect(() => {
    getShortcutByName("quick_toggle_blacklist").then(setShortcut);
  }, []);

  return (
    <div className="flex flex-col h-[800px] overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onReturnToMain}
          className="p-1 rounded-full hover:bg-neutral-100 flex items-center justify-center"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-neutral-800">
          Manage Excluded Sites
        </h1>
      </div>

      {/* Current Site Card */}
      <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-neutral-700">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800">
              Current Site & Media
            </h2>
            <p className="text-sm text-neutral-500 italic">
              Manage site exclusion settings
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-3">
          <div className="flex justify-between items-center mb-3">
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

          {/* Media Exception */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
            <span className="text-sm text-neutral-600">
              Exclude media-only pages
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={mediaExceptionEnabled}
                onChange={onToggleMediaException}
              />
              <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
            </label>
          </div>
        </div>
      </div>

      {/* All Excluded Sites Card */}
      <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-neutral-700">
            <Search size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800">
              All Excluded Sites
              {filteredBlacklist.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-neutral-200 rounded-full">
                  {filteredBlacklist.length}
                </span>
              )}
            </h2>
            <p className="text-sm text-neutral-500 italic">
              Search and manage all excluded sites
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            <Search size={15} />
          </div>
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm hover:border-neutral-400 transition-all focus:outline-none focus:border-neutral-400"
            placeholder="Search excluded sites..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
          />
        </div>

        {/* Sites List */}
        <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-neutral-200 min-h-0">
          {filteredBlacklist.length > 0 ? (
            filteredBlacklist.map((site) => (
              <div
                key={site}
                className="flex justify-between items-center py-3 px-3 border-b border-neutral-200 last:border-0 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-neutral-200 rounded-full overflow-hidden">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${site}&sz=64`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm text-neutral-700">{site}</span>
                </div>
                <button
                  onClick={() => onRemoveSite(site)}
                  className="text-neutral-500 hover:text-red-500 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            ))
          ) : (
            <div className="py-8 px-3 text-center flex flex-col items-center gap-2">
              {searchTerm ? (
                <p className="text-sm text-neutral-500">
                  No results match "{searchTerm}"
                </p>
              ) : (
                <>
                  <div className="text-neutral-400">
                    <AlertCircle size={15} />
                  </div>
                  <p className="text-sm text-neutral-500">
                    No sites in exclusion list yet
                  </p>
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
