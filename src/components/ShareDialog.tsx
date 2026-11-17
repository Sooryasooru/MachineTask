"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { initials, roleLabel } from "@/lib/format";
import type { ShareRole, ShareView } from "@/lib/types";
import { AlertIcon, CheckIcon, ShareIcon, XIcon } from "./icons";

type ShareDialogProps = {
  documentId: string;
  documentTitle: string;
  owner: { name: string; email: string };
  initialShares: ShareView[];
};

export default function ShareDialog({
  documentId,
  documentTitle,
  owner,
  initialShares,
}: ShareDialogProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<ShareView[]>(initialShares);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("VIEWER");
  const [busy, setBusy] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function openDialog() {
    setError(null);
    setNotice(null);
    setOpen(true);
  }

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/shares`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const body = (await response.json().catch(() => null)) as {
        shares?: ShareView[];
        message?: string;
        error?: string;
      } | null;

      if (!response.ok || !body?.shares) {
        throw new Error(body?.error ?? "Could not share the document.");
      }

      setShares(body.shares);
      // Deliberately generic: the API never confirms whether the email exists.
      setNotice(body.message ?? "If that account exists, access has been granted.");
      setEmail("");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not share the document.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(share: ShareView, nextRole: ShareRole) {
    if (nextRole === share.role) return;

    setBusyUserId(share.userId);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/shares`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: share.email, role: nextRole }),
      });
      const body = (await response.json().catch(() => null)) as {
        shares?: ShareView[];
        error?: string;
      } | null;

      if (!response.ok || !body?.shares) {
        throw new Error(body?.error ?? "Could not change that role.");
      }

      setShares(body.shares);
      setNotice(`${share.name} is now ${roleLabel(nextRole)}.`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not change that role.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function remove(share: ShareView) {
    setBusyUserId(share.userId);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/shares`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: share.userId }),
      });
      const body = (await response.json().catch(() => null)) as {
        shares?: ShareView[];
        error?: string;
      } | null;

      if (!response.ok || !body?.shares) {
        throw new Error(body?.error ?? "Could not remove that person.");
      }

      setShares(body.shares);
      setNotice(`Removed access for ${share.name}.`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not remove that person.",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
      >
        <ShareIcon className="h-4 w-4" />
        Share
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-dialog-title"
            className="w-full max-w-lg rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="share-dialog-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Share document
                </h2>
                <p className="mt-0.5 max-w-sm truncate text-xs text-slate-500">
                  {documentTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close share dialog"
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                  {initials(owner.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {owner.name}{" "}
                    <span className="font-normal text-slate-500">(you)</span>
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {owner.email}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                  Owner
                </span>
              </div>

              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  People with access
                </h3>

                {shares.length === 0 ? (
                  <p className="mt-2 rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500">
                    Only you have access so far.
                  </p>
                ) : (
                  <ul className="mt-1 divide-y divide-slate-100">
                    {shares.map((share) => (
                      <li
                        key={share.userId}
                        className="flex items-center gap-2.5 py-2.5"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                          {initials(share.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {share.name}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {share.email}
                          </p>
                        </div>
                        <select
                          aria-label={`Role for ${share.name}`}
                          value={share.role}
                          disabled={busyUserId === share.userId}
                          onChange={(event) =>
                            void changeRole(
                              share,
                              event.target.value as ShareRole,
                            )
                          }
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="EDITOR">Editor</option>
                        </select>
                        <button
                          type="button"
                          aria-label={`Remove ${share.name}`}
                          disabled={busyUserId === share.userId}
                          onClick={() => void remove(share)}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error ? (
                <div
                  role="alert"
                  className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {notice ? (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{notice}</span>
                </div>
              ) : null}
            </div>

            <form
              onSubmit={invite}
              className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:rounded-b-2xl sm:px-6"
            >
              <label
                htmlFor="invite-email"
                className="text-xs font-medium text-slate-700"
              >
                Invite by email
              </label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <input
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="bob@ajaia.test"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <select
                  aria-label="Role for the new collaborator"
                  value={role}
                  onChange={(event) => setRole(event.target.value as ShareRole)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                </select>
                <button
                  type="submit"
                  disabled={busy || !email.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "Inviting…" : "Invite"}
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                Editors can edit; viewers can read only. Enter the email they
                signed up with.
              </p>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
