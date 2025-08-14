import React from "react";
import {
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { parseShortcut } from "@/utils/shortcuts";

interface ShortcutBadgeProps {
  shortcut: string;
  size?: "sm" | "xs";
}

const ShortcutBadge: React.FC<ShortcutBadgeProps> = ({
  shortcut,
  size = "xs",
}) => {
  const { keys, hasShortcut } = parseShortcut(shortcut);

  if (!hasShortcut) return null;

  const sizeClasses = {
    xs: "text-xs px-1.5 py-0.5",
    sm: "text-sm px-2 py-1",
  };

  const iconSize = size === "xs" ? 14 : 14;

  const getKeyContent = (key: string) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes("right") && lowerKey.includes("arrow")) {
      return (
        <div className="py-0.25">
          <ChevronRight size={iconSize} />
        </div>
      );
    }
    if (lowerKey.includes("left") && lowerKey.includes("arrow")) {
      return (
        <div className="py-0.25">
          <ChevronLeft size={iconSize} />
        </div>
      );
    }
    if (lowerKey.includes("up") && lowerKey.includes("arrow")) {
      return (
        <div className="py-0.25">
          <ChevronUp size={iconSize} />
        </div>
      );
    }
    if (lowerKey.includes("down") && lowerKey.includes("arrow")) {
      return (
        <div className="py-0.25">
          <ChevronDown size={iconSize} />
        </div>
      );
    }
    return key;
  };

  return (
    <div className="flex items-center gap-0.75">
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <span
            className={`${sizeClasses[size]} bg-neutral-200 text-neutral-600 font-mono rounded border border-neutral-300  flex items-center justify-center`}
          >
            {getKeyContent(key)}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

export default ShortcutBadge;
