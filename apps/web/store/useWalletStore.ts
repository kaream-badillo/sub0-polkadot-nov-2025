import { create } from "zustand";

type ChainId = "ethereum-mainnet" | "polygon-pos" | "unknown";

export type UiWallet = {
  id: string;
  label: string;
  address: string;
  chainId: ChainId;
  tags?: string[];
};

type WalletState = {
  wallets: UiWallet[];
  selectedWalletId: string | null;
  selectWallet: (id: string) => void;
  setWallets: (wallets: UiWallet[]) => void;
  updateWalletTags: (id: string, tags: string[]) => void;
};

export const useWalletStore = create<WalletState>((set) => ({
  wallets: [],
  selectedWalletId: null,
  selectWallet: (id) => set({ selectedWalletId: id }),
  setWallets: (wallets) => set({ wallets }),
  updateWalletTags: (id, tags) =>
    set((state) => ({
      wallets: state.wallets.map((w) =>
        w.id === id
          ? {
              ...w,
              tags,
            }
          : w
      ),
    })),
}));



