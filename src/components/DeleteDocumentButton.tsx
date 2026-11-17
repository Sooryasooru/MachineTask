"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ConfirmDialog from "./ConfirmDialog";
import { TrashIcon } from "./icons";
import { useToast } from "./ToastProvider";

export default function DeleteDocumentButton({
  documentId,
  title,
}: {
  documentId: string;
  title: string;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        show(body?.error ?? "Could not delete the document.", "error");
        return;
      }

      setConfirming(false);
      show(`Deleted “${title}”.`, "success");
      router.refresh();
    } catch {
      show("Could not delete the document. Check your connection.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${title}`}
        className="relative z-10 rounded-md p-2 text-slate-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <TrashIcon className="h-4 w-4" />
      </button>

      <ConfirmDialog
        open={confirming}
        title={`Delete “${title}”?`}
        description="This permanently removes the document and everyone's access to it. This cannot be undone."
        confirmLabel="Delete document"
        busy={busy}
        onConfirm={() => void remove()}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
