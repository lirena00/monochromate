import React from "react";
import { ArrowLeft, Search, AlertCircle, X } from "lucide-react";
import Footer from "./Footer";

interface BlacklistManagementProps {
  searchTerm: string;
  currentUrl: string;
  filteredBlacklist: string[];
  isCurrentUrlBlacklisted: boolean;
  onSearchChange: (value: string) => void;
  onReturnToMain: () => void;
  onAddCurrentSite: () => void;
  onRemoveSite: (site: string) => void;
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
}) => {
  return (
    <div className="flex flex-col min-h-[700px]">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onReturnToMain}
          className="p-1 rounded-full hover:bg-neutral-100"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold">Manage Excluded Sites</h1>
      </div>

      <div className="relative mb-3">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
          <Search size={15} />
        </div>
        <input
          type="text"
          className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm"
          placeholder="Search excluded sites..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-medium text-neutral-500 mb-2">
          Current Site
        </h2>
        <div className="bg-white rounded-lg border border-neutral-200 p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-neutral-200 rounded-full overflow-hidden">
              {currentUrl && (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${currentUrl}&sz=64`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <span className="text-sm font-medium truncate max-w-[200px]">
              {currentUrl}
            </span>
          </div>

          {isCurrentUrlBlacklisted ? (
            <button
              onClick={() => onRemoveSite(currentUrl)}
              className="text-sm px-3 py-1 bg-neutral-200 text-neutral-700 rounded-sm hover:bg-neutral-300 transition-colors"
            >
              Remove
            </button>
          ) : (
            <button
              onClick={onAddCurrentSite}
              className="text-sm px-3 py-1 bg-neutral-900 text-white rounded-sm hover:bg-neutral-800 transition-colors flex items-center gap-1"
            >
              Exclude
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <h2 className="text-sm font-medium text-neutral-500 mb-2">
          All Excluded Sites
        </h2>
        <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-neutral-200">
          {filteredBlacklist.length > 0 ? (
            filteredBlacklist.map((site) => (
              <div
                key={site}
                className="flex justify-between items-center py-3 px-3 border-b border-neutral-200 last:border-0 hover:bg-neutral-50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-neutral-200 rounded-full overflow-hidden">
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
                  className="text-neutral-500 hover:text-red-500"
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
