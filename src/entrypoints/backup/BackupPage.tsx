import React, { useState } from "react";
import { settings } from "#imports";
import {
  Upload,
  Download,
  Info,
  Heart,
  Github,
  Star,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Header from "@/components/Header";
import { Discord } from "@/components/Icons/Discord";

export default function BackupPage() {
  const [importStatus, setImportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleExport = async () => {
    try {
      const data = await settings.getValue();

      if (data) {
        const exportData = {
          version: browser.runtime.getManifest().version,
          timestamp: new Date().toISOString(),
          settings: data,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `monochromate-settings-backup.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        if (importData.settings) {
          await settings.setValue(importData.settings);
          setImportStatus("success");
          setTimeout(() => setImportStatus("idle"), 5000);
        }
      } catch (error) {
        console.error("Import failed:", error);
        setImportStatus("error");
        setTimeout(() => setImportStatus("idle"), 5000);
      }
    };
    input.click();
  };

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
    <div className="min-h-screen flex flex-col">
      <div className="py-4 -mb-6 px-6 border-b border-neutral-200">
        <Header />
      </div>

      <div className="flex-1 bg-white">
        <div className="max-w-[480px] mx-auto p-6 flex flex-col">
          <h1 className="text-xl font-bold text-neutral-800 text-center mb-6">
            Backup & Restore
          </h1>

          <div className="flex-1 flex items-center justify-center">
            <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all w-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-neutral-700">
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-neutral-800">
                    Backup Settings
                  </h2>
                  <p className="text-sm text-neutral-500 italic">
                    Export or import your configuration
                  </p>
                </div>
              </div>

              <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-neutral-500">
                    <Info size={12} />
                  </div>
                  <p className="text-xs text-neutral-600">
                    This dedicated page is necessary for Firefox users because
                    the extension popup automatically closes when file selection
                    dialogs open, making it impossible to import settings
                    directly from the popup.
                  </p>
                </div>
              </div>

              {importStatus === "success" && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-lg mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-green-500">
                      <CheckCircle size={12} />
                    </div>
                    <p className="text-xs text-green-700">
                      Settings imported successfully! You can now close this
                      window.
                    </p>
                  </div>
                </div>
              )}

              {importStatus === "error" && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-red-500">
                      <XCircle size={12} />
                    </div>
                    <p className="text-xs text-red-700">
                      Import failed. Please try again with a valid backup file.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-200 transition-colors"
                >
                  <Download size={15} />
                  Export
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-200 transition-colors"
                >
                  <Upload size={15} />
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-neutral-200 bg-neutral-50">
        <div className="max-w-[800px] mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://buymeacoffee.com/lirena00"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-neutral-200 rounded-lg px-4 py-2 hover:border-neutral-400 hover:bg-neutral-50 transition-all group flex items-center gap-2"
            >
              <span className="text-red-500 group-hover:scale-110 transition-transform">
                <Heart size={16} />
              </span>
              <span className="text-sm text-neutral-600 group-hover:text-neutral-800">
                Support
              </span>
            </a>

            <a
              href="https://discord.gg/pdxMMNGWCU"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-neutral-200 rounded-lg px-4 py-2 hover:border-neutral-400 hover:bg-neutral-50 transition-all group flex items-center gap-2"
            >
              <span className="text-indigo-500 group-hover:scale-110 transition-transform">
                <Discord />
              </span>
              <span className="text-sm text-neutral-600 group-hover:text-neutral-800">
                Discord
              </span>
            </a>

            <a
              href="https://github.com/lirena00/monochromate"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-neutral-200 rounded-lg px-4 py-2 hover:border-neutral-400 hover:bg-neutral-50 transition-all group flex items-center gap-2"
            >
              <span className="text-neutral-700 group-hover:scale-110 transition-transform">
                <Github size={16} />
              </span>
              <span className="text-sm text-neutral-600 group-hover:text-neutral-800">
                Github
              </span>
            </a>

            <div
              className="bg-white border border-neutral-200 rounded-lg px-4 py-2 hover:border-neutral-400 hover:bg-neutral-50 transition-all group flex items-center gap-2 cursor-pointer"
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
                    onClick={() => handleStarClick(star)}
                  />
                ))}
              </div>
              <span className="text-sm text-neutral-600 group-hover:text-neutral-800">
                Rate Us
              </span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-neutral-500">
              Made with ❤️ by{" "}
              <a
                href="https://www.lirena.in?ref=monochromate&source=backup_page"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-700 hover:text-neutral-900 underline decoration-dotted underline-offset-2"
              >
                lirena00
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
