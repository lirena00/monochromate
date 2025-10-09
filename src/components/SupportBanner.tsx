import React, { useState, useEffect } from "react";
import { Heart, Star, X, Coffee, Gift } from "lucide-react";

interface SupportBannerProps {
  onDismiss?: () => void;
}

const SupportBanner: React.FC<SupportBannerProps> = ({ onDismiss }) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const messages = [
    {
      icon: <Gift size={20} className="text-neutral-700" />,
      title: "Keep Monochromate free",
      text: "Your support helps us add new features and keep the extension open source",
      cta: "Donate",
      action: () => window.open("https://buymeacoffee.com/lirena00", "_blank"),
    },
    {
      icon: <Star size={20} className="text-neutral-700" />,
      title: "Help others discover us",
      text: "Rate us on the extension store and help people find monochromate",
      cta: "Rate Us",
      action: () => {
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
        window.open(storeUrl, "_blank");
      },
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = async () => {
    setIsVisible(false);

    // Create alarm to re-enable banner after 3 days
    const dismissUntil = Date.now() + 3 * 24 * 60 * 60 * 1000; // 3 days
    await browser.alarms.create("SupportBannerDismissed", {
      when: dismissUntil,
    });

    // Store dismissal state
    await browser.storage.local.set({
      supportBannerDismissed: true,
      supportBannerDismissedUntil: dismissUntil,
    });

    onDismiss?.();
  };

  useEffect(() => {
    const checkDismissalState = async () => {
      try {
        const result = await browser.storage.local.get([
          "supportBannerDismissed",
          "supportBannerDismissedUntil",
        ]);

        if (
          result.supportBannerDismissed &&
          result.supportBannerDismissedUntil
        ) {
          const timeRemaining = result.supportBannerDismissedUntil - Date.now();
          if (timeRemaining > 0) {
            setIsVisible(false);
          } else {
            // Dismissal period expired, clear the state
            await browser.storage.local.remove([
              "supportBannerDismissed",
              "supportBannerDismissedUntil",
            ]);
            await browser.alarms.clear("SupportBannerDismissed");
          }
        }
      } catch (error) {
        console.error("Error checking support banner dismissal state:", error);
      }
    };

    checkDismissalState();
  }, []);

  if (!isVisible) return null;

  const currentMsg = messages[currentMessage];

  return (
    <div className="bg-neutral-100 relative border-neutral-300 border rounded-xl p-4 hover:border-neutral-400 transition-all mb-4">
      <div className="flex items-center gap-3">
        <div className="text-neutral-700">{currentMsg.icon}</div>
        <div className="flex-1">
          <h2 className="font-semibold text-neutral-800">{currentMsg.title}</h2>
          <p className="text-sm text-neutral-500 italic">{currentMsg.text}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={currentMsg.action}
            className="px-3 py-1.5 text-sm bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 transition-colors"
          >
            {currentMsg.cta}
          </button>
          <button
            onClick={handleDismiss}
            className="absolute top-0 right-0 p-1 bg-neutral-800 hover:bg-neutral-900 rounded-tr-lg rounded-bl-lg transition-colors"
            title="Dismiss for 3 days"
          >
            <X size={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportBanner;
