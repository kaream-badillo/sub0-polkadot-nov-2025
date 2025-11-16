import { useEffect, useState } from "react";
import { fetchWallets, type ApiWallet } from "../lib/api";
import { useWalletStore } from "../store/useWalletStore";

const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

const MOCK_WALLETS: ApiWallet[] = [
  {
    id: "eth-foundation",
    label: "Ethereum Foundation",
    address: "0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae",
    chainId: "ethereum-mainnet",
    tags: ["foundation", "core"],
    importance: "core-treasury",
  },
  {
    id: "polygon-foundation",
    label: "Polygon Foundation",
    address: "0xD8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    chainId: "polygon-pos",
    tags: ["foundation", "ops"],
    importance: "ops",
  },
  {
    id: "chainlink-grants",
    label: "Chainlink Community Grants",
    address: "0x3f5CE5FBFe3E9af3971dD833D26BA9b5C936f0bE",
    chainId: "ethereum-mainnet",
    tags: ["grants", "watchlist"],
    importance: "watchlist",
  },
];

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

        let apiWallets: ApiWallet[] = [];
        try {
          apiWallets = await fetchWallets();
        } catch (err: any) {
          if (!USE_MOCK_DATA) {
            throw err;
          }
        }

        if (cancelled) return;

        const source =
          apiWallets.length > 0 || !USE_MOCK_DATA ? apiWallets : MOCK_WALLETS;

        const mapped = source.map<{
          id: string;
          label: string;
          address: string;
          chainId: "ethereum-mainnet" | "polygon-pos" | "unknown";
          tags?: string[];
        }>((w) => ({
          id: w.id,
          label: w.label || w.id,
          address: w.address,
          chainId:
            w.chainId === "ethereum-mainnet" || w.chainId === "polygon-pos"
              ? (w.chainId as "ethereum-mainnet" | "polygon-pos")
              : "unknown",
          tags: w.tags,
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

        if (USE_MOCK_DATA) {
          // Fallback duro a mock en caso de fallo de API
          const mapped = MOCK_WALLETS.map((w) => ({
            id: w.id,
            label: w.label,
            address: w.address,
            chainId:
              w.chainId === "ethereum-mainnet" || w.chainId === "polygon-pos"
                ? (w.chainId as "ethereum-mainnet" | "polygon-pos")
                : "unknown",
            tags: w.tags,
          }));
          setWallets(mapped);
          if (!selectedWalletId && mapped.length > 0) {
            selectWallet(mapped[0].id);
          }
          setStatus("success");
          setError(null);
          return;
        }

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

