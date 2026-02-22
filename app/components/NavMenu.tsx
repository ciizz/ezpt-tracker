"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function NavMenu() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.isAdmin))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAdmin(false);
    window.location.href = "/";
  }

  return (
    <nav className="flex items-center gap-6 text-sm">
      <Link href="/sessions" className="text-gray-300 hover:text-white transition-colors">
        Sessions
      </Link>
      <Link href="/players" className="text-gray-300 hover:text-white transition-colors">
        Players
      </Link>
      <Link href="/stats" className="text-gray-300 hover:text-white transition-colors">
        Stats
      </Link>
      {isAdmin ? (
        <button onClick={logout} className="text-gray-400 hover:text-white transition-colors">
          Log Out
        </button>
      ) : (
        <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
          Log In
        </Link>
      )}
    </nav>
  );
}
