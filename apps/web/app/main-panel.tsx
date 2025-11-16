export function MainPanel() {
  return (
    <main className="flex-1">
      <div className="mx-auto flex h-screen max-w-5xl flex-col px-6 py-6">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Treasury overview
            </h2>
            <p className="text-xs text-slate-500">
              Select a wallet in the sidebar to see balances and history
              (placeholder UI).
            </p>
          </div>
          <div className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400">
            MVP mode &mdash; data wiring will be completed in later phases.
          </div>
        </header>

        <section className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total balance (placeholder)
            </h3>
            <p className="mt-3 text-2xl font-semibold text-slate-100">
              --.--{" "}
              <span className="text-sm font-normal text-slate-500">
                across chains
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Latest movement
            </h3>
            <p className="mt-3 text-sm text-slate-400">
              Waiting for indexer sync… this card will show significant
              movements once backend wiring is completed.
            </p>
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


