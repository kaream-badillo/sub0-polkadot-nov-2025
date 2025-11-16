import { useEffect, useState } from "react";
import { fetchWallets, type ApiWallet } from "../lib/api";
import { useWalletStore } from "../store/useWalletStore";

type Status = "idle" | "loading" | "success" | "error";

export function useWallets() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const { wallets, setWallets, selectedWalletId, selectWallet } =
    useWalletStore();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setStatus("loading");
        setError(null);
        const apiWallets = await fetchWallets();

        if (cancelled) return;

        const mapped = apiWallets.map<{
          id: string;
          label: string;
          address: string;
          chainId: "ethereum-mainnet" | "polygon-pos" | "unknown";
          latestSnapshot?: ApiWallet["latestSnapshot"];
        }>((w) => ({
          id: w.id,
          label: w.label || w.id,
          address: w.address,
          chainId:
            w.chainId === "ethereum-mainnet" || w.chainId === "polygon-pos"
              ? (w.chainId as "ethereum-mainnet" | "polygon-pos")
              : "unknown",
          latestSnapshot: w.latestSnapshot,
        }));

        setWallets(
          mapped.map((w) => ({
            id: w.id,
            label: w.label,
            address: w.address,
            chainId: w.chainId,
          }))
        );

        if (!selectedWalletId && mapped.length > 0) {
          selectWallet(mapped[0].id);
        }

        setStatus("success");
      } catch (e: any) {
        if (cancelled) return;
        setStatus("error");
        setError(e.message || "Error loading wallets");
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [selectWallet, selectedWalletId, setWallets]);

  return { wallets, status, error, selectedWalletId, selectWallet };
}

import { useEffect, useState } from "react";
import type { ApiWallet, ApiWalletHistoryItem } from "../lib/api";
import { fetchWallets, fetchWalletHistory } from "../lib/api";

type Status = "idle" | "loading" | "error" | "success";

export function useWallets() {
  const [wallets, setWallets] = useState<ApiWallet[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      setError(null);
      try {
        const data = await fetchWallets();
        if (!cancelled) {
          setWallets(data);
          setStatus("success");
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load wallets");
          setStatus("error");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { wallets, status, error };
}

export function useWalletHistory(walletId: string | null, limit = 50) {
  const [history, setHistory] = useState<ApiWalletHistoryItem[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletId) {
      setHistory([]);
      setStatus("idle");
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError(null);
      try {
        const data = await fetchWalletHistory(walletId, limit);
        if (!cancelled) {
          setHistory(
            data
              .slice()
              .sort((a, b) => a.timestamp - b.timestamp)
          );
          setStatus("success");
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load history");
          setStatus("error");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [walletId, limit]);

  return { history, status, error };
}


