import { settings } from "#imports";
import { Upload, Download, Check } from "lucide-react";
import { useState } from "react";

export default function Backup() {
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
          console.log("Settings imported successfully");
        }
      } catch (error) {
        console.error("Import failed:", error);
      }
    };
    input.click();
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
  );
}
