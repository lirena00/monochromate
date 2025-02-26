import { useState, useEffect } from "react";
import { Power, Sliders, Shield, X, Heart, Github } from "lucide-react";

const Icons = {
  Power: () => <Power size={20} />,
  Adjust: () => <Sliders size={20} />,
  Shield: () => <Shield size={20} />,
  X: () => <X size={15} />,
  Heart: () => <Heart size={15} color="red" />,
  Github: () => <Github size={15} />,
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
    <div className="w-[400px] min-h-[550px] bg-white text-neutral-800 p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <img src="/logo.png" alt="Monochromate Logo" className="h-8 w-8" />
        <h1 className="text-2xl font-bold text-neutral-800">Monochromate</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 flex-1">
        <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4  hover:border-neutral-400 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-neutral-700">
                <Icons.Power />
              </div>
              <div>
                <h2 className="font-semibold text-neutral-800">
                  Greyscale Filter
                </h2>
                <p className="text-sm text-neutral-500 italic">
                  Toggle monochrome mode
                </p>
              </div>
            </div>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                enabled
                  ? "bg-neutral-900 text-neutral-50 hover:bg-neutral-800 active:bg-neutral-950"
                  : "bg-neutral-100 text-neutral-700 border border-neutral-300 hover:bg-neutral-200 hover:border-neutral-400"
              }`}
              onClick={toggleGreyscale}
            >
              {enabled ? "Active" : "Inactive"}
            </button>
          </div>
        </div>

        <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4  hover:border-neutral-400 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-neutral-700">
              <Icons.Adjust />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-800">
                Filter Intensity
              </h2>
              <p className="text-sm text-neutral-500 italic">
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
            className="w-full accent-neutral-900"
          />
          <div className="text-right text-sm text-neutral-500">
            {intensity}%
          </div>
        </div>

        <div className="bg-neutral-100 border-neutral-300 border rounded-xl p-4  hover:border-neutral-400 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-neutral-700">
              <Icons.Shield />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-800">
                Excluded Sites{" "}
                {blacklist.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-neutral-100 rounded-full">
                    {blacklist.length}
                  </span>
                )}
              </h2>
              <p className="text-sm text-neutral-500 italic">
                Manage exceptions
              </p>
            </div>
          </div>

          <div className="max-h-[80px] overflow-y-auto">
            {blacklist.map((site, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-neutral-200 last:border-0"
              >
                <span className="text-sm text-neutral-700">{site}</span>
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
                  className="text-red-500 hover:text-red-600 text-sm"
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
            className="w-full mt-3 text-neutral-50 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 rounded-lg text-sm transition-colors"
          >
            Add Current Site →
          </button>
        </div>
      </div>
      <div className="mt-6 text-center flex items-center justify-center gap-4">
        <a
          href="https://buymeacoffee.com/lirena00"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-600 hover:text-neutral-900 transition-colors inline-flex items-center gap-1"
        >
          <span className="text-red-500">
            <Icons.Heart />
          </span>
          Support me
        </a>
        <span className="text-neutral-300">|</span>
        <a
          href="https://github.com/lirena00/monochromate"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-600 hover:text-neutral-900 transition-colors inline-flex items-center gap-1"
        >
          <Icons.Github />
          Github
        </a>
        <span className="text-neutral-300">|</span>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`https://monochromate.lirena.in/release-notes/#${
            browser.runtime.getManifest().version
          }`}
          className="text-sm text-gray-600 hover:text-neutral-900 transition-colors"
        >
          v.{browser.runtime.getManifest().version}
        </a>
      </div>
    </div>
  );
}
