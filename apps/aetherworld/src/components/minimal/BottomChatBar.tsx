import { useState, useRef, useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Paperclip, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createSession } from "@/lib/chat/chatSessionEngine";
import { processChatInput } from "@/lib/chat/aetherChatRuntime";

const EXAMPLES = [
  "做一个世界百科 App",
  "把最新世界生成角色歌",
  "检查最新项目 QA",
  "打开 WebLWM 世界库",
  "安装 WebDesignM",
];

// 在 /chat、/chat-session/:id、/chat-history、/chat-settings、/aether-chat 等
// Chat 自身页面隐藏首页底部输入框（Chat 自带 ChatInputBar）。
const HIDDEN_PREFIXES = ["/chat", "/aether-chat"];

export function BottomChatBar() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 160) + "px";
  }, [value]);

  if (HIDDEN_PREFIXES.some((p) => path === p || path.startsWith(p + "/") || path.startsWith(p))) {
    return null;
  }

  const submit = () => {
    const raw = value.trim();
    if (!raw || busy) return;
    setBusy(true);
    try {
      const session = createSession();
      const result = processChatInput(raw, { sessionId: session.sessionId, mode: "AUTO" });
      if (result.assistantMessages.some((m) => m.type === "ERROR_BLOCKED")) {
        toast.error("指令被 QA 阻断");
      } else {
        toast.success("已创建对话会话");
      }
      setValue("");
      navigate({ to: "/chat-session/$id", params: { id: session.sessionId } });
    } catch (e: any) {
      toast.error("指令执行失败", { description: e?.message ?? String(e) });
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="sticky bottom-0 z-40 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-none">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setValue(e)}
              className="shrink-0 text-[11px] px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-card/80 backdrop-blur px-3 py-2 shadow-lg focus-within:border-border focus-within:shadow-xl transition-all">
          <button type="button" className="p-1.5 text-muted-foreground hover:text-foreground" title="附件">
            <Paperclip className="w-4 h-4" />
          </button>
          <button type="button" className="p-1.5 text-muted-foreground hover:text-foreground" title="选择能力">
            <Sparkles className="w-4 h-4" />
          </button>
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="输入指令进入 Aether Chat……"
            className="flex-1 resize-none bg-transparent outline-none text-sm py-1.5 placeholder:text-muted-foreground/70"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim() || busy}
            className="p-2 rounded-lg bg-foreground text-background disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground/90"
            title="发送"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[10px] text-muted-foreground/60 text-center mt-1.5">
          首页输入会创建一个新对话会话 · Enter 发送 · Shift+Enter 换行
        </div>
      </div>
    </div>
  );
}
