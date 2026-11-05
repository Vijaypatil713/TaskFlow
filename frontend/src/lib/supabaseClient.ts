import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a safe client instance
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes('placeholder'))
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Initiates Google OAuth sign in via Supabase Auth
 */
export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error(
      'Supabase client is not fully configured. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local'
    );
  }

  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}` : '';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Signs out current Supabase session
 */
export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

