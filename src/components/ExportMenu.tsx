"use client";

import { useEffect, useRef, useState } from "react";

import { ChevronDownIcon, DownloadIcon, PrinterIcon } from "./icons";

export default function ExportMenu({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointerDown(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={wrapper} className="relative no-print">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <DownloadIcon className="h-4 w-4 text-slate-500" />
        Export
        <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Export options"
          className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <a
            role="menuitem"
            href={`/api/documents/${documentId}/export`}
            download
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <DownloadIcon className="h-4 w-4 text-slate-400" />
            Markdown (.md)
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              window.print();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <PrinterIcon className="h-4 w-4 text-slate-400" />
            Print / Save as PDF
          </button>
        </div>
      ) : null}
    </div>
  );
}
