"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validations/task";
import type { ActionResult } from "@/types";

export async function getSettings() {
  const userId = await requireUserId();
  return prisma.settings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function updateSettings(input: unknown): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };

  await prisma.settings.upsert({
    where: { userId },
    update: parsed.data,
    create: { userId, ...parsed.data },
  });

  revalidatePath("/settings");
  return { success: true, data: null };
}

export async function updateProfile(name: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { name } });
  revalidatePath("/settings");
  return { success: true, data: null };
}
