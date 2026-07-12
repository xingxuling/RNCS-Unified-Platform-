-- ========= ROLES =========
create type public.app_role as enum ('normal_user', 'advanced_user', 'founder', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'normal_user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ========= WORKSPACES =========
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  visibility text not null default 'PRIVATE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.workspaces enable row level security;
create index workspaces_user_id_idx on public.workspaces(user_id);

-- ========= PROJECTS =========
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  project_type text,
  description text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;
create index projects_workspace_idx on public.projects(workspace_id);

-- ========= AETHER OBJECTS =========
create table public.aether_objects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  object_type text not null,
  title text not null,
  summary text,
  data_json jsonb not null default '{}'::jsonb,
  qa_status text,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.aether_objects enable row level security;
create index aether_objects_workspace_idx on public.aether_objects(workspace_id);

-- ========= CHAT =========
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.chat_sessions enable row level security;
create index chat_sessions_workspace_idx on public.chat_sessions(workspace_id);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  message_type text not null default 'TEXT',
  content text,
  data_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
create index chat_messages_session_idx on public.chat_messages(session_id);

-- ========= RUNS =========
create table public.runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  run_type text not null,
  status text not null default 'PENDING',
  title text,
  summary text,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  qa_status text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.runs enable row level security;
create index runs_workspace_idx on public.runs(workspace_id);

-- ========= WEBXXM PACKAGES =========
create table public.webxxm_packages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id text not null,
  capability_id text,
  name text not null,
  version text,
  status text not null default 'AVAILABLE',
  manifest_json jsonb not null default '{}'::jsonb,
  installed_at timestamptz,
  enabled_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (workspace_id, package_id)
);
alter table public.webxxm_packages enable row level security;

-- ========= MODEL STATES =========
create table public.model_states (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  model_type text not null,
  model_name text,
  status text not null default 'NOT_INITIALIZED',
  config_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (workspace_id, model_type)
);
alter table public.model_states enable row level security;

-- ========= QA REPORTS =========
create table public.qa_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  object_id uuid references public.aether_objects(id) on delete cascade,
  run_id uuid references public.runs(id) on delete cascade,
  status text not null,
  issues_json jsonb not null default '[]'::jsonb,
  recommended_fixes_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.qa_reports enable row level security;

-- ========= VERSION RECORDS =========
create table public.version_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id uuid,
  version int not null,
  change_type text not null,
  summary text,
  data_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.version_records enable row level security;

-- ========= AUDIT LOGS =========
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  risk_level text not null default 'LOW',
  status text not null default 'OK',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
create index audit_logs_user_idx on public.audit_logs(user_id);

-- ========= SETTINGS =========
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);
alter table public.settings enable row level security;

-- ========= RLS POLICIES =========
-- profiles
create policy "profiles self read" on public.profiles for select using (auth.uid() = id);
create policy "profiles self upsert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

-- user_roles (read own only; writes via trigger or admin)
create policy "user_roles self read" on public.user_roles for select using (auth.uid() = user_id);

-- workspaces
create policy "ws self all" on public.workspaces for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- helper: is owner of workspace
create or replace function public.owns_workspace(_ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspaces w where w.id = _ws and w.user_id = auth.uid())
$$;

-- generic per-workspace policy template applied below
create policy "projects ws scope" on public.projects for all using (public.owns_workspace(workspace_id)) with check (public.owns_workspace(workspace_id) and auth.uid() = user_id);
create policy "objects ws scope" on public.aether_objects for all using (public.owns_workspace(workspace_id)) with check (public.owns_workspace(workspace_id) and auth.uid() = user_id);
create policy "chat_sessions ws scope" on public.chat_sessions for all using (public.owns_workspace(workspace_id)) with check (public.owns_workspace(workspace_id) and auth.uid() = user_id);
create policy "chat_messages session scope" on public.chat_messages for all using (
  exists (select 1 from public.chat_sessions s where s.id = session_id and public.owns_workspace(s.workspace_id))
) with check (
  exists (select 1 from public.chat_sessions s where s.id = session_id and public.owns_workspace(s.workspace_id)) and auth.uid() = user_id
);
create policy "runs ws scope" on public.runs for all using (public.owns_workspace(workspace_id)) with check (public.owns_workspace(workspace_id) and auth.uid() = user_id);
create policy "webxxm ws scope" on public.webxxm_packages for all using (public.owns_workspace(workspace_id)) with check (public.owns_workspace(workspace_id) and auth.uid() = user_id);
create policy "model_states ws scope" on public.model_states for all using (public.owns_workspace(workspace_id)) with check (public.owns_workspace(workspace_id) and auth.uid() = user_id);
create policy "qa ws scope" on public.qa_reports for all using (public.owns_workspace(workspace_id)) with check (public.owns_workspace(workspace_id) and auth.uid() = user_id);
create policy "versions ws scope" on public.version_records for all using (public.owns_workspace(workspace_id)) with check (public.owns_workspace(workspace_id) and auth.uid() = user_id);
create policy "settings self" on public.settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- audit logs: user can read own; insert allowed for own rows
create policy "audit self read" on public.audit_logs for select using (auth.uid() = user_id);
create policy "audit self insert" on public.audit_logs for insert with check (auth.uid() = user_id);

-- ========= TRIGGERS =========
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_ws uuid;
begin
  insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
    on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
    values (new.id, 'normal_user')
    on conflict do nothing;

  insert into public.workspaces (user_id, name, description, visibility)
    values (new.id, '我的工作区', '默认工作区', 'PRIVATE')
    returning id into v_ws;

  insert into public.audit_logs (workspace_id, user_id, action, target_type, target_id, risk_level, status, metadata_json)
    values (v_ws, new.id, 'register', 'user', new.id, 'LOW', 'OK', jsonb_build_object('email', new.email));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

create trigger trg_profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger trg_workspaces_touch before update on public.workspaces for each row execute function public.touch_updated_at();
create trigger trg_projects_touch before update on public.projects for each row execute function public.touch_updated_at();
create trigger trg_objects_touch before update on public.aether_objects for each row execute function public.touch_updated_at();
create trigger trg_sessions_touch before update on public.chat_sessions for each row execute function public.touch_updated_at();
create trigger trg_webxxm_touch before update on public.webxxm_packages for each row execute function public.touch_updated_at();
create trigger trg_models_touch before update on public.model_states for each row execute function public.touch_updated_at();
create trigger trg_settings_touch before update on public.settings for each row execute function public.touch_updated_at();