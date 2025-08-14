import React, { useState } from "react";
import { Heart, Github, Star, Keyboard } from "lucide-react";
import { Discord } from "@/components/Icons/Discord";
import { openShortcutsSettings } from "@/utils/shortcuts";

const Footer: React.FC = () => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);

    const browser = import.meta.env.BROWSER;
    let storeUrl = "";

    switch (browser) {
      case "chrome":
        storeUrl =
          "https://chromewebstore.google.com/detail/monochromate-the-best-gre/hafcajcllbjnoolpfngclfmmgpikdhlm/reviews";
        break;
      case "firefox":
        storeUrl =
          "https://addons.mozilla.org/en-US/firefox/addon/monochromate/reviews/";
        break;
      case "edge":
        storeUrl =
          "https://microsoftedge.microsoft.com/addons/detail/monochromate-the-best-g/jnphoibnlnibfchogdlfapbggogkppgh";
        break;
      default:
        storeUrl =
          "https://chromewebstore.google.com/detail/monochromate-the-best-gre/hafcajcllbjnoolpfngclfmmgpikdhlm/reviews";
    }

    window.open(storeUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <footer className="my-6">
      <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
        <div className="grid grid-cols-4 gap-2">
          <a
            href="https://buymeacoffee.com/lirena00"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-neutral-200 rounded-lg p-3 hover:border-neutral-400 hover:bg-neutral-50 transition-all group flex flex-col items-center gap-1.5"
          >
            <span className="text-red-500 group-hover:scale-110 transition-transform">
              <Heart size={16} />
            </span>
            <span className="text-xs text-neutral-600 group-hover:text-neutral-800">
              Support
            </span>
          </a>

          <a
            href="https://discord.gg/pdxMMNGWCU"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-neutral-200 rounded-lg p-3 hover:border-neutral-400 hover:bg-neutral-50 transition-all group flex flex-col items-center gap-1.5"
          >
            <span className="text-indigo-500 group-hover:scale-110 transition-transform">
              <Discord />
            </span>
            <span className="text-xs text-neutral-600 group-hover:text-neutral-800">
              Discord
            </span>
          </a>

          <a
            href="https://github.com/lirena00/monochromate"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-neutral-200 rounded-lg p-3 hover:border-neutral-400 hover:bg-neutral-50 transition-all group flex flex-col items-center gap-1.5"
          >
            <span className="text-neutral-700 group-hover:scale-110 transition-transform">
              <Github size={16} />
            </span>
            <span className="text-xs text-neutral-600 group-hover:text-neutral-800">
              Github
            </span>
          </a>

          <button
            onClick={openShortcutsSettings}
            className="bg-white border border-neutral-200 rounded-lg p-3 hover:border-neutral-400 hover:bg-neutral-50 transition-all group flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <span className="text-neutral-700 group-hover:scale-110 transition-transform">
              <Keyboard size={16} />
            </span>
            <span className="text-xs text-neutral-600 group-hover:text-neutral-800">
              Shortcuts
            </span>
          </button>
        </div>

        <div className="mt-2">
          <div
            className="bg-white border border-neutral-200 rounded-lg p-3 hover:border-neutral-400 hover:bg-neutral-50 transition-all group flex flex-col items-center gap-1.5 cursor-pointer"
            onClick={() => handleStarClick(5)}
          >
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={`transition-all cursor-pointer ${
                    star <= (hoveredStar || selectedRating || 0)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-neutral-300"
                  } hover:scale-110`}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStarClick(star);
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-neutral-600 group-hover:text-neutral-800">
              Rate Us
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-neutral-200 text-center">
          <span className="text-xs text-neutral-500">
            Made with ❤️ by{" "}
            <a
              href="https://www.lirena.in?ref=monochromate&source=footer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-700 hover:text-neutral-900 underline decoration-dotted underline-offset-2"
            >
              lirena00
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
