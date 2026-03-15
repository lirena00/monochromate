import {
  CheckCircle,
  Download,
  Github,
  Heart,
  Info,
  Star,
  Upload,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { settings } from "#imports";
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
        a.download = "monochromate-settings-backup.json";
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
      if (!file) {
        return;
      }

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
    <div className="flex min-h-screen flex-col">
      <div className="-mb-6 border-neutral-200 border-b px-6 py-4">
        <Header />
      </div>

      <div className="flex-1 bg-white">
        <div className="mx-auto flex max-w-[480px] flex-col p-6">
          <h1 className="mb-6 text-center font-bold text-neutral-800 text-xl">
            Backup & Restore
          </h1>

          <div className="flex flex-1 items-center justify-center">
            <div className="w-full rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
              <div className="mb-3 flex items-center gap-3">
                <div className="text-neutral-700">
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-neutral-800">
                    Backup Settings
                  </h2>
                  <p className="text-neutral-500 text-sm italic">
                    Export or import your configuration
                  </p>
                </div>
              </div>

              <div className="mb-3 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                <div className="flex items-center gap-2">
                  <div className="text-neutral-500">
                    <Info size={12} />
                  </div>
                  <p className="text-neutral-600 text-xs">
                    This dedicated page is necessary for Firefox users because
                    the extension popup automatically closes when file selection
                    dialogs open, making it impossible to import settings
                    directly from the popup.
                  </p>
                </div>
              </div>

              {importStatus === "success" && (
                <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-2">
                  <div className="flex items-center gap-2">
                    <div className="text-green-500">
                      <CheckCircle size={12} />
                    </div>
                    <p className="text-green-700 text-xs">
                      Settings imported successfully! You can now close this
                      window.
                    </p>
                  </div>
                </div>
              )}

              {importStatus === "error" && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2">
                  <div className="flex items-center gap-2">
                    <div className="text-red-500">
                      <XCircle size={12} />
                    </div>
                    <p className="text-red-700 text-xs">
                      Import failed. Please try again with a valid backup file.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm transition-colors hover:bg-neutral-200"
                  onClick={handleExport}
                >
                  <Download size={15} />
                  Export
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm transition-colors hover:bg-neutral-200"
                  onClick={handleImport}
                >
                  <Upload size={15} />
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-neutral-200 border-t bg-neutral-50 p-6">
        <div className="mx-auto max-w-[800px]">
          <div className="flex flex-wrap justify-center gap-4">
            <a
              className="group flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 transition-all hover:border-neutral-400 hover:bg-neutral-50"
              href="https://buymeacoffee.com/lirena00"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="text-red-500 transition-transform group-hover:scale-110">
                <Heart size={16} />
              </span>
              <span className="text-neutral-600 text-sm group-hover:text-neutral-800">
                Support
              </span>
            </a>

            <a
              className="group flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 transition-all hover:border-neutral-400 hover:bg-neutral-50"
              href="https://discord.gg/pdxMMNGWCU"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="text-indigo-500 transition-transform group-hover:scale-110">
                <Discord />
              </span>
              <span className="text-neutral-600 text-sm group-hover:text-neutral-800">
                Discord
              </span>
            </a>

            <a
              className="group flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 transition-all hover:border-neutral-400 hover:bg-neutral-50"
              href="https://github.com/lirena00/monochromate"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="text-neutral-700 transition-transform group-hover:scale-110">
                <Github size={16} />
              </span>
              <span className="text-neutral-600 text-sm group-hover:text-neutral-800">
                Github
              </span>
            </a>

            <div
              className="group flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 transition-all hover:border-neutral-400 hover:bg-neutral-50"
              onClick={() => handleStarClick(5)}
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
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(null)}
                    size={16}
                  />
                ))}
              </div>
              <span className="text-neutral-600 text-sm group-hover:text-neutral-800">
                Rate Us
              </span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-neutral-500 text-xs">
              Made with ❤️ by{" "}
              <a
                className="text-neutral-700 underline decoration-dotted underline-offset-2 hover:text-neutral-900"
                href="https://www.lirena.in?ref=monochromate&source=backup_page"
                rel="noopener noreferrer"
                target="_blank"
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
