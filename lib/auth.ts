import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Returns the authenticated Supabase user, or null. Cached per-request so
 * multiple Server Components don't each hit Supabase.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Ensures a corresponding row exists in our `users` table for the Supabase
 * auth user, then returns the app user id. Call this after login.
 */
export const ensureUser = cache(async () => {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const user = await prisma.user.upsert({
    where: { id: authUser.id },
    update: {
      email: authUser.email ?? "",
      emailVerified: authUser.email_confirmed_at
        ? new Date(authUser.email_confirmed_at)
        : null,
    },
    create: {
      id: authUser.id,
      email: authUser.email ?? "",
      name: (authUser.user_metadata?.name as string) ?? null,
      emailVerified: authUser.email_confirmed_at
        ? new Date(authUser.email_confirmed_at)
        : null,
      settings: { create: {} },
    },
  });

  return user;
});

/**
 * Guard for protected pages and server actions. Redirects to /login when there
 * is no session, otherwise returns the app user id (guaranteed to exist).
 */
export async function requireUser() {
  const user = await ensureUser();
  if (!user) redirect("/login");
  return user;
}

/** Like requireUser but returns just the id, for terse action code. */
export async function requireUserId() {
  const user = await requireUser();
  return user.id;
}
