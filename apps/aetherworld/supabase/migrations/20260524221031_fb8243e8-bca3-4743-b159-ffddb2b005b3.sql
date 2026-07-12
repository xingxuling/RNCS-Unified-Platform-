-- Fix function_search_path on touch_updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin new.updated_at := now(); return new; end; $$;

-- Revoke broad EXECUTE on SECURITY DEFINER helper functions (only triggers / RLS need them)
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.owns_workspace(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;