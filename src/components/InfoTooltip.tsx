import React, { useState } from "react";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  content: string;
  size?: number;
  className?: string;
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
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1.5 bg-neutral-800 text-white text-xs rounded shadow-lg z-50 max-w-[200px] whitespace-normal">
          <div className="text-center leading-tight">{content}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-neutral-800"></div>
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
