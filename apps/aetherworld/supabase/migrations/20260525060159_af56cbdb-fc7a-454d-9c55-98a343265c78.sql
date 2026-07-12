
-- 1. 角色：新增 founder
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'founder') THEN
    ALTER TYPE public.app_role ADD VALUE 'founder';
  END IF;
END $$;

-- 2. is_founder helper
CREATE OR REPLACE FUNCTION public.is_founder(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'founder')
$$;

-- 3. social_profiles
CREATE TABLE IF NOT EXISTS public.social_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles public read" ON public.social_profiles FOR SELECT USING (true);
CREATE POLICY "profiles self insert" ON public.social_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles self update" ON public.social_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles self delete" ON public.social_profiles FOR DELETE USING (auth.uid() = user_id);

-- 4. social_posts
CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  post_type text NOT NULL DEFAULT 'GENERAL',
  visibility text NOT NULL DEFAULT 'PRIVATE',
  linked_object_id text,
  linked_object_type text,
  qa_status text NOT NULL DEFAULT 'PASS',
  qa_notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  allow_comments boolean NOT NULL DEFAULT true,
  allow_remix boolean NOT NULL DEFAULT false,
  allow_store_link boolean NOT NULL DEFAULT false,
  store_item_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT social_posts_visibility_chk CHECK (visibility IN ('PRIVATE','UNLISTED','PUBLIC','FOUNDER_ONLY')),
  CONSTRAINT social_posts_qa_chk CHECK (qa_status IN ('PASS','WARN','BLOCKED'))
);
CREATE INDEX IF NOT EXISTS social_posts_author_idx ON public.social_posts(author_user_id);
CREATE INDEX IF NOT EXISTS social_posts_visibility_idx ON public.social_posts(visibility);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
-- 读：本人 / PUBLIC / UNLISTED（链接访问亦走 SELECT，应用层负责凭链接定位）/ FOUNDER_ONLY 仅 founder
CREATE POLICY "posts read scope" ON public.social_posts FOR SELECT USING (
  author_user_id = auth.uid()
  OR (visibility = 'PUBLIC' AND qa_status <> 'BLOCKED')
  OR (visibility = 'UNLISTED' AND qa_status <> 'BLOCKED')
  OR (visibility = 'FOUNDER_ONLY' AND public.is_founder(auth.uid()))
);
CREATE POLICY "posts self insert" ON public.social_posts FOR INSERT WITH CHECK (auth.uid() = author_user_id);
CREATE POLICY "posts self update" ON public.social_posts FOR UPDATE USING (auth.uid() = author_user_id);
CREATE POLICY "posts self delete" ON public.social_posts FOR DELETE USING (auth.uid() = author_user_id);

-- 5. social_reactions
CREATE TABLE IF NOT EXISTS public.social_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'LIKE',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type),
  CONSTRAINT reactions_type_chk CHECK (reaction_type IN ('LIKE','BOOKMARK'))
);
ALTER TABLE public.social_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions read visible posts" ON public.social_reactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.social_posts p WHERE p.id = post_id AND (
    p.author_user_id = auth.uid()
    OR (p.visibility IN ('PUBLIC','UNLISTED') AND p.qa_status <> 'BLOCKED')
    OR (p.visibility = 'FOUNDER_ONLY' AND public.is_founder(auth.uid()))
  ))
);
CREATE POLICY "reactions self insert" ON public.social_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions self delete" ON public.social_reactions FOR DELETE USING (auth.uid() = user_id);

-- 6. social_comments
CREATE TABLE IF NOT EXISTS public.social_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_comment_id uuid REFERENCES public.social_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments read visible posts" ON public.social_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.social_posts p WHERE p.id = post_id AND (
    p.author_user_id = auth.uid()
    OR (p.visibility IN ('PUBLIC','UNLISTED') AND p.qa_status <> 'BLOCKED')
    OR (p.visibility = 'FOUNDER_ONLY' AND public.is_founder(auth.uid()))
  ))
);
CREATE POLICY "comments self insert" ON public.social_comments FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.social_posts p WHERE p.id = post_id AND p.allow_comments = true)
);
CREATE POLICY "comments self update" ON public.social_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "comments self delete" ON public.social_comments FOR DELETE USING (auth.uid() = user_id);

-- 7. social_collections
CREATE TABLE IF NOT EXISTS public.social_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  post_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections read scope" ON public.social_collections FOR SELECT USING (
  owner_user_id = auth.uid() OR is_public = true
);
CREATE POLICY "collections self insert" ON public.social_collections FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "collections self update" ON public.social_collections FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "collections self delete" ON public.social_collections FOR DELETE USING (auth.uid() = owner_user_id);

-- 8. social_publish_audits
CREATE TABLE IF NOT EXISTS public.social_publish_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid,
  linked_object_id text,
  visibility text NOT NULL,
  action text NOT NULL,
  qa_status text NOT NULL DEFAULT 'PASS',
  safety_status text NOT NULL DEFAULT 'PASS',
  blocked_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audits_action_chk CHECK (action IN ('CREATE','UPDATE','PUBLISH','UNPUBLISH','BLOCK')),
  CONSTRAINT audits_visibility_chk CHECK (visibility IN ('PRIVATE','UNLISTED','PUBLIC','FOUNDER_ONLY')),
  CONSTRAINT audits_safety_chk CHECK (safety_status IN ('PASS','WARN','BLOCK'))
);
ALTER TABLE public.social_publish_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audits self read" ON public.social_publish_audits FOR SELECT USING (
  auth.uid() = user_id OR public.is_founder(auth.uid())
);
CREATE POLICY "audits self insert" ON public.social_publish_audits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. updated_at triggers
DROP TRIGGER IF EXISTS social_profiles_touch ON public.social_profiles;
CREATE TRIGGER social_profiles_touch BEFORE UPDATE ON public.social_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS social_posts_touch ON public.social_posts;
CREATE TRIGGER social_posts_touch BEFORE UPDATE ON public.social_posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS social_comments_touch ON public.social_comments;
CREATE TRIGGER social_comments_touch BEFORE UPDATE ON public.social_comments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS social_collections_touch ON public.social_collections;
CREATE TRIGGER social_collections_touch BEFORE UPDATE ON public.social_collections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
