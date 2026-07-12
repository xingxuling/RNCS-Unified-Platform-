import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export async function signUpEmail(input: { email: string; password: string; displayName: string }) {
  const redirectUrl = `${window.location.origin}/`;
  return supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: redirectUrl,
      data: { display_name: input.displayName },
    },
  });
}

export async function signInEmail(input: { email: string; password: string }) {
  return supabase.auth.signInWithPassword({ email: input.email, password: input.password });
}

export async function signInWithGoogle() {
  return lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
}

export async function signOut() {
  return supabase.auth.signOut();
}
