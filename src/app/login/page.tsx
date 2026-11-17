import { redirect } from "next/navigation";

import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const existing = await getCurrentUser().catch(() => null);
  if (existing) redirect("/");

  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;

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
            Sign in to open your documents.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use the email and password you signed up with.
          </p>

          <LoginForm next={next} />
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-center text-xs leading-relaxed text-slate-500">
          <span className="font-medium text-slate-700">Demo account</span>
          <br />
          alice@ajaia.test · Ajaia-Demo-2026!
        </div>
      </div>
    </main>
  );
}
