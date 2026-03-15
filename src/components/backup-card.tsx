import {
  CheckCircle,
  Download,
  ExternalLink,
  Upload,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { settings } from "#imports";

export default function Backup() {
  const [isFirefox, setIsFirefox] = useState(false);
  const [importStatus, setImportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [exportStatus, setExportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  useEffect(() => {
    // Check if running in Firefox
    const browser = import.meta.env.BROWSER;
    setIsFirefox(browser === "firefox");
  }, []);

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

        setExportStatus("success");
        setTimeout(() => setExportStatus("idle"), 3000);
      }
    } catch (error) {
      console.error("Export failed:", error);
      setExportStatus("error");
      setTimeout(() => setExportStatus("idle"), 3000);
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
          setTimeout(() => setImportStatus("idle"), 3000);
        }
      } catch (error) {
        console.error("Import failed:", error);
        setImportStatus("error");
        setTimeout(() => setImportStatus("idle"), 3000);
      }
    };
    input.click();
  };

  const openBackupPage = () => {
    const url = browser.runtime.getURL("/backup.html");
    window.open(url, "_blank");
  };

  return (
    <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
      <div className="mb-2 flex items-center gap-2">
        <div className="text-neutral-700">
          <Upload size={18} />
        </div>
        <div>
          <h2 className="font-semibold text-neutral-800 text-sm">
            Backup Settings
          </h2>
          <p className="text-neutral-500 text-xs italic">
            Export or import your configuration
          </p>
        </div>
      </div>

      {importStatus === "success" && (
        <div className="mb-2 rounded-lg border border-green-200 bg-green-50 p-2">
          <div className="flex items-center gap-1.5">
            <div className="text-green-500">
              <CheckCircle size={10} />
            </div>
            <p className="text-green-700 text-xs">
              Settings imported successfully!
            </p>
          </div>
        </div>
      )}

      {importStatus === "error" && (
        <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-2">
          <div className="flex items-center gap-1.5">
            <div className="text-red-500">
              <XCircle size={10} />
            </div>
            <p className="text-red-700 text-xs">
              Import failed. Please try again with a valid backup file.
            </p>
          </div>
        </div>
      )}

      {exportStatus === "success" && (
        <div className="mb-2 rounded-lg border border-green-200 bg-green-50 p-2">
          <div className="flex items-center gap-1.5">
            <div className="text-green-500">
              <CheckCircle size={10} />
            </div>
            <p className="text-green-700 text-xs">
              Settings exported successfully!
            </p>
          </div>
        </div>
      )}

      {exportStatus === "error" && (
        <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-2">
          <div className="flex items-center gap-1.5">
            <div className="text-red-500">
              <XCircle size={10} />
            </div>
            <p className="text-red-700 text-xs">
              Export failed. Please try again.
            </p>
          </div>
        </div>
      )}

      {isFirefox ? (
        <div className="flex gap-1.5">
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-xs transition-colors hover:bg-neutral-200"
            onClick={handleExport}
            type="button"
          >
            <Download size={12} />
            Export
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-white text-xs transition-colors hover:bg-neutral-800"
            onClick={openBackupPage}
            type="button"
          >
            <ExternalLink size={12} />
            Import
          </button>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-xs transition-colors hover:bg-neutral-200"
            onClick={handleExport}
            type="button"
          >
            <Download size={12} />
            Export
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-xs transition-colors hover:bg-neutral-200"
            onClick={handleImport}
            type="button"
          >
            <Upload size={12} />
            Import
          </button>
        </div>
      )}
    </div>
  );
}
