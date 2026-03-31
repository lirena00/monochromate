import { Github, Heart, Keyboard, Star } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Discord } from "@/components/icons/discord";
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

      default:
        storeUrl =
          "https://chromewebstore.google.com/detail/monochromate-the-best-gre/hafcajcllbjnoolpfngclfmmgpikdhlm/reviews";
    }

    window.open(storeUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <footer className="my-6">
      <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
        <div className="mb-2 border-neutral-200 border-b pb-2 text-center">
          <h3 className="mb-1 font-semibold text-neutral-800 text-sm">
            Love Monochromate? Support Open Source!
          </h3>
          <p className="mb-2 text-neutral-500 text-xs italic">
            Your support helps keep Monochromate free and funds new features
          </p>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <a
            className="group flex flex-col items-center gap-1 rounded-lg border border-neutral-200 bg-white p-2 transition-all hover:border-neutral-400 hover:bg-neutral-50"
            href="https://buymeacoffee.com/lirena00"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="text-red-500 transition-transform group-hover:scale-110">
              <Heart size={16} />
            </span>
            <span className="text-neutral-600 text-xs group-hover:text-neutral-800">
              Support
            </span>
          </a>

          <a
            className="group flex flex-col items-center gap-1 rounded-lg border border-neutral-200 bg-white p-2 transition-all hover:border-neutral-400 hover:bg-neutral-50"
            href="https://discord.gg/pdxMMNGWCU"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="text-indigo-500 transition-transform group-hover:scale-110">
              <Discord />
            </span>
            <span className="text-neutral-600 text-xs group-hover:text-neutral-800">
              Discord
            </span>
          </a>

          <a
            className="group flex flex-col items-center gap-1 rounded-lg border border-neutral-200 bg-white p-2 transition-all hover:border-neutral-400 hover:bg-neutral-50"
            href="https://github.com/lirena00/monochromate"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="text-neutral-700 transition-transform group-hover:scale-110">
              <Github size={16} />
            </span>
            <span className="text-neutral-600 text-xs group-hover:text-neutral-800">
              Github
            </span>
          </a>

          <button
            className="group flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-neutral-200 bg-white p-2 transition-all hover:border-neutral-400 hover:bg-neutral-50"
            onClick={openShortcutsSettings}
            type="button"
          >
            <span className="text-neutral-700 transition-transform group-hover:scale-110">
              <Keyboard size={16} />
            </span>
            <span className="text-neutral-600 text-xs group-hover:text-neutral-800">
              Shortcuts
            </span>
          </button>
        </div>

        <div className="mt-1.5">
          <button
            className="group flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg border border-neutral-200 bg-white p-2 transition-all hover:border-neutral-400 hover:bg-neutral-50"
            onClick={() => handleStarClick(5)}
            type="button"
          >
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  className={`cursor-pointer transition-all ${
                    star <= (hoveredStar || selectedRating || 0)
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-neutral-300"
                  } hover:scale-110`}
                  key={star}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStarClick(star);
                  }}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(null)}
                  size={16}
                />
              ))}
            </div>
            <span className="text-neutral-600 text-xs group-hover:text-neutral-800">
              Rate Us
            </span>
          </button>
        </div>

        <div className="mt-2 border-neutral-200 border-t pt-2 text-center">
          <span className="text-neutral-500 text-xs">
            Made with ❤️ by{" "}
            <a
              className="text-neutral-700 underline decoration-dotted underline-offset-2 hover:text-neutral-900"
              href="https://www.lirena.in?ref=monochromate&source=footer"
              rel="noopener noreferrer"
              target="_blank"
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
