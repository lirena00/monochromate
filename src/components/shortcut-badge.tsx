import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import type React from "react";
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

  if (!hasShortcut) {
    return null;
  }

  const sizeClasses = {
    xs: "text-xs px-1.5 py-0.5",
    sm: "text-sm px-2 py-1",
  };

  const iconSize = 14;

  const getKeyContent = (key: string) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes("right")) {
      return (
        <div className="py-0.25">
          <ChevronRight size={iconSize} />
        </div>
      );
    }
    if (lowerKey.includes("left")) {
      return (
        <div className="py-0.25">
          <ChevronLeft size={iconSize} />
        </div>
      );
    }
    if (lowerKey.includes("up")) {
      return (
        <div className="py-0.25">
          <ChevronUp size={iconSize} />
        </div>
      );
    }
    if (lowerKey.includes("down")) {
      return (
        <div className="py-0.25">
          <ChevronDown size={iconSize} />
        </div>
      );
    }
    return key;
  };

  return (
    <div className="flex items-center gap-0.5">
      {keys.map((key) => (
        <span
          className={`${sizeClasses[size]} flex items-center justify-center rounded border border-neutral-300 bg-neutral-200 font-mono text-neutral-600`}
          key={key}
        >
          {getKeyContent(key)}
        </span>
      ))}
    </div>
  );
};

export default ShortcutBadge;
