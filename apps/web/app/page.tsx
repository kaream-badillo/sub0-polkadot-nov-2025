"use client";

import { WalletSidebar } from "./wallet-sidebar";
import { MainPanel } from "./main-panel";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <WalletSidebar />
      <MainPanel />
    </div>
  );
}
