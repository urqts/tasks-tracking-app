"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema, tagSchema } from "@/lib/validations/task";
import type { ActionResult } from "@/types";

// ---- Categories ---------------------------------------------------------

export async function getCategories() {
  const userId = await requireUserId();
  return prisma.category.findMany({ where: { userId, deletedAt: null }, orderBy: { name: "asc" } });
}

export async function createCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const cat = await prisma.category.create({ data: { ...parsed.data, userId } });
    revalidatePath("/tasks");
    return { success: true, data: { id: cat.id } };
  } catch {
    return { success: false, error: "A category with that name already exists." };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  const res = await prisma.category.updateMany({ where: { id, userId, deletedAt: null }, data: { deletedAt: new Date() } });
  if (res.count === 0) return { success: false, error: "Category not found" };
  revalidatePath("/tasks");
  return { success: true, data: null };
}

// ---- Tags ---------------------------------------------------------------

export async function getTags() {
  const userId = await requireUserId();
  return prisma.tag.findMany({ where: { userId, deletedAt: null }, orderBy: { name: "asc" } });
}

export async function createTag(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = tagSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const tag = await prisma.tag.create({ data: { ...parsed.data, userId } });
    revalidatePath("/tasks");
    return { success: true, data: { id: tag.id } };
  } catch {
    return { success: false, error: "A tag with that name already exists." };
  }
}

export async function deleteTag(id: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  const res = await prisma.tag.updateMany({ where: { id, userId, deletedAt: null }, data: { deletedAt: new Date() } });
  if (res.count === 0) return { success: false, error: "Tag not found" };
  revalidatePath("/tasks");
  return { success: true, data: null };
}
