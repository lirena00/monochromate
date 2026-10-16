import { Check, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { BannerIcon } from "@/components/banner-icon";
import type { SupportData } from "@/types/support-data";
import { DEFAULT_BANNERS, loadBannerConfig } from "@/utils/banner-config";
import { bannerConfigCache, settings } from "@/utils/storage";

interface SupportBannerProps {
  onDismiss?: () => void;
}

const DONATION_TARGET = 75;
const STARS_TARGET = 150;

const SupportBanner: React.FC<SupportBannerProps> = ({ onDismiss }) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [supportData, setSupportData] = useState<SupportData | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState(DEFAULT_BANNERS);
  const bannerRef = useRef<HTMLDivElement>(null);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const banner = bannerRef.current;
    const pauseRotation = () => setIsPaused(true);
    const resumeRotation = () => setIsPaused(false);
    banner?.addEventListener("mouseenter", pauseRotation);
    banner?.addEventListener("mouseleave", resumeRotation);
    return () => {
      banner?.removeEventListener("mouseenter", pauseRotation);
      banner?.removeEventListener("mouseleave", resumeRotation);
      if (resumeTimeout.current !== null) {
        clearTimeout(resumeTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const loadBanners = async () => {
      const banners = await loadBannerConfig(
        bannerConfigCache,
        controller.signal
      );
      if (active) {
        setCurrentMessage(0);
        setMessages(banners);
      }
    };
    loadBanners();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  // Auto-advance
  useEffect(() => {
    if (isPaused) {
      return;
    }
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length, isPaused]);

  // Load support data
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
    const unwatch = settings.watch((newSettings) => {
      setSupportData(newSettings?.support_data);
    });
    return () => {
      unwatch();
    };
  }, []);

  // Check dismissal
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

  const handleDismiss = async () => {
    setIsVisible(false);
    const dismissUntil = Date.now() + 1 * 24 * 60 * 60 * 1000;
    await browser.alarms.create("SupportBannerDismissed", {
      when: dismissUntil,
    });
    await browser.storage.local.set({
      supportBannerDismissed: true,
      supportBannerDismissedUntil: dismissUntil,
    });
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  const currentMsg = messages[currentMessage % messages.length];

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
    <div
      className="relative rounded-xl border border-neutral-300 bg-neutral-100 p-4 transition-all hover:border-neutral-400"
      ref={bannerRef}
    >
      {/* Dismiss button */}
      <button
        className="absolute top-0 right-0 rounded-tr-xl rounded-bl-lg bg-neutral-800 p-1 transition-colors hover:bg-neutral-900"
        onClick={handleDismiss}
        title="Dismiss for 1 day"
        type="button"
      >
        <X className="text-white" size={10} />
      </button>

      {/* Dot navigation — top */}
      <div className="mb-3 flex items-center justify-center gap-1.5">
        {messages.map((message, i) => (
          <button
            aria-label={`Go to message ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === currentMessage
                ? "h-1.5 w-4 bg-neutral-700"
                : "h-1.5 w-1.5 bg-neutral-300 hover:bg-neutral-400"
            }`}
            key={message.id}
            onClick={() => {
              setCurrentMessage(i);
              setIsPaused(true);
              if (resumeTimeout.current !== null) {
                clearTimeout(resumeTimeout.current);
              }
              resumeTimeout.current = setTimeout(
                () => setIsPaused(false),
                6000
              );
            }}
            type="button"
          />
        ))}
      </div>

      {/* Message */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="shrink-0 text-neutral-700">
            <BannerIcon iconUrl={currentMsg.iconUrl} kind={currentMsg.kind} />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-neutral-800 text-sm">
              {currentMsg.title}
            </h2>
            <p className="text-neutral-500 text-xs italic">{currentMsg.text}</p>
          </div>
          <button
            className="shrink-0 rounded-lg bg-neutral-800 px-3 py-2 text-white text-xs transition-colors hover:bg-neutral-900"
            onClick={() =>
              window.open(currentMsg.url, "_blank", "noopener,noreferrer")
            }
            type="button"
          >
            {currentMsg.cta}
          </button>
        </div>

        {/* Progress bars */}
        {currentMsg.kind === "donations" && (
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

        {currentMsg.kind === "stars" && (
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
