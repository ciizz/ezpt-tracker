"use client";

import { useRouter } from "next/navigation";

export default function YearSelect({
  pathname,
  years,
  currentYear,
  isAdmin,
  extraParams,
}: {
  pathname: string;
  years: number[];
  currentYear: number | undefined;
  isAdmin: boolean;
  extraParams?: Record<string, string>;
}) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(extraParams);
    if (e.target.value) params.set("year", e.target.value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <select
      defaultValue={currentYear ?? ""}
      onChange={handleChange}
      className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
    >
      {isAdmin && <option value="">All Time</option>}
      {years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );
}
