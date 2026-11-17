import Link from "next/link";
import { redirect } from "next/navigation";

import SignupForm from "@/components/SignupForm";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  const existing = await getCurrentUser().catch(() => null);
  if (existing) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm">
            A
          </span>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your documents stay private until you share them.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SignupForm />

          <p className="mt-4 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
