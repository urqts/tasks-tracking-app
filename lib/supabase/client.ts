import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Use this in Client Components for auth UI
 * and Storage uploads. Reads only public env vars.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
