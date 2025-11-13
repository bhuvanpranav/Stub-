// src/integrations/supabase/client.ts
// Patched: safe supabase client factory for environments where `window` or localStorage may be unavailable.
// TypeScript types are relaxed here (using `any`) to avoid generic mismatches with project-specific Supabase types.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL
    ? (import.meta as any).env.VITE_SUPABASE_URL
    : typeof process !== "undefined"
    ? process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    : undefined;

const SUPABASE_PUBLISHABLE_KEY =
  typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY
    ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY
    : typeof process !== "undefined"
    ? process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    : undefined;

if (!SUPABASE_URL) {
  // Log once for developer visibility — do not throw so app can run in mock mode for dev.
  // console.error("❌ Missing VITE_SUPABASE_URL. Check your .env file location.");
}

// Use `any` here to avoid strict generic mismatches between different supabase-js typings in the repo
let client: any | null = null;

/**
 * Returns a supabase client instance. Only creates it when running in the browser
 * because this code references localStorage for session persistence.
 *
 * If env vars are missing, a tiny mock client is returned so the app won't crash
 * while you develop other flows.
 */
export function getSupabaseClient(): any {
  if (client) return client;

  // If necessary vars are missing, return a very small mock implementation
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.warn(
      "Using mock Supabase client because VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing."
    );

    // Minimal mock surface used by the app. Extend this if your app calls more Supabase features.
    client = {
      from: (tableName: string) => ({
        select: async (q?: any) => ({ data: [], error: null }),
        insert: async (payload: any) => ({ data: payload ? [payload] : [], error: null }),
        update: async (payload: any) => ({ data: payload ? [payload] : [], error: null }),
        delete: async () => ({ data: [], error: null }),
      }),
      auth: {
        signInWithOtp: async (opts: any) => ({ data: null, error: null }),
        signInWithPassword: async (opts: any) => ({ data: null, error: null }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: null, error: null }),
      },
      storage: {
        from: () => ({ upload: async () => ({ error: null }) }),
      },
    } as any;

    return client;
  }

  // Use browser storage only when window.localStorage exists
  const storage =
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
      ? window.localStorage
      : undefined;

  // createClient will return a SupabaseClient with specific generics,
  // but we intentionally store it in an `any`-typed variable to avoid type incompatibility across the repo.
  client = createClient<any>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: storage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return client;
}

// default export a live client if possible (keeps compatibility with existing imports)
let defaultExport: any = null;
try {
  defaultExport = getSupabaseClient();
} catch (e) {
  // Fallback: return mock if something unexpected happens
  defaultExport = {
    from: () => ({ select: async () => ({ data: [], error: null }) }),
    auth: { signInWithOtp: async () => ({ data: null, error: null }) },
  } as any;
}

export default defaultExport;
