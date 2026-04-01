import type {
  BMCResponse,
  GitHubRepoResponse,
  SupportData,
} from "@/types/support-data";

const BMC_API_TOKEN = import.meta.env.VITE_BMC_API_TOKEN || "";
const BMC_API_BASE_URL = "https://developers.buymeacoffee.com/api/v1";
const GITHUB_API_BASE_URL = "https://api.github.com";
const DONATION_TARGET_DAYS = 30;

/**
 * Fetch total donations from Buy Me a Coffee for the last 30 days
 */
export async function fetchBMCDonations(): Promise<number> {
  if (!BMC_API_TOKEN) {
    console.warn("BMC API token not configured");
    return 0;
  }

  try {
    let total = 0;
    let nextPageUrl: string | null = `${BMC_API_BASE_URL}/supporters`;
    const thirtyDaysAgo =
      Date.now() - DONATION_TARGET_DAYS * 24 * 60 * 60 * 1000;

    while (nextPageUrl) {
      const response = await fetch(nextPageUrl, {
        headers: {
          Authorization: `Bearer ${BMC_API_TOKEN}`,
        },
      });

      if (!response.ok) {
        console.error(
          `BMC API error: ${response.status} ${response.statusText}`
        );
        break;
      }

      const data: BMCResponse = await response.json();

      // Process supporters
      for (const supporter of data.data) {
        const createdAt = new Date(supporter.support_created_on).getTime();

        // Only count donations from last 30 days, in USD, not refunded
        if (
          createdAt >= thirtyDaysAgo &&
          supporter.support_currency === "USD" &&
          !supporter.is_refunded
        ) {
          const pricePerCoffee = Number.parseFloat(
            supporter.support_coffee_price
          );
          const coffeeCount = supporter.support_coffees;
          total += pricePerCoffee * coffeeCount;
        }
      }

      nextPageUrl = data.next_page_url;
    }

    return Math.round(total * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error("Error fetching BMC donations:", error);
    return 0;
  }
}

/**
 * Fetch GitHub star count for the repository
 */
export async function fetchGitHubStars(): Promise<number> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/lirena00/monochromate`
    );

    if (!response.ok) {
      console.error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
      return 0;
    }

    const data: GitHubRepoResponse = await response.json();
    return data.stargazers_count;
  } catch (error) {
    console.error("Error fetching GitHub stars:", error);
    return 0;
  }
}

/**
 * Fetch all support data (donations + stars)
 */
export async function fetchAllSupportData(): Promise<SupportData> {
  const now = Date.now();

  // Fetch both in parallel for better performance
  const [donations, stars] = await Promise.all([
    fetchBMCDonations(),
    fetchGitHubStars(),
  ]);

  return {
    donations: {
      total: donations,
      lastFetched: now,
    },
    stars: {
      count: stars,
      lastFetched: now,
    },
  };
}

/**
 * Check if support data is stale (older than 24 hours or missing)
 */
export function isSupportDataStale(
  supportData: SupportData | undefined
): boolean {
  if (!supportData) {
    return true;
  }

  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  const donationsStale =
    now - supportData.donations.lastFetched > twentyFourHours;
  const starsStale = now - supportData.stars.lastFetched > twentyFourHours;

  return donationsStale || starsStale;
}
