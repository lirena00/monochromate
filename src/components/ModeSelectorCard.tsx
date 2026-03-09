import React from "react";
import { ShieldOff, ShieldCheck } from "lucide-react";
import InfoTooltip from "./InfoTooltip";

interface ModeSelectorCardProps {
  mode: "blacklist" | "whitelist";
  blacklistCount: number;
  whitelistCount: number;
  onModeChange: (mode: "blacklist" | "whitelist") => void;
}

const ModeSelectorCard: React.FC<ModeSelectorCardProps> = ({
  mode,
  blacklistCount,
  whitelistCount,
  onModeChange,
}) => {
  return (
    <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-neutral-700">
            {mode === "blacklist" ? (
              <ShieldOff size={18} />
            ) : (
              <ShieldCheck size={18} />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800 text-sm flex items-center gap-1.5">
              Site Filter Mode
              <InfoTooltip
                content={
                  mode === "blacklist"
                    ? "Blacklist mode: Grayscale applies everywhere EXCEPT listed sites"
                    : "Whitelist mode: Grayscale applies ONLY to listed sites"
                }
              />
            </h2>
            <p className="text-xs text-neutral-500 italic">
              {mode === "blacklist"
                ? "Extension OFF on listed sites"
                : "Extension ON only for listed sites"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onModeChange("blacklist")}
          className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
            mode === "blacklist"
              ? "bg-neutral-900 text-white border-neutral-900"
              : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <ShieldOff size={14} />
            <span className="text-xs font-medium">Blacklist</span>
          </div>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${
              mode === "blacklist"
                ? "bg-white/20 text-white"
                : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {blacklistCount} sites
          </span>
          {mode === "blacklist" && (
            <span className="text-xs opacity-75">ACTIVE</span>
          )}
        </button>

        <button
          onClick={() => onModeChange("whitelist")}
          className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
            mode === "whitelist"
              ? "bg-neutral-900 text-white border-neutral-900"
              : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} />
            <span className="text-xs font-medium">Whitelist</span>
          </div>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${
              mode === "whitelist"
                ? "bg-white/20 text-white"
                : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {whitelistCount} sites
          </span>
          {mode === "whitelist" && (
            <span className="text-xs opacity-75">ACTIVE</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ModeSelectorCard;
