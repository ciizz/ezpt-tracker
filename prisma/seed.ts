import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed game types
  const gameTypes = [
    { name: "Crazy", defaultBuyIn: 20 },
    { name: "Texas", defaultBuyIn: 40 },
    { name: "PLO", defaultBuyIn: 30 },
    { name: "Pineapple", defaultBuyIn: 30 },
  ];

  for (const gt of gameTypes) {
    await prisma.gameType.upsert({
      where: { name: gt.name },
      update: {},
      create: { name: gt.name, defaultBuyIn: gt.defaultBuyIn },
    });
  }

  // Seed guest slot
  await prisma.player.upsert({
    where: { name: "Guests" },
    update: {},
    create: { name: "Guests", isGuest: true, isActive: true },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
