// ============================================================
// ARCHIVO: app/api/memberships/route.ts
// POST - Crear/renovar membresía con precio automático según estado
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/supabase-server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { userId, planType, paymentMethod, currentMembershipId, startDate } =
      await req.json();

    const today = startDate ? new Date(startDate + "T12:00:00") : new Date();
    const end = new Date(today);

    if (planType === "diario") end.setDate(end.getDate() + 1);
    else if (planType === "semanal") end.setDate(end.getDate() + 7);
    else if (planType === "quincenal") end.setDate(end.getDate() + 15);
    else if (planType === "mensual") end.setMonth(end.getMonth() + 1);

    // Obtener precios configurados para el plan
    const priceRecord = await prisma.membershipPrice.findUnique({
      where: { planType },
    });

    // Detectar si el socio está vencido (membresía anterior ya expirada)
    let isOverdue = false;
    if (currentMembershipId) {
      const currentMembership = await prisma.membership.findUnique({
        where: { id: currentMembershipId },
        select: { endDate: true, status: true },
      });
      if (currentMembership) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const endDate = new Date(currentMembership.endDate);
        endDate.setHours(0, 0, 0, 0);
        isOverdue = endDate < now || currentMembership.status === "expired";
      }
    } else {
      // Si no tiene membresía previa, verificar si tiene alguna vencida
      const lastMembership = await prisma.membership.findFirst({
        where: { userId },
        orderBy: { startDate: "desc" },
        select: { endDate: true, status: true },
      });
      if (lastMembership) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const endDate = new Date(lastMembership.endDate);
        endDate.setHours(0, 0, 0, 0);
        isOverdue = endDate < now || lastMembership.status === "expired";
      }
    }

    // Seleccionar precio: si está vencido y hay precio vencido configurado, usarlo
    let amountPaid: number | null = null;
    if (priceRecord) {
      if (isOverdue && priceRecord.priceOverdue != null) {
        amountPaid = priceRecord.priceOverdue;
      } else {
        amountPaid = priceRecord.price;
      }
    }

    await prisma.$transaction(async (tx) => {
      if (currentMembershipId) {
        await tx.membership.update({
          where: { id: currentMembershipId },
          data: { status: "expired" },
        });
      }
      await tx.membership.create({
        data: {
          userId,
          planType,
          startDate: today,
          endDate: end,
          status: "active",
          paymentMethod: paymentMethod || null,
          amountPaid,
          collectedBy: session.name || null,
          collectedById: session.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      amountPaid,
      isOverdue,
      planType,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
