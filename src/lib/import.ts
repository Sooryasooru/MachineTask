import mammoth from "mammoth";
import { marked } from "marked";

import { MAX_IMPORT_BYTES } from "./limits";
import { sanitizeDocumentHtml } from "./sanitize";

export { MAX_IMPORT_BYTES };

export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export function getExtension(filename: string): string {
  const base = filename.replace(/^.*[\\/]/, "");
  const dot = base.lastIndexOf(".");
  return dot === -1 ? "" : base.slice(dot).toLowerCase();
}

export function isSupportedExtension(ext: string): ext is SupportedExtension {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
}

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/^.*[\\/]/, "");
  const dot = base.lastIndexOf(".");
  const raw = (dot > 0 ? base.slice(0, dot) : base).trim();
  return (raw || "Imported document").slice(0, 200);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Plain text becomes one <p> per blank-line-separated block, with single
 * newlines preserved as <br />. Text is escaped *before* any tags are added.
 */
export function plainTextToHtml(text: string): string {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const html = await marked.parse(markdown, { async: false, gfm: true });
  return sanitizeDocumentHtml(html);
}

export async function convertFileToHtml(
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const extension = getExtension(filename);

  if (!isSupportedExtension(extension)) {
    throw new Error(
      `Unsupported file type: ${extension || "unknown"}. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`,
    );
  }

  if (extension === ".docx") {
    const { value } = await mammoth.convertToHtml({ buffer });
    return sanitizeDocumentHtml(value);
  }

  const text = buffer.toString("utf8");
  if (extension === ".md") {
    return markdownToHtml(text);
  }

  return sanitizeDocumentHtml(plainTextToHtml(text));
}
