"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { IMPORT_ACCEPT, IMPORT_HINT, MAX_IMPORT_BYTES } from "@/lib/limits";
import { PlusIcon, UploadIcon } from "./icons";
import { useToast } from "./ToastProvider";

export default function DashboardActions() {
  const router = useRouter();
  const { show } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function createDocument() {
    setCreating(true);

    try {
      const response = await fetch("/api/documents", { method: "POST" });
      const body = (await response.json().catch(() => null)) as {
        document?: { id: string };
        error?: string;
      } | null;

      if (!response.ok || !body?.document) {
        throw new Error(body?.error ?? "Could not create the document.");
      }

      router.push(`/docs/${body.document.id}`);
    } catch (cause) {
      show(
        cause instanceof Error ? cause.message : "Could not create the document.",
        "error",
      );
      setCreating(false);
    }
  }

  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMPORT_BYTES) {
      show("That file is larger than 2 MB. Try a smaller file.", "error");
      event.target.value = "";
      return;
    }

    setUploading(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        body: form,
      });
      const body = (await response.json().catch(() => null)) as {
        id?: string;
        error?: string;
      } | null;

      if (!response.ok || !body?.id) {
        throw new Error(body?.error ?? "Could not import that file.");
      }

      router.push(`/docs/${body.id}`);
    } catch (cause) {
      show(
        cause instanceof Error ? cause.message : "Could not import that file.",
        "error",
      );
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="w-full sm:w-auto">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={createDocument}
          disabled={creating || uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusIcon className="h-4 w-4" />
          {creating ? "Creating…" : "New document"}
        </button>

        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={creating || uploading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UploadIcon className="h-4 w-4 text-slate-500" />
          {uploading ? "Importing…" : "Upload file"}
        </button>

        <input
          ref={fileInput}
          type="file"
          accept={IMPORT_ACCEPT}
          onChange={uploadFile}
          className="sr-only"
          aria-label="Upload a document to import"
        />
      </div>

      <p className="mt-2 text-xs text-slate-500 sm:text-right">{IMPORT_HINT}</p>
    </div>
  );
}
