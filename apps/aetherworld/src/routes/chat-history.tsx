import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listSessions, deleteSession, renameSession, subscribeSessions } from "@/lib/chat/chatSessionEngine";
import { Trash2, Pencil } from "lucide-react";

export const Route = createFileRoute("/chat-history")({
  head: () => ({ meta: [{ title: "对话历史 · Aetherworld" }] }),
  component: ChatHistoryPage,
});

function ChatHistoryPage() {
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  useEffect(() => {
    const u = subscribeSessions(() => setTick((t) => t + 1));
    return () => { u(); };
  }, []);
  const sessions = listSessions();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Chat History</div>
          <h1 className="text-2xl font-display">对话历史</h1>
          <p className="text-sm text-muted-foreground">所有对话会话，可重命名、删除或继续。</p>
        </header>

        <div className="flex justify-end">
          <Link to="/chat" className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90">
            + 新对话
          </Link>
        </div>

        <div className="aether-card divide-y divide-border/40">
          {sessions.length === 0 && (
            <div className="p-8 text-xs text-muted-foreground text-center">暂无对话历史。</div>
          )}
          {sessions.map((s) => (
            <div key={s.sessionId} className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => navigate({ to: "/chat-session/$id", params: { id: s.sessionId } })}
                className="flex-1 min-w-0 text-left"
              >
                <div className="text-sm truncate">{s.title}</div>
                <div className="text-[11px] text-muted-foreground">
                  {s.messages.length} 条消息 · {s.linkedObjectIds.length} 对象 · {s.linkedRunIds.length} 运行 ·
                  更新于 {new Date(s.updatedAt).toLocaleString("zh-CN")}
                </div>
              </button>
              <button
                onClick={() => {
                  const t = prompt("重命名对话", s.title);
                  if (t && t.trim()) renameSession(s.sessionId, t.trim());
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground" title="重命名"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm("删除此对话？")) deleteSession(s.sessionId);
                }}
                className="p-1.5 text-muted-foreground hover:text-rose-300" title="删除"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
