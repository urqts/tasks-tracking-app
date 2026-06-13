"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "attachments";

/**
 * Persists attachment metadata after the file itself has been uploaded to
 * Supabase Storage from the client. Keeping the binary upload on the client
 * avoids round-tripping large files through a Server Action.
 */
export async function registerAttachment(input: {
  taskId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
}): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const task = await prisma.task.findFirst({ where: { id: input.taskId, userId, deletedAt: null } });
  if (!task) return { success: false, error: "Task not found" };

  const att = await prisma.attachment.create({ data: { ...input, userId } });
  revalidatePath("/tasks");
  return { success: true, data: { id: att.id } };
}

/** Returns a short-lived signed URL for downloading/previewing an attachment. */
export async function getAttachmentUrl(id: string): Promise<ActionResult<{ url: string }>> {
  const userId = await requireUserId();
  const att = await prisma.attachment.findFirst({ where: { id, userId, deletedAt: null } });
  if (!att) return { success: false, error: "Attachment not found" };

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(att.storagePath, 60 * 10);
  if (error || !data) return { success: false, error: "Could not generate download link" };
  return { success: true, data: { url: data.signedUrl } };
}

export async function deleteAttachment(id: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  const att = await prisma.attachment.findFirst({ where: { id, userId, deletedAt: null } });
  if (!att) return { success: false, error: "Attachment not found" };

  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove([att.storagePath]);
  await prisma.attachment.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/tasks");
  return { success: true, data: null };
}
