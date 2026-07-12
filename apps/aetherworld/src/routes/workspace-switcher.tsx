import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace-switcher")({
  head: () => ({ meta: [{ title: "切换工作区 · Aetherworld" }] }),
  component: () => {
    const { user } = useAuth();
    const [items, setItems] = useState<{ id: string; name: string }[]>([]);
    const [name, setName] = useState("");
    const load = () => supabase.from("workspaces").select("id,name").order("created_at").then(({ data }) => setItems((data ?? []) as any));
    useEffect(() => { if (user) load(); }, [user]);

    const create = async () => {
      if (!name.trim() || !user) return;
      const { error } = await supabase.from("workspaces").insert({ name: name.trim(), user_id: user.id });
      if (error) return toast.error(error.message);
      setName(""); load(); toast.success("已创建");
    };

    if (!user) return <div className="p-6 text-sm">请先 <Link to="/login" className="underline">登录</Link>。</div>;
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-5">
        <h1 className="text-xl font-display">切换工作区</h1>
        <ul className="space-y-2">
          {items.map((w) => (
            <li key={w.id} className="aether-card p-3 flex items-center justify-between">
              <span>{w.name}</span>
              <button onClick={() => { localStorage.setItem("aether.current-workspace", w.id); toast.success("已切换"); }}
                className="px-3 py-1.5 rounded-md border border-border/40 text-xs">选为当前</button>
            </li>
          ))}
        </ul>
        <div className="aether-card p-3 space-y-2">
          <div className="text-sm font-medium">新建工作区</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="工作区名称"
            className="w-full bg-transparent border border-border/40 rounded-md px-3 py-2 text-sm" />
          <button onClick={create} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs">创建</button>
        </div>
      </div>
    );
  },
});
