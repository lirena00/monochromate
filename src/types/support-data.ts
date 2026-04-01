export interface SupportData {
  donations: {
    total: number; // USD sum for last 30 days
    lastFetched: number; // Unix timestamp ms
  };
  stars: {
    count: number;
    lastFetched: number;
  };
}

export interface BMCSupporter {
  country: string;
  is_refunded: boolean | null;
  payer_email: string;
  referer: string | null;
  support_coffee_price: string; // String number like "5.00"
  support_coffees: number;
  support_created_on: string; // ISO date string
  support_currency: string; // "USD", etc.
  support_email: string;
  support_id: string;
  support_note: string;
  support_note_pinned: boolean;
  support_updated_on: string;
  support_visibility: number; // 0 = hidden, 1 = visible
  supporter_name: string;
  transaction_id: string;
  transfer_id: string | null;
}

export interface BMCResponse {
  current_page: number;
  data: BMCSupporter[];
  first_page_url: string;
  from: number;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
}

export interface GitHubRepoResponse {
  stargazers_count: number;
  // ... other fields we don't need
}
