import { useEffect, useState } from "react";
import {
  fetchWalletHistory,
  type ApiWalletHistoryItem,
} from "../lib/api";
import { useWalletStore } from "../store/useWalletStore";

const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

const MOCK_HISTORY: ApiWalletHistoryItem[] = [
  {
    walletId: "mock",
    chainId: "ethereum-mainnet",
    balance: (1000n * 10n ** 18n).toString(),
    timestamp: Date.now() - 4 * 60 * 60 * 1000,
  },
  {
    walletId: "mock",
    chainId: "ethereum-mainnet",
    balance: (1100n * 10n ** 18n).toString(),
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
  },
  {
    walletId: "mock",
    chainId: "ethereum-mainnet",
    balance: (1050n * 10n ** 18n).toString(),
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    walletId: "mock",
    chainId: "ethereum-mainnet",
    balance: (1200n * 10n ** 18n).toString(),
    timestamp: Date.now() - 60 * 60 * 1000,
  },
  {
    walletId: "mock",
    chainId: "ethereum-mainnet",
    balance: (1180n * 10n ** 18n).toString(),
    timestamp: Date.now(),
  },
];

type Status = "idle" | "loading" | "success" | "error";

export function useWalletHistory() {
  const { selectedWalletId } = useWalletStore();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ApiWalletHistoryItem[]>([]);

  useEffect(() => {
    if (!selectedWalletId) {
      setHistory([]);
      setStatus("idle");
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setStatus("loading");
        setError(null);
        let data: ApiWalletHistoryItem[] = [];

        try {
          data = await fetchWalletHistory(selectedWalletId!, 50);
        } catch (err: any) {
          if (!USE_MOCK_DATA) {
            throw err;
          }
        }

        if (cancelled) return;

        const source =
          data.length > 0 || !USE_MOCK_DATA ? data : MOCK_HISTORY;

        const sorted = [...source].sort(
          (a, b) => a.timestamp - b.timestamp
        );
        setHistory(sorted);
        setStatus("success");
      } catch (e: any) {
        if (cancelled) return;

        if (USE_MOCK_DATA) {
          const sorted = [...MOCK_HISTORY].sort(
            (a, b) => a.timestamp - b.timestamp
          );
          setHistory(sorted);
          setStatus("success");
          setError(null);
          return;
        }

        setStatus("error");
        setError(e.message || "Error loading history");
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedWalletId]);

  return { status, error, history };
}


