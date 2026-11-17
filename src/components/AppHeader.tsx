import Link from "next/link";

import { initials } from "@/lib/format";
import type { SessionUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default function AppHeader({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur no-print">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-blue-600 text-[13px] font-bold text-white">
              A
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-slate-900">
              Ajaia Docs
            </span>
          </Link>
          <Link
            href="/"
            className="hidden text-sm text-slate-500 transition hover:text-slate-900 sm:block"
          >
            Documents
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200"
            aria-hidden="true"
          >
            {initials(user.name)}
          </span>
          <span className="hidden max-w-[10rem] truncate text-sm text-slate-700 sm:block">
            {user.name}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
