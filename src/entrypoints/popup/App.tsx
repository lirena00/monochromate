import { useState, useEffect } from "react";

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
    <div className="w-[380px] min-h-[600px] bg-background text-text p-6 flex flex-col gap-6">
      <button className="text-xl bg-accent" onClick={toggleGreyscale}>
        {enabled ? "Disable Greyscale" : "Enable Greyscale"}
      </button>
      <input
        type="range"
        min="0"
        max="100"
        value={intensity}
        onChange={changeIntensity}
        disabled={!enabled}
      />
      <div className="flex flex-col gap-2">
        <h2 className="text-lg">Blacklisted Sites</h2>
        {blacklist.map((site, index) => (
          <div key={index} className="flex justify-between items-center">
            <span>{site}</span>
            <button
              onClick={() => {
                const newBlacklist = blacklist.filter((_, i) => i !== index);
                setBlacklist(newBlacklist);
                browser.runtime.sendMessage({
                  type: "setBlacklist",
                  value: newBlacklist,
                });
              }}
            >
              Remove
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
        className="bg-accent mt-2"
      >
        Add Current Site
      </button>
    </div>
  );
}
