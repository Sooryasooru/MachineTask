import Link from "next/link";

import { DocumentIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
          <DocumentIcon className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-slate-900">
          Document not found or you don&apos;t have access
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          The document may have been deleted, or it isn&apos;t shared with the
          account you&apos;re signed in as.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Back to documents
        </Link>
      </div>
    </main>
  );
}
