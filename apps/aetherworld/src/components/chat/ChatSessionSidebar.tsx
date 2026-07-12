import { Link } from "@tanstack/react-router";
import { Plus, MessageSquare } from "lucide-react";
import type { ChatSession } from "@/lib/chat/chatSessionEngine";

interface Props {
  sessions: ChatSession[];
  currentId?: string;
  onNew: () => void;
}

export function ChatSessionSidebar({ sessions, currentId, onNew }: Props) {
  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/40 bg-background/50">
      <div className="p-3 border-b border-border/40">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-md bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="w-3.5 h-3.5" /> 新对话
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sessions.length === 0 && (
          <div className="text-[11px] text-muted-foreground text-center py-6">暂无会话</div>
        )}
        {sessions.map((s) => (
          <Link
            key={s.sessionId}
            to="/chat-session/$id"
            params={{ id: s.sessionId }}
            className={[
              "flex items-center gap-2 text-xs px-2 py-1.5 rounded-md truncate",
              currentId === s.sessionId
                ? "bg-card/70 text-foreground"
                : "text-muted-foreground hover:bg-card/40 hover:text-foreground",
            ].join(" ")}
          >
            <MessageSquare className="w-3 h-3 shrink-0" />
            <span className="truncate">{s.title || "新对话"}</span>
          </Link>
        ))}
      </div>
      <div className="p-2 border-t border-border/40 space-y-0.5">
        <Link to="/chat-history" className="block text-[11px] text-muted-foreground hover:text-foreground px-2 py-1">
          全部历史 →
        </Link>
        <Link to="/chat-settings" className="block text-[11px] text-muted-foreground hover:text-foreground px-2 py-1">
          对话设置 →
        </Link>
      </div>
    </aside>
  );
}
