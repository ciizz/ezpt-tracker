"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Player {
  id: number;
  name: string;
  isGuest: boolean;
}

interface GameType {
  id: number;
  name: string;
  defaultBuyIn: number;
}

interface Participant {
  playerId: number;
  buyIns: number;
  profitLoss: number;
}

interface SessionFormProps {
  mode: "create" | "edit";
  sessionId?: number;
  initialData?: {
    date: string;
    gameTypeId: number;
    maxBuyIn: number;
    notes: string;
    participants: Participant[];
  };
}

export default function SessionForm({ mode, sessionId, initialData }: SessionFormProps) {
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [date, setDate] = useState(initialData?.date ?? new Date().toISOString().split("T")[0]);
  const [gameTypeId, setGameTypeId] = useState<number>(initialData?.gameTypeId ?? 0);
  const [maxBuyIn, setMaxBuyIn] = useState<number>(initialData?.maxBuyIn ?? 20);
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [participants, setParticipants] = useState<Participant[]>(
    initialData?.participants ?? []
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/players").then((r) => r.json()),
      fetch("/api/game-types").then((r) => r.json()),
    ]).then(([p, gt]) => {
      setPlayers(p);
      setGameTypes(gt);
      if (!initialData?.gameTypeId && gt.length > 0) {
        setGameTypeId(gt[0].id);
        setMaxBuyIn(Number(gt[0].defaultBuyIn));
      }
    });
  }, [initialData?.gameTypeId]);

  function handleGameTypeChange(id: number) {
    setGameTypeId(id);
    const gt = gameTypes.find((g) => g.id === id);
    if (gt) setMaxBuyIn(Number(gt.defaultBuyIn));
  }

  function addParticipant() {
    const availablePlayers = players.filter(
      (p) => !participants.some((part) => part.playerId === p.id)
    );
    if (availablePlayers.length === 0) return;
    setParticipants([
      ...participants,
      { playerId: availablePlayers[0].id, buyIns: 1, profitLoss: 0 },
    ]);
  }

  function removeParticipant(index: number) {
    setParticipants(participants.filter((_, i) => i !== index));
  }

  function updateParticipant(index: number, field: keyof Participant, value: number) {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  }

  // Quick balance check: sum of P&L should be ≈ 0
  const totalPnl = participants.reduce((acc, p) => acc + p.profitLoss, 0);
  const isBalanced = Math.abs(totalPnl) < 0.01;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (participants.length === 0) {
      setError("Add at least one participant");
      return;
    }

    if (!isBalanced) {
      setError(`P&L must sum to 0 (currently ${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)})`);
      return;
    }

    setSaving(true);

    const payload = {
      date,
      gameTypeId,
      maxBuyIn,
      notes: notes || null,
      participants,
    };

    const res = await fetch(
      mode === "create" ? "/api/sessions" : `/api/sessions/${sessionId}`,
      {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setSaving(false);

    if (res.ok) {
      const data = await res.json();
      router.push(`/sessions/${data.id}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save session");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    router.push("/sessions");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Session meta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Game Type</label>
          <select
            value={gameTypeId}
            onChange={(e) => handleGameTypeChange(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500"
          >
            {gameTypes.map((gt) => (
              <option key={gt.id} value={gt.id}>{gt.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Max Buy-in</label>
          <input
            type="number"
            value={maxBuyIn}
            onChange={(e) => setMaxBuyIn(Number(e.target.value))}
            min={1}
            step={1}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about this session..."
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500"
        />
      </div>

      {/* Participants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Participants</h2>
          <button
            type="button"
            onClick={addParticipant}
            className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded transition-colors"
          >
            + Add Player
          </button>
        </div>

        {participants.length === 0 ? (
          <p className="text-gray-500 text-sm">No participants yet. Click &quot;Add Player&quot; to start.</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 uppercase tracking-wide px-1 mb-1">
              <div className="col-span-5">Player</div>
              <div className="col-span-2 text-center">Buy-ins</div>
              <div className="col-span-4 text-right">P&L</div>
              <div className="col-span-1"></div>
            </div>
            {participants.map((p, i) => {
              const availablePlayers = players.filter(
                (pl) =>
                  pl.id === p.playerId ||
                  !participants.some((part, j) => j !== i && part.playerId === pl.id)
              );
              return (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select
                      value={p.playerId}
                      onChange={(e) => updateParticipant(i, "playerId", Number(e.target.value))}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                    >
                      {availablePlayers.map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          {pl.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={p.buyIns}
                      onChange={(e) => updateParticipant(i, "buyIns", Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      min={1}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-2 text-white text-sm text-center focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      value={p.profitLoss}
                      onChange={(e) => updateParticipant(i, "profitLoss", Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      step="0.01"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-2 text-white text-sm text-right focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeParticipant(i)}
                      className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Balance indicator */}
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-800">
              <span className="text-sm text-gray-400">P&L Balance:</span>
              <span className={`font-mono font-semibold text-sm ${isBalanced ? "text-green-400" : "text-yellow-400"}`}>
                {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)}
                {!isBalanced && " ⚠ should be 0"}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-6 py-2 rounded font-medium transition-colors"
        >
          {saving ? "Saving..." : mode === "create" ? "Create Session" : "Update Session"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white px-4 py-2 rounded transition-colors"
        >
          Cancel
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            className="ml-auto text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            Delete Session
          </button>
        )}
      </div>
    </form>
  );
}
