import Link from "next/link";

import AppHeader from "@/components/AppHeader";
import DashboardActions from "@/components/DashboardActions";
import DeleteDocumentButton from "@/components/DeleteDocumentButton";
import {
  ChevronRightIcon,
  DocumentIcon,
  ShareIcon,
} from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatEditedAt, roleLabel } from "@/lib/format";

const roleBadgeStyles: Record<"EDITOR" | "VIEWER", string> = {
  EDITOR: "bg-blue-50 text-blue-700 ring-blue-200",
  VIEWER: "bg-amber-50 text-amber-700 ring-amber-200",
};

function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-400">
        {icon}
      </span>
      <p className="mt-3 text-sm font-medium text-slate-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

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
            owner: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Documents
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create, import and share documents. Everything saves to Postgres.
            </p>
          </div>
          <DashboardActions />
        </div>

        <section className="mt-9" aria-labelledby="owned-heading">
          <div className="mb-3 flex items-baseline justify-between">
            <h2
              id="owned-heading"
              className="text-sm font-semibold text-slate-900"
            >
              My documents
            </h2>
            <span className="text-xs text-slate-500">{owned.length}</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {owned.length === 0 ? (
              <EmptyState
                icon={<DocumentIcon className="h-5 w-5" />}
                title="No documents yet"
                description="Create a blank document or import a .txt, .md or .docx file to get started."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {owned.map((document) => (
                  <li
                    key={document.id}
                    className="group relative flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      <DocumentIcon className="h-4 w-4" />
                    </span>

                    <Link
                      href={`/docs/${document.id}`}
                      className="min-w-0 flex-1 rounded-sm after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      <span className="block truncate text-sm font-medium text-slate-900 group-hover:text-blue-700">
                        {document.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {formatEditedAt(document.updatedAt)}
                      </span>
                    </Link>

                    <DeleteDocumentButton
                      documentId={document.id}
                      title={document.title}
                    />
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-9" aria-labelledby="shared-heading">
          <div className="mb-3 flex items-baseline justify-between">
            <h2
              id="shared-heading"
              className="text-sm font-semibold text-slate-900"
            >
              Shared with me
            </h2>
            <span className="text-xs text-slate-500">{shared.length}</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {shared.length === 0 ? (
              <EmptyState
                icon={<ShareIcon className="h-5 w-5" />}
                title="Nothing shared with you yet"
                description="When a teammate shares a document, it appears here with their name and your role."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {shared.map(({ document, role }) => (
                  <li
                    key={document.id}
                    className="group relative flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                      <DocumentIcon className="h-4 w-4" />
                    </span>

                    <Link
                      href={`/docs/${document.id}`}
                      className="min-w-0 flex-1 rounded-sm after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      <span className="block truncate text-sm font-medium text-slate-900 group-hover:text-blue-700">
                        {document.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {formatEditedAt(document.updatedAt)}
                      </span>
                    </Link>

                    <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200 sm:inline">
                      Owner: {document.owner.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${roleBadgeStyles[role]}`}
                    >
                      {roleLabel(role)}
                    </span>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
