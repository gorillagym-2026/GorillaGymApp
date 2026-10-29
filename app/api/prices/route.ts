// ============================================================
// ARCHIVO: app/api/prices/route.ts
// PUT - Actualizar precios de membresías (en término y vencido)
// GET - Obtener todos los precios
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/supabase-server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const prices = await prisma.membershipPrice.findMany();
    return NextResponse.json({ prices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { prices } = await req.json();
    // prices: { mensual: { price: 15000, priceOverdue: 17000 }, diario: { price: 2000, priceOverdue: 2500 }, ... }
    // también acepta el formato legacy: { mensual: 15000 }

    await Promise.all(
      Object.entries(prices).map(([planType, value]) => {
        const price = typeof value === "number" ? value : (value as any).price;
        const priceOverdue = typeof value === "number" ? null : (value as any).priceOverdue ?? null;

        return prisma.membershipPrice.upsert({
          where: { planType },
          update: {
            price: price as number,
            priceOverdue: priceOverdue as number | null,
            updatedBy: session.id,
          },
          create: {
            planType,
            price: price as number,
            priceOverdue: priceOverdue as number | null,
            updatedBy: session.id,
          },
        });
      }),
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
