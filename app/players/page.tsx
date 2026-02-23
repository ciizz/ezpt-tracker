"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Player {
  id: number;
  name: string;
  isGuest: boolean;
  isActive: boolean;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    const [playersRes, meRes] = await Promise.all([
      fetch("/api/players?all=true"),
      fetch("/api/auth/me"),
    ]);
    const [playersData, meData] = await Promise.all([
      playersRes.json(),
      meRes.json(),
    ]);
    setPlayers(playersData);
    setIsAdmin(meData.isAdmin);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createPlayer(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim().toUpperCase() }),
    });
    setSaving(false);
    if (res.ok) {
      setNewName("");
      loadData();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create player");
    }
  }

  async function toggleArchive(player: Player) {
    await fetch(`/api/players/${player.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !player.isActive }),
    });
    loadData();
  }

  if (loading) return <div className="text-gray-400">Loading...</div>;

  const activePlayers = players.filter((p) => p.isActive);
  const inactivePlayers = players.filter((p) => !p.isActive);

  function renderTable(list: Player[]) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Name</th>
              {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((player) => (
              <tr key={player.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className={`px-4 py-3 font-medium ${!player.isActive ? "text-gray-500" : "text-white"}`}>
                  <Link href={`/players/${player.id}`} className="hover:text-green-400 transition-colors">
                    {player.isGuest ? <span className="text-gray-500">{player.name}</span> : player.name}
                  </Link>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleArchive(player)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      {player.isActive ? "Set Inactive" : "Restore"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Players</h1>
      </div>

      {/* Add Player form — admin only */}
      {isAdmin && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Add Player</h2>
          <form onSubmit={createPlayer} className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="PLAYER NAME"
                required
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500 uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors"
            >
              Add Player
            </button>
          </form>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Active Players</h2>
        {renderTable(activePlayers)}
      </section>

      {inactivePlayers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Inactive Players</h2>
          {renderTable(inactivePlayers)}
        </section>
      )}
    </div>
  );
}
