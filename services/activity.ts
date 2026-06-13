import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ActivityAction } from "@prisma/client";

/**
 * Records an entry in the activity log. Best-effort: failures here must never
 * break the primary mutation, so we swallow errors.
 */
export async function logActivity(
  userId: string,
  action: ActivityAction,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch {
    // ignore logging failures
  }
}
