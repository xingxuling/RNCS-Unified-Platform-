import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInputBar } from "./ChatInputBar";
import { ChatSessionSidebar } from "./ChatSessionSidebar";
import type { ChatMode } from "./ChatModeSelector";
import { processChatInput } from "@/lib/chat/aetherChatRuntime";
import { startAnswerOnlyStreaming } from "@/lib/chat/chatAnswerStreamingRuntime";
import { resolveChatIntent } from "@/lib/chat/chatIntentResolver";
import {
  createSession, getSession, listSessions, subscribeSessions, type ChatSession,
} from "@/lib/chat/chatSessionEngine";
import { isAllowedRoute } from "@/lib/chat/chatPageNavigationBridge";
import { CHAT_EXAMPLES } from "@/lib/chat/chatExamplesRegistry";

interface Props {
  sessionId?: string;
}

export function AetherChatShell({ sessionId: forcedId }: Props) {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | undefined>(forcedId);
  const [session, setSession] = useState<ChatSession | undefined>(undefined);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsub = subscribeSessions(() => setTick((t) => t + 1));
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    setSessions(listSessions());
    if (forcedId) {
      const s = getSession(forcedId);
      if (s) { setSession(s); setSessionId(forcedId); return; }
    }
    if (!sessionId) {
      const s = createSession();
      setSession(s);
      setSessionId(s.sessionId);
    } else {
      setSession(getSession(sessionId));
    }
  }, [forcedId, tick]);

  const refresh = useCallback(() => {
    if (sessionId) setSession(getSession(sessionId));
  }, [sessionId]);

  const handleSubmit = useCallback((text: string, mode: ChatMode) => {
    if (!sessionId) return;

    // ANSWER_ONLY → 直接走真实 Provider / WebLLM 流式
    // AUTO + ASK_MODE 普通问答 → 同样走真实 Provider 路径，避免误入规则模式
    const useStreaming =
      mode === "ANSWER_ONLY" ||
      (mode === "AUTO" && resolveChatIntent(text).inputMode === "ASK_MODE");

    if (useStreaming) {
      setBusy(true);
      try {
        const handle = startAnswerOnlyStreaming(text, { sessionId });
        stopRef.current = handle.stop;
        refresh();
        handle.done.finally(() => {
          stopRef.current = null;
          setBusy(false);
          refresh();
        });
      } catch (e: any) {
        stopRef.current = null;
        setBusy(false);
        toast.error("回答失败", { description: e?.message ?? String(e) });
      }
      return;
    }

    // 其他模式：保留原有 processChatInput 流程
    setBusy(true);
    try {
      const result = processChatInput(text, { sessionId, mode });
      refresh();
      if (result.assistantMessages.some((m) => m.type === "ERROR_BLOCKED")) {
        toast.error("指令被 QA 阻断");
      }
    } catch (e: any) {
      toast.error("处理失败", { description: e?.message ?? String(e) });
    } finally {
      setBusy(false);
    }
  }, [sessionId, refresh]);

  const handleStop = useCallback(() => {
    stopRef.current?.();
  }, []);

  const handleAction = (route?: string) => {
    if (!route) return;
    if (!isAllowedRoute(route)) {
      toast.error("路由不允许");
      return;
    }
    navigate({ to: route });
  };

  const handleNew = () => {
    const s = createSession();
    setSession(s);
    setSessionId(s.sessionId);
    navigate({ to: "/chat-session/$id", params: { id: s.sessionId } });
  };

  return (
    <div className="flex-1 min-h-0 flex">
      <ChatSessionSidebar sessions={sessions} currentId={sessionId} onNew={handleNew} />
      <div className="flex-1 min-w-0 flex flex-col">
        {session && session.messages.length === 0 ? (
          <EmptyState onPick={(text) => handleSubmit(text, "AUTO")} />
        ) : (
          <ChatMessageList messages={session?.messages ?? []} onAction={handleAction} />
        )}
        <ChatInputBar onSubmit={handleSubmit} busy={busy} onStop={handleStop} />
      </div>
    </div>
  );
}


function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Aether Chat</div>
      <h1 className="text-2xl md:text-3xl font-display mt-3 text-center">今天想让 Aetherworld 做什么？</h1>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
        输入目标，我会自动选择能力模型、运行时、对象和页面。
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl">
        {CHAT_EXAMPLES.map((e) => (
          <button
            key={e}
            onClick={() => onPick(e)}
            className="text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
