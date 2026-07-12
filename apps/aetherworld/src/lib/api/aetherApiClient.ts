import { supabase } from "@/integrations/supabase/client";

async function currentWorkspaceId(): Promise<string | null> {
  const cached = typeof window !== "undefined" ? localStorage.getItem("aether.current-workspace") : null;
  if (cached) return cached;
  const { data } = await supabase.from("workspaces").select("id").order("created_at").limit(1).maybeSingle();
  if (data?.id && typeof window !== "undefined") localStorage.setItem("aether.current-workspace", data.id);
  return data?.id ?? null;
}

export const aetherApi = {
  currentWorkspaceId,

  workspaces: {
    list: () => supabase.from("workspaces").select("*").order("created_at"),
    create: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");
      return supabase.from("workspaces").insert({ name, user_id: user.id }).select().single();
    },
  },
  objects: {
    list: async () => {
      const ws = await currentWorkspaceId();
      if (!ws) return { data: [], error: null };
      return supabase.from("aether_objects").select("*").eq("workspace_id", ws).order("updated_at", { ascending: false });
    },
    create: async (payload: { object_type: string; title: string; summary?: string; data_json?: any; project_id?: string | null }) => {
      const ws = await currentWorkspaceId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!ws || !user) throw new Error("未登录或无工作区");
      return supabase.from("aether_objects").insert({ ...payload, workspace_id: ws, user_id: user.id }).select().single();
    },
  },
  chats: {
    listSessions: async () => {
      const ws = await currentWorkspaceId();
      if (!ws) return { data: [], error: null };
      return supabase.from("chat_sessions").select("*").eq("workspace_id", ws).order("updated_at", { ascending: false });
    },
    createSession: async (title?: string) => {
      const ws = await currentWorkspaceId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!ws || !user) throw new Error("未登录或无工作区");
      return supabase.from("chat_sessions").insert({ workspace_id: ws, user_id: user.id, title }).select().single();
    },
    listMessages: (sessionId: string) =>
      supabase.from("chat_messages").select("*").eq("session_id", sessionId).order("created_at"),
    sendMessage: async (sessionId: string, payload: { role: string; content?: string; message_type?: string; data_json?: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");
      return supabase.from("chat_messages").insert({ session_id: sessionId, user_id: user.id, ...payload }).select().single();
    },
  },
  runs: {
    list: async () => {
      const ws = await currentWorkspaceId();
      if (!ws) return { data: [], error: null };
      return supabase.from("runs").select("*").eq("workspace_id", ws).order("created_at", { ascending: false });
    },
    create: async (payload: { run_type: string; title?: string; input_json?: any }) => {
      const ws = await currentWorkspaceId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!ws || !user) throw new Error("未登录或无工作区");
      return supabase.from("runs").insert({ ...payload, workspace_id: ws, user_id: user.id, status: "PENDING" }).select().single();
    },
  },
  webxxm: {
    list: async () => {
      const ws = await currentWorkspaceId();
      if (!ws) return { data: [], error: null };
      return supabase.from("webxxm_packages").select("*").eq("workspace_id", ws);
    },
    upsert: async (pkg: { package_id: string; name: string; status: string; capability_id?: string; version?: string; manifest_json?: any }) => {
      const ws = await currentWorkspaceId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!ws || !user) throw new Error("未登录或无工作区");
      return supabase.from("webxxm_packages").upsert({ ...pkg, workspace_id: ws, user_id: user.id }, { onConflict: "workspace_id,package_id" }).select().single();
    },
  },
  modelStates: {
    list: async () => {
      const ws = await currentWorkspaceId();
      if (!ws) return { data: [], error: null };
      return supabase.from("model_states").select("*").eq("workspace_id", ws);
    },
    upsert: async (m: { model_type: string; model_name?: string; status: string; config_json?: any }) => {
      const ws = await currentWorkspaceId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!ws || !user) throw new Error("未登录或无工作区");
      return supabase.from("model_states").upsert({ ...m, workspace_id: ws, user_id: user.id }, { onConflict: "workspace_id,model_type" }).select().single();
    },
  },
};
