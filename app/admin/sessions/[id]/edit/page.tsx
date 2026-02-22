import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import SessionForm from "@/app/components/SessionForm";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id: Number(id) },
    include: {
      participants: true,
    },
  });

  if (!session) notFound();

  const initialData = {
    date: session.date.toISOString().split("T")[0],
    gameTypeId: session.gameTypeId,
    maxBuyIn: Number(session.maxBuyIn),
    notes: session.notes ?? "",
    participants: session.participants.map((p) => ({
      playerId: p.playerId,
      rebuys: p.rebuys,
      profitLoss: Number(p.profitLoss),
    })),
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Edit Session</h1>
      <SessionForm mode="edit" sessionId={session.id} initialData={initialData} />
    </div>
  );
}
