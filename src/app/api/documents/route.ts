import { NextResponse } from "next/server";

import { unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const [owned, shared] = await Promise.all([
    db.document.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    }),
    db.share.findMany({
      where: { userId: user.id },
      orderBy: { document: { updatedAt: "desc" } },
      select: {
        role: true,
        document: {
          select: {
            id: true,
            title: true,
            updatedAt: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    owned,
    shared: shared.map((share) => ({
      ...share.document,
      role: share.role,
    })),
  });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const document = await db.document.create({
    data: { ownerId: user.id },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ document }, { status: 201 });
}
