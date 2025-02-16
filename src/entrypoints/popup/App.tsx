import { useState, useEffect } from "react";
import { Power, Sliders, Shield, X } from "lucide-react";

// Add these icons from a local icons file or use an icon library
const Icons = {
  Power: () => <Power size={20} />,
  Adjust: () => <Sliders size={20} />,
  Shield: () => <Shield size={20} />,
  X: () => <X size={15} />,
};

export default function App() {
  const [enabled, setEnabled] = useState(false);
  const [intensity, setIntensity] = useState(100);
  const [blacklist, setBlacklist] = useState<string[]>([]);

  useEffect(() => {
    browser.storage.local.get("Monofilter").then((data) => {
      if (data.Monofilter) {
        setEnabled(data.Monofilter.enabled);
        setIntensity(data.Monofilter.intensity ?? 100);
        setBlacklist(data.Monofilter.blacklist ?? []);
      }
    });
  }, []);

  const toggleGreyscale = () => {
    setEnabled(!enabled);
    browser.runtime.sendMessage({ type: "toggleGreyscale", intensity });
  };

  const changeIntensity = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIntensity = parseInt(e.target.value, 10);
    setIntensity(newIntensity);
    browser.runtime.sendMessage({ type: "setIntensity", value: newIntensity });
  };

  return (
    <div className="w-[400px] min-h-[500px] bg-white text-gray-800 p-6">
      <h1 className="text-2xl font-bold mb-6">Monochromate</h1>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gray-100 border-gray-300 border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icons.Power />
              <div>
                <h2 className="font-semibold">Greyscale Filter</h2>
                <p className="text-sm text-gray-600 italic">
                  Toggle monochrome mode
                </p>
              </div>
            </div>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                enabled ? "bg-black text-white" : "bg-gray-200"
              }`}
              onClick={toggleGreyscale}
            >
              {enabled ? "Active" : "Inactive"}
            </button>
          </div>
        </div>

        <div className="bg-gray-100 border-gray-300 border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <Icons.Adjust />
            <div>
              <h2 className="font-semibold">Filter Intensity</h2>
              <p className="text-sm text-gray-600 italic">
                Adjust the strength
              </p>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={intensity}
            onChange={changeIntensity}
            disabled={!enabled}
            className="w-full accent-black"
          />
          <div className="text-right text-sm text-gray-600">{intensity}%</div>
        </div>

        <div className="bg-gray-100 border-gray-300 border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <Icons.Shield />
            <div>
              <h2 className="font-semibold">Excluded Sites</h2>
              <p className="text-sm text-gray-600 italic">Manage exceptions</p>
            </div>
          </div>

          <div className="max-h-[200px] overflow-y-auto">
            {blacklist.map((site, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
              >
                <span className="text-sm">{site}</span>
                <button
                  onClick={() => {
                    const newBlacklist = blacklist.filter(
                      (_, i) => i !== index
                    );
                    setBlacklist(newBlacklist);
                    browser.runtime.sendMessage({
                      type: "setBlacklist",
                      value: newBlacklist,
                    });
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  <Icons.X />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={async () => {
              const [tab] = await browser.tabs.query({
                active: true,
                currentWindow: true,
              });
              if (tab.url) {
                const url = new URL(tab.url).hostname.replace("www.", "");
                if (!blacklist.includes(url)) {
                  const newBlacklist = [...blacklist, url];
                  setBlacklist(newBlacklist);
                  browser.runtime.sendMessage({
                    type: "setBlacklist",
                    value: newBlacklist,
                  });
                }
              }
            }}
            className="w-full mt-3 text-white px-4 py-2 bg-black hover:bg-black/80 rounded-lg text-sm transition-colors"
          >
            Add Current Site →
          </button>
        </div>
      </div>
    </div>
  );
}
