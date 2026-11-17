import { redirect } from "next/navigation";

import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  try {
    const existing = await getCurrentUser();
    if (existing) redirect("/");
  } catch {
    // A database error should surface as setup instructions, not a 500.
  }

  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;

  let users: { id: string; name: string; email: string }[] = [];
  let databaseReady = true;

  try {
    users = await db.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
  } catch {
    databaseReady = false;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm">
            A
          </span>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
            Ajaia Docs
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            A small document editor with sharing and import.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Choose a demo account
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            There are no passwords in this build. Pick one of the seeded users.
          </p>

          {!databaseReady ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-medium">The database isn&apos;t reachable.</p>
              <p className="mt-1 text-amber-800">
                Set <code className="rounded bg-amber-100 px-1">DATABASE_URL</code>{" "}
                in <code className="rounded bg-amber-100 px-1">.env</code>, then run:
              </p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-amber-100/70 p-2.5 text-xs">
                npx prisma migrate deploy{"\n"}npm run db:seed
              </pre>
            </div>
          ) : users.length === 0 ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-medium">No demo users found.</p>
              <p className="mt-1 text-amber-800">
                Run <code className="rounded bg-amber-100 px-1">npm run db:seed</code>{" "}
                to create Alice, Bob and Carol.
              </p>
            </div>
          ) : (
            <LoginForm users={users} next={next} />
          )}
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
          Demo authentication only: the session is an unsigned cookie holding a
          user id. Not suitable for production.
        </p>
      </div>
    </main>
  );
}
