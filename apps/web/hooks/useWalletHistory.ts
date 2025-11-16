import { useEffect, useState } from "react";
import {
  fetchWalletHistory,
  type ApiWalletHistoryItem,
} from "../lib/api";
import { useWalletStore } from "../store/useWalletStore";

type Status = "idle" | "loading" | "success" | "error";

export function useWalletHistory() {
  const { selectedWalletId } = useWalletStore();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ApiWalletHistoryItem[]>([]);

  useEffect(() => {
    if (!selectedWalletId) {
      setHistory([]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setStatus("loading");
        setError(null);
        const data = await fetchWalletHistory(selectedWalletId, 50);
        if (cancelled) return;

        // Ordena por timestamp ascendente para el chart
        const sorted = [...data].sort(
          (a, b) => a.timestamp - b.timestamp
        );
        setHistory(sorted);
        setStatus("success");
      } catch (e: any) {
        if (cancelled) return;
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


