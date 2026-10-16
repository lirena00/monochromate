export interface BannerMessage {
  cta: string;
  iconUrl: string | null;
  id: string;
  kind: "donations" | "stars" | "announcement";
  text: string;
  title: string;
  url: string;
}

export interface BannerConfigCache {
  config: unknown;
  expiresAt: number;
}

interface BannerCacheStorage {
  getValue: () => Promise<unknown>;
  setValue: (value: BannerConfigCache) => Promise<void>;
}

const CACHE_DURATION_MS = 60 * 60 * 1000;
const FAILURE_CACHE_DURATION_MS = 5 * 60 * 1000;

export const DEFAULT_BANNERS: readonly BannerMessage[] = [
  {
    id: "donations",
    iconUrl: null,
    kind: "donations",
    title: "Keep Monochromate free",
    text: "Your support helps us add new features and keep the extension open source",
    cta: "Donate",
    url: "https://buymeacoffee.com/lirena00",
  },
  {
    id: "stars",
    iconUrl: null,
    kind: "stars",
    title: "Love it? Star it.",
    text: "Star the repo to help others discover it",
    cta: "Star on GitHub",
    url: "https://github.com/lirena00/monochromate",
  },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readText = (value: unknown, fallback?: string): string => {
  if (value === undefined && fallback !== undefined) {
    return fallback;
  }
  if (typeof value !== "string" || !value.trim() || value.length > 500) {
    throw new Error("Invalid banner text");
  }
  return value.trim();
};

const readUrl = (value: unknown): string => {
  const url = new URL(readText(value));
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Banner links must use HTTPS without credentials");
  }
  return url.href;
};

const readIconUrl = (value: unknown): string | null => {
  try {
    return readUrl(value);
  } catch {
    return null;
  }
};

// Array order controls rotation. Mandatory banners cannot be hidden or removed.
export function parseBannerConfig(value: unknown): BannerMessage[] {
  if (!(isRecord(value) && Array.isArray(value.banners))) {
    throw new Error("Expected a banners array");
  }
  const messages: BannerMessage[] = [];
  const ids = new Set<string>();
  for (const entry of value.banners) {
    if (!isRecord(entry)) {
      throw new Error("Invalid banner entry");
    }
    const id = readText(entry.id);
    if (ids.has(id)) {
      throw new Error("Duplicate banner ID");
    }
    ids.add(id);
    const builtin = DEFAULT_BANNERS.find((banner) => banner.id === id);
    if (entry.enabled === false && !builtin) {
      continue;
    }
    messages.push({
      id,
      iconUrl: readIconUrl(entry.iconUrl),
      kind: builtin?.kind ?? "announcement",
      title: readText(entry.title, builtin?.title),
      text: readText(entry.text, builtin?.text),
      cta: readText(entry.cta, builtin?.cta),
      url: builtin?.url ?? readUrl(entry.url),
    });
  }
  for (const banner of DEFAULT_BANNERS) {
    if (!ids.has(banner.id)) {
      messages.push({ ...banner });
    }
  }
  return messages;
}

export async function fetchBannerConfig(
  signal: AbortSignal
): Promise<readonly BannerMessage[]> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) {
    controller.abort();
  }
  const timeout = setTimeout(abort, 5000);
  try {
    const response = await fetch("https://monochromate.lirena.in/api/banners", {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      return DEFAULT_BANNERS;
    }
    const data: unknown = await response.json();
    return parseBannerConfig(data);
  } catch {
    return DEFAULT_BANNERS;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}

async function readCachedBanners(
  cache: BannerCacheStorage
): Promise<readonly BannerMessage[] | null> {
  try {
    const value = await cache.getValue();
    if (!isRecord(value) || typeof value.expiresAt !== "number") {
      return null;
    }
    const remaining = value.expiresAt - Date.now();
    if (!(remaining > 0 && remaining <= CACHE_DURATION_MS)) {
      return null;
    }
    return parseBannerConfig(value.config);
  } catch {
    return null;
  }
}

export async function loadBannerConfig(
  cache: BannerCacheStorage,
  signal: AbortSignal
): Promise<readonly BannerMessage[]> {
  const cached = await readCachedBanners(cache);
  if (cached) {
    return cached;
  }
  const messages = await fetchBannerConfig(signal);
  if (signal.aborted) {
    return messages;
  }
  const duration =
    messages === DEFAULT_BANNERS
      ? FAILURE_CACHE_DURATION_MS
      : CACHE_DURATION_MS;
  try {
    await cache.setValue({
      config: { banners: messages },
      expiresAt: Date.now() + duration,
    });
  } catch {
    // Storage failure must not prevent displaying the fetched banners.
  }
  return messages;
}
