import { settings } from "#imports";
import {
  Upload,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

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
        a.download = `monochromate-settings-backup.json`;
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
      if (!file) return;

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
    <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-neutral-700">
          <Upload size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-neutral-800">Backup Settings</h2>
          <p className="text-sm text-neutral-500 italic">
            Export or import your configuration
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
              Settings imported successfully!
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

      {exportStatus === "success" && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg mb-3">
          <div className="flex items-center gap-2">
            <div className="text-green-500">
              <CheckCircle size={12} />
            </div>
            <p className="text-xs text-green-700">
              Settings exported successfully!
            </p>
          </div>
        </div>
      )}

      {exportStatus === "error" && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg mb-3">
          <div className="flex items-center gap-2">
            <div className="text-red-500">
              <XCircle size={12} />
            </div>
            <p className="text-xs text-red-700">
              Export failed. Please try again.
            </p>
          </div>
        </div>
      )}

      {isFirefox ? (
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-200 transition-colors"
          >
            <Download size={15} />
            Export
          </button>
          <button
            onClick={openBackupPage}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-900 text-white rounded-lg text-sm hover:bg-neutral-800 transition-colors"
          >
            <ExternalLink size={15} />
            Import
          </button>
        </div>
      ) : (
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
      )}
    </div>
  );
}
