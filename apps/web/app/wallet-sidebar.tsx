import Link from "next/link";
import { useWalletStore } from "../store/useWalletStore";

const MOCK_WALLETS = [
  {
    id: "eth-foundation",
    label: "Ethereum Foundation",
    chain: "Ethereum",
    address: "0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae",
  },
  {
    id: "polygon-foundation",
    label: "Polygon Foundation",
    chain: "Polygon",
    address: "0xD8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  },
  {
    id: "chainlink-grant",
    label: "Chainlink Grant",
    chain: "Ethereum",
    address: "0x3f5CE5FBFe3E9af3971dD833D26BA9b5C936f0fE",
  },
];

export function WalletSidebar() {
  const { selectedWalletId, selectWallet } = useWalletStore();

  return (
    <aside className="flex h-screen w-80 flex-col border-r border-slate-800 bg-slate-950/80">
      <div className="border-b border-slate-800 px-4 py-4">
        <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Cross-Chain Treasury Monitor
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Track public treasuries across chains.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Watched wallets
        </p>
        <nav className="mt-2 space-y-1">
          {MOCK_WALLETS.map((wallet) => {
            const isActive = wallet.id === selectedWalletId;
            return (
              <button
                key={wallet.id}
                className={`flex w-full flex-col rounded-md px-2 py-2 text-left text-sm ${
                  isActive
                    ? "bg-slate-800 text-slate-50"
                    : "text-slate-300 hover:bg-slate-800/80"
                }`}
                type="button"
                onClick={() => selectWallet(wallet.id)}
              >
                <span className="font-medium">{wallet.label}</span>
                <span className="text-[11px] uppercase tracking-wide text-slate-500">
                  {wallet.chain}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
        <p className="mb-1">
          Data powered by Hyperbridge & onchain RPCs. UI is read-only in this
          MVP.
        </p>
        <Link
          href="https://github.com/kaream-badillo/sub0-polkadot-nov-2025"
          className="text-sky-400 hover:text-sky-300"
        >
          View code on GitHub
        </Link>
      </div>
    </aside>
  );
}


