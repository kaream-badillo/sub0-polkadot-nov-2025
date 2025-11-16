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
          tags?: string[];
          latestSnapshot?: ApiWallet["latestSnapshot"];
        }>((w) => ({
          id: w.id,
          label: w.label || w.id,
          address: w.address,
          chainId:
            w.chainId === "ethereum-mainnet" || w.chainId === "polygon-pos"
              ? (w.chainId as "ethereum-mainnet" | "polygon-pos")
              : "unknown",
          tags: w.tags,
          latestSnapshot: w.latestSnapshot,
        }));

        setWallets(
          mapped.map((w) => ({
            id: w.id,
            label: w.label,
            address: w.address,
            chainId: w.chainId,
            tags: w.tags,
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

