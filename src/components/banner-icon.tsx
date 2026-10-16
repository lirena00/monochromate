import { Gift, Megaphone, Star } from "lucide-react";
import { useState } from "react";
import type { BannerMessage } from "@/utils/banner-config";

export function BannerIcon({
  iconUrl,
  kind,
}: Pick<BannerMessage, "iconUrl" | "kind">) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (iconUrl && iconUrl !== failedUrl) {
    return (
      // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Image load errors are network events, not user interactions.
      <img
        alt=""
        className="h-7 w-7 rounded object-contain"
        decoding="async"
        height={28}
        onError={() => setFailedUrl(iconUrl)}
        referrerPolicy="no-referrer"
        src={iconUrl}
        width={28}
      />
    );
  }
  if (kind === "donations") {
    return <Gift size={18} />;
  }
  if (kind === "stars") {
    return <Star size={18} />;
  }
  return <Megaphone size={18} />;
}
