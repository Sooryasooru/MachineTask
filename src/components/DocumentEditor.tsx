"use client";

import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { canEdit as canEditAccess } from "@/lib/access";
import type { AccessLevel, ShareView } from "@/lib/types";
import {
  AlertIcon,
  ArrowLeftIcon,
  CheckIcon,
  LockIcon,
} from "./icons";
import ShareDialog from "./ShareDialog";

type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

type DocumentEditorProps = {
  documentId: string;
  initialTitle: string;
  initialContent: string;
  access: AccessLevel;
  owner: { id: string; name: string; email: string };
  initialShares: ShareView[];
};

const accessBadgeStyles: Record<AccessLevel, string> = {
  OWNER: "bg-slate-100 text-slate-600 ring-slate-200",
  EDITOR: "bg-blue-50 text-blue-700 ring-blue-200",
  VIEWER: "bg-amber-50 text-amber-700 ring-amber-200",
};

const accessLabels: Record<AccessLevel, string> = {
  OWNER: "Owner",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

function SaveIndicator({
  status,
  savedAt,
  onRetry,
}: {
  status: SaveStatus;
  savedAt: string | null;
  onRetry: () => void;
}) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        Saving…
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <CheckIcon className="h-3.5 w-3.5" />
        {savedAt ? `Saved ${savedAt}` : "Saved"}
      </span>
    );
  }

  if (status === "unsaved") {
    return (
      <span className="text-xs font-medium text-slate-500">
        Unsaved changes
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
        <AlertIcon className="h-3.5 w-3.5" />
        Couldn&apos;t save
        <button
          type="button"
          onClick={onRetry}
          className="underline underline-offset-2 hover:text-red-700"
        >
          Retry
        </button>
      </span>
    );
  }

  return null;
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      underline: editor?.isActive("underline") ?? false,
      h1: editor?.isActive("heading", { level: 1 }) ?? false,
      h2: editor?.isActive("heading", { level: 2 }) ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
    }),
  });

  const base =
    "grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
  const idle = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
  const active = "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";

  const buttonClass = (isActive: boolean) =>
    `${base} ${isActive ? active : idle}`;

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-3 py-2 sm:px-6"
    >
      <button
        type="button"
        aria-label="Bold"
        aria-pressed={state?.bold ?? false}
        title="Bold (Ctrl/Cmd+B)"
        disabled={!editor}
        onClick={() => editor?.chain().focus().toggleBold().run()}
        className={`${buttonClass(state?.bold ?? false)} font-bold`}
      >
        B
      </button>
      <button
        type="button"
        aria-label="Italic"
        aria-pressed={state?.italic ?? false}
        title="Italic (Ctrl/Cmd+I)"
        disabled={!editor}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        className={`${buttonClass(state?.italic ?? false)} italic`}
      >
        I
      </button>
      <button
        type="button"
        aria-label="Underline"
        aria-pressed={state?.underline ?? false}
        title="Underline (Ctrl/Cmd+U)"
        disabled={!editor}
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
        className={`${buttonClass(state?.underline ?? false)} underline`}
      >
        U
      </button>

      <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />

      <button
        type="button"
        aria-label="Heading 1"
        aria-pressed={state?.h1 ?? false}
        title="Heading 1"
        disabled={!editor}
        onClick={() =>
          editor?.chain().focus().toggleHeading({ level: 1 }).run()
        }
        className={buttonClass(state?.h1 ?? false)}
      >
        H1
      </button>
      <button
        type="button"
        aria-label="Heading 2"
        aria-pressed={state?.h2 ?? false}
        title="Heading 2"
        disabled={!editor}
        onClick={() =>
          editor?.chain().focus().toggleHeading({ level: 2 }).run()
        }
        className={buttonClass(state?.h2 ?? false)}
      >
        H2
      </button>

      <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />

      <button
        type="button"
        aria-label="Bullet list"
        aria-pressed={state?.bulletList ?? false}
        title="Bullet list"
        disabled={!editor}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        className={`${buttonClass(state?.bulletList ?? false)} gap-1`}
      >
        • List
      </button>
      <button
        type="button"
        aria-label="Numbered list"
        aria-pressed={state?.orderedList ?? false}
        title="Numbered list"
        disabled={!editor}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        className={`${buttonClass(state?.orderedList ?? false)} gap-1`}
      >
        1. List
      </button>
    </div>
  );
}

