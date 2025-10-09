/**
 * Utility functions for URL pattern matching and manipulation
 * Supports wildcard patterns for flexible URL exclusions
 */

export interface URLExclusion {
  type: "domain" | "pattern";
  value: string;
  displayName: string;
  favicon?: string;
}

/**
 * Normalizes URL for consistent matching
 * Removes protocol and www, but preserves full path and query params
 */
export const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    let normalized = urlObj.hostname.replace(/^www\./, "") + urlObj.pathname;

    // Include search params if they exist
    if (urlObj.search) {
      normalized += urlObj.search;
    }

    // Include hash if it exists
    if (urlObj.hash) {
      normalized += urlObj.hash;
    }

    return normalized;
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, "");
  }
};

/**
 * Extracts domain from URL
 */
export const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  }
};

/**
 * Gets current full URL from the active tab
 */
export const getCurrentFullUrl = async (): Promise<string> => {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tabs[0]?.url || "";
  } catch {
    return window.location.href;
  }
};

/**
 * Converts a URL pattern to a regular expression
 * Supports wildcards (*) and handles special regex characters
 */
export const patternToRegex = (pattern: string): RegExp => {
  // Escape special regex characters except *
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

  // Replace * with .* for wildcard matching
  const regexPattern = escaped.replace(/\*/g, ".*");

  // Add anchors for exact matching
  return new RegExp(`^${regexPattern}$`, "i");
};

/**
 * Checks if a URL matches a pattern
 * Supports wildcard matching with *
 */
export const urlMatchesPattern = (url: string, pattern: string): boolean => {
  const normalizedUrl = normalizeUrl(url);
  const normalizedPattern = normalizeUrl(pattern);

  // If pattern contains *, use regex matching
  if (normalizedPattern.includes("*")) {
    const regex = patternToRegex(normalizedPattern);
    return regex.test(normalizedUrl);
  }

  // Otherwise, use startsWith for exact prefix matching
  return normalizedUrl.startsWith(normalizedPattern);
};

/**
 * Checks if current URL should be excluded based on domain and URL pattern blacklists
 */
export const shouldExcludeUrl = (
  currentUrl: string,
  domainBlacklist: string[],
  urlPatternBlacklist: string[]
): boolean => {
  const domain = getDomainFromUrl(currentUrl);

  // Check domain blacklist first (faster lookup)
  if (domainBlacklist.includes(domain)) {
    return true;
  }

  // Check URL pattern blacklist
  return urlPatternBlacklist.some((pattern) =>
    urlMatchesPattern(currentUrl, pattern)
  );
};

/**
 * Generates display name for exclusion item
 */
export const getExclusionDisplayName = (
  value: string,
  type: "domain" | "pattern"
): string => {
  if (type === "domain") {
    return value;
  }

  // For patterns, show a clean version
  const maxLength = 45;
  let displayValue = value.replace(/^https?:\/\//, "").replace(/^www\./, "");

  if (displayValue.length <= maxLength) {
    return displayValue;
  }

  // Truncate from the middle to preserve important parts
  const domain = getDomainFromUrl(value);
  const pathPart = displayValue.replace(domain, "");

  if (pathPart.length <= maxLength - domain.length - 3) {
    return displayValue;
  }

  return `${domain}${pathPart.substring(0, maxLength - domain.length - 6)}...`;
};

/**
 * Suggests a URL pattern based on the current URL
 */
export const suggestUrlPattern = (currentUrl: string): string => {
  try {
    const urlObj = new URL(currentUrl);
    const domain = urlObj.hostname.replace(/^www\./, "");
    const pathname = urlObj.pathname;

    // Common pattern suggestions based on URL structure
    if (pathname.includes("/status/")) {
      // Twitter/X status URLs
      return `${domain}/*/status/*`;
    } else if (pathname.includes("/watch")) {
      // YouTube watch URLs
      return `${domain}/watch*`;
    } else if (pathname.includes("/maps/")) {
      // Google Maps URLs
      return `${domain}/maps/*`;
    } else if (pathname.includes("/post/") || pathname.includes("/posts/")) {
      // Social media post URLs
      return `${domain}/*/post/*`;
    } else if (pathname.split("/").length > 3) {
      // Multi-level paths - suggest pattern for the section
      const pathParts = pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2) {
        return `${domain}/${pathParts[0]}/*`;
      }
    }

    // Default: domain + path + wildcard
    return `${domain}${pathname}*`;
  } catch {
    return currentUrl + "*";
  }
};

/**
 * Converts blacklists to unified exclusion format for UI display
 */
export const getUnifiedExclusions = (
  domainBlacklist: string[],
  urlPatternBlacklist: string[]
): URLExclusion[] => {
  const exclusions: URLExclusion[] = [];

  // Add domain exclusions
  domainBlacklist.forEach((domain) => {
    exclusions.push({
      type: "domain",
      value: domain,
      displayName: domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    });
  });

  // Add URL pattern exclusions
  urlPatternBlacklist.forEach((pattern) => {
    const domain = getDomainFromUrl(pattern);
    exclusions.push({
      type: "pattern",
      value: pattern,
      displayName: getExclusionDisplayName(pattern, "pattern"),
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    });
  });

  return exclusions.sort((a, b) => {
    // Sort by domain first, then by type (domains before patterns)
    const domainA = getDomainFromUrl(a.value);
    const domainB = getDomainFromUrl(b.value);

    if (domainA !== domainB) {
      return domainA.localeCompare(domainB);
    }

    if (a.type !== b.type) {
      return a.type === "domain" ? -1 : 1;
    }

    return a.value.localeCompare(b.value);
  });
};

/**
 * Validates a URL pattern
 */
export const isValidUrlPattern = (pattern: string): boolean => {
  try {
    // Remove wildcards for validation
    const cleanPattern = pattern.replace(/\*/g, "placeholder");

    // Check if it's a valid URL structure
    if (!cleanPattern.includes("/")) {
      return false; // Must have at least domain/path structure
    }

    // Try to create URL object (add protocol if missing)
    const testUrl = cleanPattern.startsWith("http")
      ? cleanPattern
      : `https://${cleanPattern}`;
    new URL(testUrl);

    return true;
  } catch {
    return false;
  }
};
