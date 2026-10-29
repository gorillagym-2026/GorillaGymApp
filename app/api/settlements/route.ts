import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/supabase-server";
import prisma from "@/lib/prisma";
import { getPendingCash, UNASSIGNED_KEY } from "@/lib/recaudacion";

// Registrar una rendición de efectivo
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { collectorKey, collectorName, amount, note } = await req.json();
  const amt = Math.round(Number(amount));

  if (!collectorKey || collectorKey === UNASSIGNED_KEY) {
    return NextResponse.json({ error: "Cobrador inválido" }, { status: 400 });
  }
  if (!Number.isFinite(amt) || amt <= 0) {
    return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
  }

  const isLegacy = String(collectorKey).startsWith("name:");
  const collectorId = isLegacy ? null : String(collectorKey);

  // Nadie puede rendirse a sí mismo
  if (collectorId && collectorId === session.id) {
    return NextResponse.json(
      { error: "No podés registrar una rendición tuya. La tiene que recibir otro admin." },
      { status: 400 },
    );
  }

  const admins = await prisma.profile.findMany({
    where: { role: "admin" },
    select: { id: true, fullName: true },
  });

  let name = String(collectorName ?? "");
  if (collectorId) {
    const admin = admins.find((a) => a.id === collectorId);
    if (!admin) return NextResponse.json({ error: "Cobrador no encontrado" }, { status: 404 });
    name = admin.fullName;
  }

  const { pending } = await getPendingCash(admins);
  const pendingAmount = pending.get(String(collectorKey)) ?? 0;
  if (amt > pendingAmount) {
    return NextResponse.json(
      { error: `El monto supera el efectivo pendiente ($${pendingAmount.toLocaleString("es-AR")})` },
      { status: 400 },
    );
  }

  const settlement = await prisma.cashSettlement.create({
    data: {
      collectorId,
      collectorName: name,
      amount: amt,
      receivedById: session.id,
      receivedByName: session.name,
      note: note ? String(note).slice(0, 200) : null,
    },
  });

  return NextResponse.json({ success: true, settlement });
}
