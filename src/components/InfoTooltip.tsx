import { Info } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface InfoTooltipProps {
  className?: string;
  content: string;
  size?: number;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  size = 10,
  className = "text-neutral-400 hover:text-neutral-600",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        className={`cursor-help transition-colors ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <Info size={size} />
      </div>

      {isVisible && (
        <div className="absolute bottom-full left-1/2 z-50 mb-1 max-w-[200px] -translate-x-1/2 transform whitespace-normal rounded bg-neutral-800 px-2 py-1.5 text-white text-xs shadow-lg">
          <div className="text-center leading-tight">{content}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 transform border-2 border-transparent border-t-neutral-800" />
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
