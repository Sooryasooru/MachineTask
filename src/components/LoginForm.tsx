"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { initials } from "@/lib/format";
import { AlertIcon, ChevronRightIcon } from "./icons";

type DemoUser = {
  id: string;
  name: string;
  email: string;
};

export default function LoginForm({
  users,
  next,
}: {
  users: DemoUser[];
  next?: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(user: DemoUser) {
    setPendingId(user.id);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not sign in.");
      }

      const destination =
        next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      router.replace(destination);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
      setPendingId(null);
    }
  }

  return (
    <div className="mt-6">
      {error ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="space-y-2">
        {users.map((user) => {
          const busy = pendingId === user.id;
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => signIn(user)}
              disabled={pendingId !== null}
              className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-[12px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                {initials(user.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-900">
                  {user.name}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {user.email}
                </span>
              </span>
              <span className="text-xs font-medium text-blue-600">
                {busy ? "Signing in…" : "Continue"}
              </span>
              <ChevronRightIcon className="h-4 w-4 text-slate-300 transition group-hover:text-blue-500" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
