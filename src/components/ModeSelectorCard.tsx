import { ShieldCheck, ShieldOff } from "lucide-react";
import type React from "react";
import InfoTooltip from "./InfoTooltip";

interface ModeSelectorCardProps {
  blacklistCount: number;
  mode: "blacklist" | "whitelist";
  onModeChange: (mode: "blacklist" | "whitelist") => void;
  whitelistCount: number;
}

const ModeSelectorCard: React.FC<ModeSelectorCardProps> = ({
  mode,
  blacklistCount,
  whitelistCount,
  onModeChange,
}) => {
  return (
    <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-neutral-700">
            {mode === "blacklist" ? (
              <ShieldOff size={18} />
            ) : (
              <ShieldCheck size={18} />
            )}
          </div>
          <div>
            <h2 className="flex items-center gap-1.5 font-semibold text-neutral-800 text-sm">
              Site Filter Mode
              <InfoTooltip
                content={
                  mode === "blacklist"
                    ? "Blacklist mode: Grayscale applies everywhere EXCEPT listed sites"
                    : "Whitelist mode: Grayscale applies ONLY to listed sites"
                }
              />
            </h2>
            <p className="text-neutral-500 text-xs italic">
              {mode === "blacklist"
                ? "Extension OFF on listed sites"
                : "Extension ON only for listed sites"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className={`flex flex-1 flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
            mode === "blacklist"
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
          }`}
          onClick={() => onModeChange("blacklist")}
        >
          <div className="flex items-center gap-1.5">
            <ShieldOff size={14} />
            <span className="font-medium text-xs">Blacklist</span>
          </div>
          <span
            className={`rounded-full px-1.5 py-0.5 text-xs ${
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
          className={`flex flex-1 flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
            mode === "whitelist"
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
          }`}
          onClick={() => onModeChange("whitelist")}
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} />
            <span className="font-medium text-xs">Whitelist</span>
          </div>
          <span
            className={`rounded-full px-1.5 py-0.5 text-xs ${
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
