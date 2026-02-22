/**
 * One-time Excel import script.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/import-excel.ts
 *
 * Reads EZPT_tracker.xlsx ("Game Tracker" sheet) and imports all historical sessions
 * into the Neon DB via Prisma. Also creates the ski-trip Event and links its sessions.
 *
 * The script is idempotent: it skips sessions that already exist for a given date + gameType.
 */

import * as XLSX from "xlsx";
import path from "path";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const SHEET_NAME = "Game Tracker";

// Column letter → { playerName, role }
// Each regular player occupies two columns: rebuys then P&L.
const PLAYER_PAIRS: { name: string; rebuyCol: string; plCol: string }[] = [
  { name: "ALEX",   rebuyCol: "D", plCol: "E" },
  { name: "RICO",   rebuyCol: "F", plCol: "G" },
  { name: "CESAR",  rebuyCol: "H", plCol: "I" },
  { name: "GHADZ",  rebuyCol: "J", plCol: "K" },
  { name: "SIMON",  rebuyCol: "L", plCol: "M" },
  { name: "JIJ",    rebuyCol: "N", plCol: "O" },
  { name: "THOMAS", rebuyCol: "P", plCol: "Q" },
  { name: "EDDY",   rebuyCol: "R", plCol: "S" },
];

// Guest columns (T/U = Guest 1, V/W = Guest 2).
// Both map to the single "Guest" DB player.
// If both appear in the same session, Guest 1 takes priority.
const GUEST_PAIRS = [
  { rebuyCol: "T", plCol: "U" }, // Guest 1 (priority)
  { rebuyCol: "V", plCol: "W" }, // Guest 2 (fallback if Guest 1 absent)
];

// Ski trip event window (inclusive)
const SKI_EVENT_NAME = "EZPT part au ski edition 1";
const SKI_START = new Date(Date.UTC(2025, 2, 19)); // 2025-03-19
const SKI_END   = new Date(Date.UTC(2025, 2, 23)); // 2025-03-23

/** Convert an Excel date serial to a UTC midnight Date. */
function parseExcelDate(serial: number): Date {
  const parsed = (XLSX.SSF as any).parse_date_code(serial);
  return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
}

/** Returns true if date falls within [start, end] (inclusive, UTC date comparison). */
function isInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

