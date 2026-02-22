"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface GameType {
  id: number;
  name: string;
  defaultBuyIn: number;
}

export default function GameTypesPage() {
  const router = useRouter();
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add form state
  const [newName, setNewName] = useState("");
  const [newBuyIn, setNewBuyIn] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit state: null = no row being edited
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editBuyIn, setEditBuyIn] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  async function loadData() {
    const [gtRes, meRes] = await Promise.all([
      fetch("/api/game-types"),
      fetch("/api/auth/me"),
    ]);
    const meData = await meRes.json();
    if (!meData.isAdmin) {
      router.replace("/");
      return;
    }
    setGameTypes(await gtRes.json());
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createGameType(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/game-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), defaultBuyIn: Number(newBuyIn) }),
    });
    setSaving(false);
    if (res.ok) {
      setNewName("");
      setNewBuyIn("");
      loadData();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create game type");
    }
  }

  function startEdit(gt: GameType) {
    setEditId(gt.id);
    setEditName(gt.name);
    setEditBuyIn(String(gt.defaultBuyIn));
    setEditError("");
  }

  function cancelEdit() {
    setEditId(null);
    setEditError("");
  }

  async function saveEdit(id: number) {
    setEditError("");
    setEditSaving(true);
    const res = await fetch(`/api/game-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), defaultBuyIn: Number(editBuyIn) }),
    });
    setEditSaving(false);
    if (res.ok) {
      setEditId(null);
      loadData();
    } else {
      const data = await res.json();
      setEditError(data.error ?? "Failed to update game type");
    }
  }

  async function deleteGameType(gt: GameType) {
    if (!confirm(`Delete "${gt.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/game-types/${gt.id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      loadData();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to delete game type");
    }
  }

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Game Types</h1>

      {/* Add form */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Add Game Type</h2>
        <form onSubmit={createGameType} className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Texas Hold'em"
              required
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Default Buy-In ($)</label>
            <input
              type="number"
              value={newBuyIn}
              onChange={(e) => setNewBuyIn(e.target.value)}
              placeholder="20"
              min="0.01"
              step="0.01"
              required
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500 w-28"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors"
          >
            Add
          </button>
        </form>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Game types table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Default Buy-In</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {gameTypes.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                  No game types yet. Add one above.
                </td>
              </tr>
            )}
            {gameTypes.map((gt) =>
              editId === gt.id ? (
                <tr key={gt.id} className="border-b border-gray-800/50 bg-gray-800/30">
                  <td className="px-4 py-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:border-green-500 w-full"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={editBuyIn}
                      onChange={(e) => setEditBuyIn(e.target.value)}
                      min="0.01"
                      step="0.01"
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:border-green-500 w-24"
                    />
                    {editError && <p className="text-red-400 text-xs mt-1">{editError}</p>}
                  </td>
                  <td className="px-4 py-2 text-right space-x-3">
                    <button
                      onClick={() => saveEdit(gt.id)}
                      disabled={editSaving}
                      className="text-xs text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={gt.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-medium text-white">{gt.name}</td>
                  <td className="px-4 py-3 text-gray-300">${gt.defaultBuyIn}</td>
                  <td className="px-4 py-3 text-right space-x-4">
                    <button
                      onClick={() => startEdit(gt)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteGameType(gt)}
                      className="text-xs text-red-500 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
