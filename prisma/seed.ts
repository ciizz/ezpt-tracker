import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed game types
  const gameTypes = [
    { name: "Crazy", defaultBuyIn: 20 },
    { name: "Texas", defaultBuyIn: 20 },
    { name: "PLO", defaultBuyIn: 20 },
    { name: "Pineapple", defaultBuyIn: 20 },
  ];

  for (const gt of gameTypes) {
    await prisma.gameType.upsert({
      where: { name: gt.name },
      update: {},
      create: { name: gt.name, defaultBuyIn: gt.defaultBuyIn },
    });
  }

  // Seed regular players
  const players = [
    "ALEX",
    "RICO",
    "CESAR",
    "GHADZ",
    "SIMON",
    "JIJ",
    "THOMAS",
    "EDDY",
  ];

  for (const name of players) {
    await prisma.player.upsert({
      where: { name },
      update: {},
      create: { name, isGuest: false, isActive: true },
    });
  }

  // Seed guest slot
  await prisma.player.upsert({
    where: { name: "Guest" },
    update: {},
    create: { name: "Guest", isGuest: true, isActive: true },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
