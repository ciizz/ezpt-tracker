import type { Metadata } from "next";
import "./globals.css";

// All pages query live DB data — disable static prerendering globally
export const dynamic = 'force-dynamic';
import Link from "next/link";
import NavMenu from "@/app/components/NavMenu";

export const metadata: Metadata = {
  title: "EZPT Tracker",
  description: "Poker session tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <header className="border-b border-gray-800 bg-gray-900">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-green-400 tracking-tight">
              EZPT Tracker
            </Link>
            <NavMenu />
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
