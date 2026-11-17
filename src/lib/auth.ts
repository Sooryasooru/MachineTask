import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "./db";

/**
 * Demo-only session. The cookie stores a seeded user id and is *not* a
 * credential: anyone can forge it. Real auth (OAuth or hashed passwords plus
 * signed sessions) is deliberately out of scope for this assignment.
 */
export const SESSION_COOKIE = "ajaia_user";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
}

/** For pages: send anonymous visitors to the demo login screen. */
export async function requireUser(nextPath?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  }
  return user;
}
