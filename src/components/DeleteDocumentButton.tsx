"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { TrashIcon } from "./icons";

export default function DeleteDocumentButton({
  documentId,
  title,
}: {
  documentId: string;
  title: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;

    setBusy(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        window.alert(body?.error ?? "Could not delete the document.");
        return;
      }

      router.refresh();
    } catch {
      window.alert("Could not delete the document. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      aria-label={`Delete ${title}`}
      className="relative z-10 rounded-md p-2 text-slate-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}
