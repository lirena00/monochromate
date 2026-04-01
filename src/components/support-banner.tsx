import { Check, Gift, Star, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { SupportData } from "@/types/support-data";
import { settings } from "@/utils/storage";

interface SupportBannerProps {
  onDismiss?: () => void;
}

const DONATION_TARGET = 75; // $75 USD
const STARS_TARGET = 150; // 150 stars

const SupportBanner: React.FC<SupportBannerProps> = ({ onDismiss }) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [supportData, setSupportData] = useState<SupportData | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);

  const messages = [
    {
      icon: <Gift className="text-neutral-700" size={18} />,
      title: "Keep Monochromate free",
      text: "Your support helps us add new features and keep the extension open source",
      cta: "Donate",
      action: () => window.open("https://buymeacoffee.com/lirena00", "_blank"),
      showDonations: true,
    },
    {
      icon: <Star className="text-neutral-700" size={18} />,
      title: "Love it? Star it.",
      text: "Star the repo to help others discover it",
      cta: "Star on GitHub",
      action: () =>
        window.open("https://github.com/lirena00/monochromate", "_blank"),
      showStars: true,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [messages.length]);

  // Load support data from storage
  useEffect(() => {
    const loadSupportData = async () => {
      try {
        const currentSettings = await settings.getValue();
        setSupportData(currentSettings.support_data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading support data:", error);
        setIsLoading(false);
      }
    };

    loadSupportData();

    // Watch for updates
    const unwatch = settings.watch((newSettings) => {
      setSupportData(newSettings?.support_data);
    });

    return () => {
      unwatch();
    };
  }, []);

  const handleDismiss = async () => {
    setIsVisible(false);

    // Create alarm to re-enable banner after 2 days
    const dismissUntil = Date.now() + 2 * 24 * 60 * 60 * 1000; // 2 days
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

  if (!isVisible) {
    return null;
  }

  const currentMsg = messages[currentMessage];

  // Calculate progress
  const donationAmount = supportData?.donations.total || 0;
  const donationProgress = Math.min(
    (donationAmount / DONATION_TARGET) * 100,
    100
  );
  const donationComplete = donationProgress >= 100;

  const starCount = supportData?.stars.count || 0;
  const starProgress = Math.min((starCount / STARS_TARGET) * 100, 100);
  const starComplete = starProgress >= 100;

  return (
    <div className="relative rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400">
      <div className="flex flex-col gap-2">
        {/* Message section */}
        <div className="flex items-center gap-2">
          <div className="text-neutral-700">{currentMsg.icon}</div>
          <div className="flex-1">
            <h2 className="font-semibold text-neutral-800 text-sm">
              {currentMsg.title}
            </h2>
            <p className="text-neutral-500 text-xs italic">{currentMsg.text}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="rounded-lg bg-neutral-800 px-3 py-2 text-white text-xs transition-colors hover:bg-neutral-900"
              onClick={currentMsg.action}
              type="button"
            >
              {currentMsg.cta}
            </button>
            <button
              className="absolute top-0 right-0 rounded-tr-lg rounded-bl-lg bg-neutral-800 p-1 transition-colors hover:bg-neutral-900"
              onClick={handleDismiss}
              title="Dismiss for 2 days"
              type="button"
            >
              <X className="text-white" size={10} />
            </button>
          </div>
        </div>

        {/* Progress bar (conditional based on message type) */}
        {currentMsg.showDonations && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 text-xs">
                ${donationAmount.toFixed(2)} / ${DONATION_TARGET}
              </span>
              <div className="flex items-center gap-1">
                {donationComplete && (
                  <Check className="text-green-600" size={12} />
                )}
                <span className="text-neutral-600 text-xs">
                  {donationProgress.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
              {isLoading ? (
                <div className="h-full w-full animate-pulse bg-neutral-300" />
              ) : (
                <div
                  className="h-full rounded-full bg-neutral-700 transition-all duration-500 ease-out"
                  style={{ width: `${donationProgress}%` }}
                />
              )}
            </div>
          </div>
        )}

        {currentMsg.showStars && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 text-xs">
                {starCount} / {STARS_TARGET} stars
              </span>
              <div className="flex items-center gap-1">
                {starComplete && <Check className="text-green-600" size={12} />}
                <span className="text-neutral-600 text-xs">
                  {starProgress.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
              {isLoading ? (
                <div className="h-full w-full animate-pulse bg-neutral-300" />
              ) : (
                <div
                  className="h-full rounded-full bg-neutral-700 transition-all duration-500 ease-out"
                  style={{ width: `${starProgress}%` }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportBanner;
