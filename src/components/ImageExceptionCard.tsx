import React from "react";
import { Image } from "lucide-react";

interface ImageExceptionCardProps {
  imageExceptionEnabled: boolean;
  onToggle: () => void;
}

const ImageExceptionCard: React.FC<ImageExceptionCardProps> = ({
  imageExceptionEnabled,
  onToggle
}) => {
  return (
    <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-neutral-700">
            <Image size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-800">Image Exception</h2>
            <p className="text-sm text-neutral-500 italic">
              Show images in color on image-only pages
            </p>
          </div>
        </div>
        <button
          className={`px-4 py-2 rounded-lg transition-colors ${imageExceptionEnabled
              ? "bg-neutral-900 text-neutral-50 hover:bg-neutral-800 active:bg-neutral-950"
              : "bg-neutral-100 text-neutral-700 border border-neutral-300 hover:bg-neutral-200 hover:border-neutral-400"
            }`}
          onClick={onToggle}
        >
          {imageExceptionEnabled ? "Active" : "Inactive"}
        </button>
      </div>
    </div>
  );
};

export default ImageExceptionCard;
