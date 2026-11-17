import { NextResponse } from "next/server";

import {
  firstIssue,
  jsonError,
  notFoundDocument,
  readJson,
  unauthorized,
} from "@/lib/api";
import { canManageSharing } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAccess, listShares } from "@/lib/documents";
import { revokeShareSchema, shareRequestSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await context.params;
  const access = await getAccess(user.id, id);
  if (!access) return notFoundDocument();
  if (!canManageSharing(access)) {
    return jsonError(403, "Only the owner can manage sharing.");
  }

  const body = await readJson(request);
  const parsed = shareRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, firstIssue(parsed.error));

  const email = parsed.data.email.toLowerCase();

  if (email === user.email.toLowerCase()) {
    return jsonError(400, "You can't share a document with yourself.");
  }

  const invitee = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!invitee) {
    return jsonError(404, "No user with that email.");
  }

  // Re-sharing an existing collaborator updates their role (upsert).
  await db.share.upsert({
    where: { documentId_userId: { documentId: id, userId: invitee.id } },
    update: { role: parsed.data.role },
    create: {
      documentId: id,
      userId: invitee.id,
      role: parsed.data.role,
    },
  });

  return NextResponse.json({ shares: await listShares(id) });
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await context.params;
  const access = await getAccess(user.id, id);
  if (!access) return notFoundDocument();
  if (!canManageSharing(access)) {
    return jsonError(403, "Only the owner can manage sharing.");
  }

  const body = await readJson(request);
  const parsed = revokeShareSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, firstIssue(parsed.error));

  const removed = await db.share.deleteMany({
    where: { documentId: id, userId: parsed.data.userId },
  });

  if (removed.count === 0) {
    return jsonError(404, "That person doesn't have access to this document.");
  }

  return NextResponse.json({ shares: await listShares(id) });
}
