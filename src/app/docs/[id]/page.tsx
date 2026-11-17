import { notFound, redirect } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import DocumentEditor from "@/components/DocumentEditor";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAccess } from "@/lib/documents";
import type { ShareView } from "@/lib/types";

type DocumentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/docs/${id}`)}`);
  }

  const access = await getAccess(user.id, id);
  // Missing document and missing permission are indistinguishable on purpose.
  if (!access) notFound();

  const document = await db.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      owner: { select: { id: true, name: true, email: true } },
      shares: {
        orderBy: { user: { name: "asc" } },
        select: {
          userId: true,
          role: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!document) notFound();

  const shares: ShareView[] = document.shares.map((share) => ({
    userId: share.userId,
    name: share.user.name,
    email: share.user.email,
    role: share.role,
  }));

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />
      <DocumentEditor
        documentId={document.id}
        initialTitle={document.title}
        initialContent={document.content}
        access={access}
        owner={document.owner}
        initialShares={shares}
      />
    </div>
  );
}
