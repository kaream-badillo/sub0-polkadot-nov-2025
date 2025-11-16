import { useWallets } from "../hooks/useWallets";
import { useWalletHistory } from "../hooks/useWalletHistory";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function MainPanel() {
  const { wallets, selectedWalletId } = useWallets();
  const { history, status } = useWalletHistory();

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const latest = history[history.length - 1];

  return (
    <main className="flex-1">
      <div className="mx-auto flex h-screen max-w-5xl flex-col px-6 py-6">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {selectedWallet
                ? `${selectedWallet.label} — overview`
                : "Treasury overview"}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedWallet
                ? `Showing latest indexer snapshots for ${selectedWallet.address}`
                : "Select a wallet in the sidebar to see balances and history."}
            </p>
          </div>
          <div className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400">
            MVP mode &mdash; data wiring will be completed in later phases.
          </div>
        </header>

        <section className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Latest balance
            </h3>
            <p className="mt-3 text-2xl font-semibold text-slate-100">
              {latest ? Number(latest.balance) / 1e18 : 0}
              <span className="text-sm font-normal text-slate-500">
                {" "}
                (native units)
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
              History (last {history.length} points)
            </h3>
            <div className="mt-3 h-40">
              {status === "loading" && (
                <p className="text-xs text-slate-500">Loading history…</p>
              )}
              {status === "success" && history.length === 0 && (
                <p className="text-xs text-slate-500">
                  No snapshots yet. Wait for the indexer sync job to run.
                </p>
              )}
              {status === "success" && history.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(ts) =>
                        new Date(ts).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      }
                      tick={{ fill: "#64748b", fontSize: 10 }}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      tickFormatter={(value) =>
                        (Number(value) / 1e18).toFixed(2)
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1e293b",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      labelFormatter={(ts) =>
                        new Date(Number(ts)).toLocaleString()
                      }
                      formatter={(value: any) => [
                        (Number(value) / 1e18).toFixed(4),
                        "Balance",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Alerts
            </h3>
            <p className="mt-3 text-sm text-slate-400">
              UI for configuring alerts (thresholds, tags) will live here in
              Phase 3.3.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}


