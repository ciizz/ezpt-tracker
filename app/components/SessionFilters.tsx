"use client";

import { useRouter } from "next/navigation";

interface GameType {
  id: number;
  name: string;
}

export default function SessionFilters({
  years,
  gameTypes,
  currentYear,
  currentGameTypeId,
}: {
  years: number[];
  gameTypes: GameType[];
  currentYear: number | undefined;
  currentGameTypeId: number | undefined;
}) {
  const router = useRouter();

  function navigate(year: string, gameTypeId: string) {
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (gameTypeId) params.set("gameTypeId", gameTypeId);
    router.push(`/sessions?${params.toString()}`);
  }

  return (
    <div className="flex gap-3 mb-6 flex-wrap">
      <select
        defaultValue={currentYear ?? ""}
        onChange={(e) => navigate(e.target.value, String(currentGameTypeId ?? ""))}
        className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
      >
        <option value="">All Years</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        defaultValue={currentGameTypeId ?? ""}
        onChange={(e) => navigate(String(currentYear ?? ""), e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
      >
        <option value="">All Game Types</option>
        {gameTypes.map((gt) => (
          <option key={gt.id} value={gt.id}>{gt.name}</option>
        ))}
      </select>
    </div>
  );
}