async function main() {
  const filePath = path.resolve(__dirname, "../EZPT_tracker.xlsx");
  console.log(`Reading: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[SHEET_NAME];

  if (!sheet) {
    const available = workbook.SheetNames.join(", ");
    throw new Error(`Sheet "${SHEET_NAME}" not found. Available: ${available}`);
  }

  // Use column-letter keys (A, B, C…) — unambiguous regardless of cell content.
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    header: "A",
    defval: null,
  });

  // Rows 1 and 2 are header label rows — skip them.
  const dataRows = rows.slice(2).filter((r) => r["A"] != null && typeof r["A"] === "number");
  console.log(`Found ${dataRows.length} data rows`);

  // Pre-load DB records
  const dbPlayers   = await prisma.player.findMany();
  const dbGameTypes = await prisma.gameType.findMany();

  const playerMap   = new Map(dbPlayers.map((p) => [p.name.toUpperCase(), p]));
  const gameTypeMap = new Map(dbGameTypes.map((gt) => [gt.name.toUpperCase(), gt]));

  // Create (or fetch) the ski-trip event
  const skiEvent = await prisma.event.upsert({
    where: { id: 1 }, // safe assumption on clean DB; idempotent via name check below
    update: {},
    create: {
      name: SKI_EVENT_NAME,
      startDate: SKI_START,
      endDate: SKI_END,
    },
  });

  // Verify we have the right event if one already existed
  const confirmedEvent =
    skiEvent.name === SKI_EVENT_NAME
      ? skiEvent
      : await prisma.event.findFirst({ where: { name: SKI_EVENT_NAME } }) ??
        await prisma.event.create({
          data: { name: SKI_EVENT_NAME, startDate: SKI_START, endDate: SKI_END },
        });

  console.log(`Ski event id=${confirmedEvent.id}: "${confirmedEvent.name}"`);

  const guestPlayer = playerMap.get("GUEST");
  if (!guestPlayer) {
    throw new Error('Player "Guest" not found in DB. Run the seed first.');
  }

  let imported = 0;
  let skipped  = 0;

  for (const row of dataRows) {
    // --- Date ---
    const dateSerial = row["A"] as number;
    const date = parseExcelDate(dateSerial);

    // --- Game type ---
    const gameTypeName = (row["B"] as string | null)?.trim();
    if (!gameTypeName) { skipped++; continue; }

    const gameType = gameTypeMap.get(gameTypeName.toUpperCase());
    if (!gameType) {
      console.warn(`Unknown game type "${gameTypeName}" — skipping row`);
      skipped++;
      continue;
    }

    // --- Buy-in (already numeric in this Excel) ---
    const maxBuyIn = row["C"] != null ? Number(row["C"]) : Number(gameType.defaultBuyIn);

    // --- Participants ---
    const participants: { playerId: number; rebuys: number; profitLoss: number }[] = [];

    for (const { name, rebuyCol, plCol } of PLAYER_PAIRS) {
      const plRaw = row[plCol];
      if (plRaw == null) continue; // not in this session

      const profitLoss = Number(plRaw);
      if (isNaN(profitLoss)) {
        console.warn(`Non-numeric P&L for ${name} on ${date.toISOString().slice(0, 10)} — skipping player`);
        continue;
      }

      const rebuys = row[rebuyCol] != null ? Number(row[rebuyCol]) : 0;
      const player = playerMap.get(name.toUpperCase());
      if (!player) {
        console.warn(`Player "${name}" not found in DB — skipping`);
        continue;
      }

      participants.push({ playerId: player.id, rebuys, profitLoss });
    }

    // --- Guest columns (T/U = Guest 1, V/W = Guest 2; Guest 1 takes priority) ---
    let guestAdded = false;
    for (const { rebuyCol, plCol } of GUEST_PAIRS) {
      if (guestAdded) break; // only one Guest entry per session
      const plRaw = row[plCol];
      if (plRaw == null) continue;

      const profitLoss = Number(plRaw);
      if (isNaN(profitLoss)) continue;

      const rebuys = row[rebuyCol] != null ? Number(row[rebuyCol]) : 0;
      participants.push({ playerId: guestPlayer.id, rebuys, profitLoss });
      guestAdded = true;
    }

    if (participants.length === 0) {
      skipped++;
      continue;
    }

    // --- Idempotency: skip only if an identical session already exists ---
    // Two sessions can legitimately share the same date + gameType (e.g. two games in one day),
    // so we also compare participant sets (same players + same P&L + same rebuys).
    const dayStart = new Date(date);
    const dayEnd   = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));

    const candidateSessions = await prisma.session.findMany({
      where: { date: { gte: dayStart, lt: dayEnd }, gameTypeId: gameType.id },
      include: { participants: true },
    });

    const isDuplicate = candidateSessions.some((s) => {
      if (s.participants.length !== participants.length) return false;
      return participants.every((p) =>
        s.participants.some(
          (sp) =>
            sp.playerId === p.playerId &&
            Number(sp.profitLoss) === p.profitLoss &&
            sp.rebuys === p.rebuys
        )
      );
    });

    if (isDuplicate) {
      skipped++;
      continue;
    }

    // --- Event linkage ---
    const eventId = isInRange(date, SKI_START, SKI_END) ? confirmedEvent.id : null;

    await prisma.session.create({
      data: {
        date,
        gameTypeId: gameType.id,
        maxBuyIn,
        eventId,
        participants: { create: participants },
      },
    });

    imported++;
    const label = date.toISOString().slice(0, 10);
    const ski   = eventId ? " [ski]" : "";
    console.log(`Imported: ${label} | ${gameTypeName} | ${participants.length} players${ski}`);
  }

  console.log(`\nDone. Imported: ${imported}, Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
