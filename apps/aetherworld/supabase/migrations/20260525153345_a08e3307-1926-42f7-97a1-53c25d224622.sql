
-- 1) social_comments UPDATE policy: add WITH CHECK to prevent moving comments to invisible / closed posts
DROP POLICY IF EXISTS "comments self update" ON public.social_comments;
CREATE POLICY "comments self update"
ON public.social_comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.social_posts p
    WHERE p.id = social_comments.post_id
      AND p.allow_comments = true
      AND (
        p.author_user_id = auth.uid()
        OR (p.visibility = ANY (ARRAY['PUBLIC'::text, 'UNLISTED'::text]) AND p.qa_status <> 'BLOCKED')
        OR (p.visibility = 'FOUNDER_ONLY' AND public.is_founder(auth.uid()))
      )
  )
);

-- 2) Harden is_founder(): always use auth.uid(), ignore the caller-supplied argument
CREATE OR REPLACE FUNCTION public.is_founder(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'founder'
  )
$function$;

-- 3) Revoke public EXECUTE on trigger-only function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
