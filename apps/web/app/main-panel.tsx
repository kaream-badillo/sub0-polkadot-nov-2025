"use client";

import { FormEvent, useMemo, useState } from "react";
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
import { useWalletStore } from "../store/useWalletStore";
import { createOrUpdateAlert } from "../lib/api";
import { useToast } from "../components/toast-provider";

export function MainPanel() {
  const { wallets, selectedWalletId } = useWallets();
  const { history, status } = useWalletHistory();
  const { updateWalletTags } = useWalletStore();
  const { showToast } = useToast();

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const latest = history[history.length - 1];

  const [newTag, setNewTag] = useState("");
  const [alertThreshold, setAlertThreshold] = useState<string>("5");
  const [alertWindow, setAlertWindow] = useState<string>("60");
  const [alertDirection, setAlertDirection] = useState<"above" | "below">(
    "above"
  );
  const [alertChannel, setAlertChannel] =
    useState<"in-app" | "webhook" | "email">("in-app");
  const [submittingAlert, setSubmittingAlert] = useState(false);

  const currentTags = useMemo(
    () => selectedWallet?.tags ?? [],
    [selectedWallet]
  );

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
              Tags & alerts
            </h3>
            {!selectedWallet && (
              <p className="mt-3 text-xs text-slate-500">
                Select a wallet to edit tags or create alerts.
              </p>
            )}

            {selectedWallet && (
              <div className="mt-3 space-y-4 text-xs text-slate-200">
                <div>
                  <p className="mb-1 font-medium text-slate-300">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {currentTags.length === 0 && (
                      <span className="text-[11px] text-slate-500">
                        No tags yet. Add one below.
                      </span>
                    )}
                    {currentTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const filtered = currentTags.filter(
                            (t) => t !== tag
                          );
                          updateWalletTags(selectedWallet.id, filtered);
                          showToast(
                            "info",
                            `Removed tag "${tag}" (MVP: solo en memoria)`
                          );
                        }}
                        className="group inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-200 hover:border-rose-500 hover:text-rose-100"
                      >
                        <span>{tag}</span>
                        <span className="text-[10px] text-slate-500 group-hover:text-rose-300">
                          ×
                        </span>
                      </button>
                    ))}
                  </div>
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      if (!selectedWallet) return;
                      const value = newTag.trim();
                      if (!value) {
                        showToast("error", "Tag cannot be empty.");
                        return;
                      }
                      if (value.length > 24) {
                        showToast(
                          "error",
                          "Tag is too long (max 24 characters)."
                        );
                        return;
                      }
                      if (currentTags.includes(value)) {
                        showToast(
                          "info",
                          "Tag already exists for this wallet."
                        );
                        return;
                      }
                      const updated = [...currentTags, value];
                      updateWalletTags(selectedWallet.id, updated);
                      setNewTag("");
                      showToast(
                        "success",
                        `Tag "${value}" added (MVP: solo en memoria).`
                      );
                    }}
                  >
                    <input
                      className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-500"
                      placeholder="Add tag (e.g. foundation, ops)"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-sky-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-sky-500 disabled:opacity-50"
                      disabled={!selectedWallet}
                    >
                      Add
                    </button>
                  </form>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Tags are stored client-side in MVP (no backend persistence
                    yet).
                  </p>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <p className="mb-1 font-medium text-slate-300">
                    Alert for this wallet
                  </p>
                  <form
                    className="space-y-2"
                    onSubmit={async (e: FormEvent) => {
                      e.preventDefault();
                      if (!selectedWallet) {
                        showToast(
                          "error",
                          "Select a wallet before creating an alert."
                        );
                        return;
                      }

                      const thresholdNum = Number(alertThreshold);
                      const windowNum = Number(alertWindow);

                      if (!Number.isFinite(thresholdNum) || thresholdNum <= 0) {
                        showToast(
                          "error",
                          "Threshold must be a positive number."
                        );
                        return;
                      }

                      if (!Number.isFinite(windowNum) || windowNum < 1) {
                        showToast(
                          "error",
                          "Window (minutes) must be at least 1."
                        );
                        return;
                      }

                      const id = `alert-${selectedWallet.id}-${alertDirection}-${Date.now()}`;

                      try {
                        setSubmittingAlert(true);
                        await createOrUpdateAlert({
                          id,
                          walletId: selectedWallet.id,
                          type: "balance-drop",
                          direction: alertDirection,
                          threshold: thresholdNum,
                          windowMinutes: windowNum,
                          enabled: true,
                          channel: alertChannel,
                        });

                        showToast(
                          "success",
                          "Alert created/updated successfully."
                        );
                      } catch (err: any) {
                        showToast(
                          "error",
                          err?.message ||
                            "Failed to create alert. Check API is running."
                        );
                      } finally {
                        setSubmittingAlert(false);
                      }
                    }}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1 text-[11px]">
                        <span className="text-slate-400">
                          Threshold (% change)
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={alertThreshold}
                          onChange={(e) => setAlertThreshold(e.target.value)}
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-500"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-[11px]">
                        <span className="text-slate-400">Window (minutes)</span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={alertWindow}
                          onChange={(e) => setAlertWindow(e.target.value)}
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-500"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1 text-[11px]">
                        <span className="text-slate-400">Direction</span>
                        <select
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-500"
                          value={alertDirection}
                          onChange={(e) =>
                            setAlertDirection(
                              e.target.value === "below" ? "below" : "above"
                            )
                          }
                        >
                          <option value="above">Above threshold</option>
                          <option value="below">Below threshold</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-[11px]">
                        <span className="text-slate-400">Channel</span>
                        <select
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-500"
                          value={alertChannel}
                          onChange={(e) =>
                            setAlertChannel(
                              e.target.value as
                                | "in-app"
                                | "webhook"
                                | "email"
                            )
                          }
                        >
                          <option value="in-app">In-app</option>
                          <option value="webhook">Webhook</option>
                          <option value="email">Email</option>
                        </select>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingAlert}
                      className="mt-2 w-full rounded-md bg-emerald-600 px-2 py-1.5 text-[11px] font-semibold text-emerald-50 hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {submittingAlert ? "Saving alert..." : "Save alert rule"}
                    </button>
                    <p className="mt-1 text-[10px] text-slate-500">
                      This calls <code>/alerts</code> (POST) on the API and
                      updates the indexer configuration in-memory.
                    </p>
                  </form>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}


