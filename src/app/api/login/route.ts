import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { jsonError, readJson } from "@/lib/api";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

/**
 * Demo authentication: the client picks one of the seeded users and we store
 * that user id in an httpOnly cookie. There is no password or token signature,
 * which is documented as a deliberate scope cut.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Pick a demo user to sign in.");
  }

  const user = await db.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });

  if (!user) {
    return jsonError(
      404,
      "That demo user no longer exists. Re-run the seed script.",
    );
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return NextResponse.json({ ok: true, userId: user.id });
}
