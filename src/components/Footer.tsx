import React from "react";
import { Heart, Github, ExternalLink } from "lucide-react";
import { Discord } from "@/components/Icons/Discord";

const Footer: React.FC = () => {
  return (
    <footer className="my-6 ">
      <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
        <div className="grid grid-cols-3 gap-2">
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