export default function DocumentEditor({
  documentId,
  initialTitle,
  initialContent,
  access,
  owner,
  initialShares,
}: DocumentEditorProps) {
  const editable = canEditAccess(access);
  const isOwner = access === "OWNER";

  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const serverTitleRef = useRef(initialTitle);
  const pendingRef = useRef<{ title?: string; content?: string }>({});
  const savingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async () => {
    if (!editable || savingRef.current) return;

    savingRef.current = true;
    let savedAny = false;
    let failed = false;

    try {
      // Drain the queue so edits made mid-request are saved immediately after.
      while (true) {
        const patch = pendingRef.current;
        if (patch.title === undefined && patch.content === undefined) break;

        pendingRef.current = {};
        setStatus("saving");

        try {
          const response = await fetch(`/api/documents/${documentId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(patch),
          });
          const body = (await response.json().catch(() => null)) as {
            document?: { title: string };
            error?: string;
          } | null;

          if (!response.ok) {
            throw new Error(body?.error ?? "Could not save changes.");
          }

          if (body?.document?.title) {
            serverTitleRef.current = body.document.title;
          }

          setSavedAt(
            new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date()),
          );
          savedAny = true;
        } catch {
          // Keep the failed payload so Retry resends it without losing newer edits.
          pendingRef.current = {
            title: pendingRef.current.title ?? patch.title,
            content: pendingRef.current.content ?? patch.content,
          };
          failed = true;
          break;
        }
      }
    } finally {
      savingRef.current = false;
    }

    if (failed) setStatus("error");
    else if (savedAny) setStatus("saved");
  }, [documentId, editable]);

  const queueContent = useCallback(
    (html: string) => {
      if (!editable) return;
      pendingRef.current.content = html;
      setStatus("unsaved");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void save();
      }, 800);
    },
    [editable, save],
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || "<p></p>",
    editable,
    // Required for server rendering: the editor mounts on the client only.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "doc-content",
        "aria-label": "Document content",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor: instance }) => queueContent(instance.getHTML()),
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (status === "unsaved" || status === "saving") {
        event.preventDefault();
        event.returnValue = "";
      }
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [status]);

  function commitTitle() {
    if (!editable) return;

    const next = title.trim();
    if (!next) {
      setTitle(serverTitleRef.current);
      return;
    }

    if (next === serverTitleRef.current) {
      setTitle(next);
      return;
    }

    pendingRef.current.title = next;
    setTitle(next);
    setStatus("unsaved");

    if (timerRef.current) clearTimeout(timerRef.current);
    void save();
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Documents
          </Link>

          <div className="ml-auto flex items-center gap-2.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${accessBadgeStyles[access]}`}
            >
              {accessLabels[access]}
            </span>

            <span className="min-w-[7rem] text-right">
              {editable ? (
                <SaveIndicator
                  status={status}
                  savedAt={savedAt}
                  onRetry={() => void save()}
                />
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <LockIcon className="h-3.5 w-3.5" />
                  View only
                </span>
              )}
            </span>

            {isOwner ? (
              <ShareDialog
                documentId={documentId}
                documentTitle={title}
                owner={owner}
                initialShares={initialShares}
              />
            ) : null}
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {!editable ? (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
            <LockIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <span className="font-semibold">View only.</span> {owner.name}{" "}
              shared this document with you as a Viewer, so the editor is
              read-only.
            </p>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 pb-5 pt-7 sm:px-10 sm:pt-9">
            <label htmlFor="document-title" className="sr-only">
              Document title
            </label>
            {editable ? (
              <input
                id="document-title"
                value={title}
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={commitTitle}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                }}
                placeholder="Untitled document"
                className="w-full rounded-md bg-transparent text-[26px] font-semibold leading-tight tracking-tight text-slate-900 outline-none placeholder:text-slate-300 focus-visible:bg-slate-50/70 focus-visible:ring-2 focus-visible:ring-blue-100 sm:text-[30px]"
              />
            ) : (
              <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-[30px]">
                {title}
              </h1>
            )}

            <p className="mt-2 text-xs text-slate-500">
              {owner.name} · {accessLabels[access]} ·{" "}
              {editable ? "Autosaves as you type" : "Read only"}
            </p>
          </div>

          {editable ? <EditorToolbar editor={editor} /> : null}

          <div className="px-6 py-6 sm:px-10 sm:py-8">
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>
    </>
  );
}
