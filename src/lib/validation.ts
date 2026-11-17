import { z } from "zod";

export const TITLE_MAX_LENGTH = 200;
export const MAX_CONTENT_LENGTH = 1_000_000; // ~1 MB of HTML

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title can't be empty.")
  .max(
    TITLE_MAX_LENGTH,
    `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`,
  );

export const contentSchema = z
  .string()
  .max(MAX_CONTENT_LENGTH, "Document is too large to save (1 MB limit).");

export const updateDocumentSchema = z
  .object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
  })
  .refine(
    (value) => value.title !== undefined || value.content !== undefined,
    { message: "Nothing to update." },
  );

export const shareRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  role: z.enum(["EDITOR", "VIEWER"]),
});

export const revokeShareSchema = z.object({
  userId: z.string().min(1),
});

export const loginSchema = z.object({
  userId: z.string().min(1),
});
