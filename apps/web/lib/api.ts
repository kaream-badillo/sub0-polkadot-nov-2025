const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type WalletLatestSnapshot = {
  balance: string;
  timestamp: number;
  delta?: string;
  percentageChange?: number;
};

export type ApiWallet = {
  id: string;
  label?: string;
  address: string;
  chainId: string;
  tags?: string[];
  importance?: string;
  latestSnapshot?: WalletLatestSnapshot;
};

export type ApiWalletHistoryItem = {
  walletId: string;
  chainId: string;
  balance: string;
  timestamp: number;
};

export type ApiAlertRule = {
  id: string;
  walletId: string;
  type: "balance-drop" | "balance-increase" | "large-tx" | "custom";
  direction: "above" | "below";
  threshold: number;
  windowMinutes: number;
  enabled: boolean;
  channel: "in-app" | "webhook" | "email";
};

export async function fetchWallets(): Promise<ApiWallet[]> {
  const res = await fetch(`${API_BASE_URL}/wallets?includeBalance=true`);
  if (!res.ok) {
    throw new Error("Failed to fetch wallets");
  }
  const json = await res.json();
  return json.data ?? [];
}

export async function fetchWalletHistory(
  id: string,
  limit = 50
): Promise<ApiWalletHistoryItem[]> {
  const res = await fetch(
    `${API_BASE_URL}/wallets/${encodeURIComponent(id)}/history?limit=${limit}`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch wallet history");
  }
  const json = await res.json();
  return json.data ?? [];
}

export async function createOrUpdateAlert(
  alert: ApiAlertRule
): Promise<ApiAlertRule> {
  const res = await fetch(`${API_BASE_URL}/alerts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(alert),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const message =
      json?.error ||
      json?.message ||
      `Failed to create alert (status ${res.status})`;
    throw new Error(message);
  }

  const json = await res.json();
  return json.data;
}


export type ApiWallet = {
  id: string;
  label: string;
  address: string;
  chainId: string;
  tags?: string[];
  importance?: string;
  latestSnapshot?: {
    balance: string;
    timestamp: number;
    delta?: string;
    percentageChange?: number;
  };
};

export type ApiWalletHistoryItem = {
  walletId: string;
  chainId: string;
  balance: string;
  timestamp: number;
};

function getApiBaseUrl() {
  // Next.js inyecta NEXT_PUBLIC_API_URL en el bundle del cliente
  const base =
    process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.length > 0
      ? process.env.NEXT_PUBLIC_API_URL
      : "http://localhost:3000";
  return base.replace(/\/$/, "");
}

export async function fetchWallets(): Promise<ApiWallet[]> {
  const res = await fetch(`${getApiBaseUrl()}/wallets`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch wallets: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data ?? [];
}

export async function fetchWalletHistory(
  id: string,
  limit = 50
): Promise<ApiWalletHistoryItem[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  const res = await fetch(
    `${getApiBaseUrl()}/wallets/${encodeURIComponent(id)}/history?${params.toString()}`,
    {
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch wallet history: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data ?? [];
}


