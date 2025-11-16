import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Cross-Chain Treasury Monitor",
  description:
    "Dashboard to monitor public treasuries and DAOs across multiple chains.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
