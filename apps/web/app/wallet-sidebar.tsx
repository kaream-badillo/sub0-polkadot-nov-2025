import Link from "next/link";
import { useWallets } from "../hooks/useWallets";

export function WalletSidebar() {
  const { wallets, selectedWalletId, selectWallet, status } = useWallets();

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
        <div className="mt-2 space-y-2 px-2 text-xs text-slate-500">
          {status === "loading" && (
            <p className="animate-pulse">Loading wallets from API…</p>
          )}
          {status === "error" && (
            <p className="text-amber-400">
              Failed to load wallets. Check API and NEXT_PUBLIC_API_URL.
            </p>
          )}
        </div>
        <nav className="mt-1 space-y-1">
          {wallets.map((wallet) => {
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
                  {wallet.chainId}
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


