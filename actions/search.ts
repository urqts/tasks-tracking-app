"use server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface SearchResults {
  tasks: { id: string; title: string; status: string }[];
  projects: { id: string; name: string; color: string }[];
  categories: { id: string; name: string; color: string }[];
  tags: { id: string; name: string; color: string }[];
}

/** Global search across tasks, projects, categories and tags for the user. */
export async function globalSearch(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (q.length < 1) {
    return { tasks: [], projects: [], categories: [], tags: [] };
  }
  const userId = await requireUserId();
  const contains = { contains: q, mode: "insensitive" as const };

  const [tasks, projects, categories, tags] = await Promise.all([
    prisma.task.findMany({
      where: { userId, deletedAt: null, OR: [{ title: contains }, { description: contains }] },
      select: { id: true, title: true, status: true },
      take: 6,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.findMany({
      where: { userId, deletedAt: null, name: contains },
      select: { id: true, name: true, color: true },
      take: 4,
    }),
    prisma.category.findMany({
      where: { userId, deletedAt: null, name: contains },
      select: { id: true, name: true, color: true },
      take: 4,
    }),
    prisma.tag.findMany({
      where: { userId, deletedAt: null, name: contains },
      select: { id: true, name: true, color: true },
      take: 4,
    }),
  ]);

  return { tasks, projects, categories, tags };
}
