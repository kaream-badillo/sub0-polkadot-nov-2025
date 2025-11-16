import { create } from "zustand";

type ChainId = "ethereum-mainnet" | "polygon-pos" | "unknown";

export type UiWallet = {
  id: string;
  label: string;
  address: string;
  chainId: ChainId;
};

type WalletState = {
  wallets: UiWallet[];
  selectedWalletId: string | null;
  selectWallet: (id: string) => void;
  setWallets: (wallets: UiWallet[]) => void;
};

export const useWalletStore = create<WalletState>((set) => ({
  wallets: [],
  selectedWalletId: null,
  selectWallet: (id) => set({ selectedWalletId: id }),
  setWallets: (wallets) => set({ wallets }),
}));


