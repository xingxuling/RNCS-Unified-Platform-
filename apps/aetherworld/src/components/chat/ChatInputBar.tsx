import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Square } from "lucide-react";
import { ChatAttachmentButton } from "./ChatAttachmentButton";
import { ChatModeSelector, type ChatMode } from "./ChatModeSelector";

interface Props {
  onSubmit: (text: string, mode: ChatMode) => void;
  busy?: boolean;
  defaultMode?: ChatMode;
  onStop?: () => void;
}

export function ChatInputBar({ onSubmit, busy, defaultMode = "AUTO", onStop }: Props) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<ChatMode>(defaultMode);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 180) + "px";
  }, [value]);

  const submit = () => {
    const v = value.trim();
    if (!v || busy) return;
    onSubmit(v, mode);
    setValue("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const showStop = !!(busy && onStop);

  return (
    <div className="sticky bottom-0 z-30 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-card/80 backdrop-blur px-3 py-2 shadow-lg focus-within:border-border focus-within:shadow-xl transition-all">
          <ChatAttachmentButton />
          <button type="button" className="p-1.5 text-muted-foreground hover:text-foreground" title="选择能力">
            <Sparkles className="w-4 h-4" />
          </button>
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="可以问问题，也可以让我做事……例如：WebLCM 是什么 / 创建一个网页应用 / 检查最新项目"
            className="flex-1 resize-none bg-transparent outline-none text-sm py-1.5 placeholder:text-muted-foreground/70"
          />
          <ChatModeSelector value={mode} onChange={setMode} />
          {showStop ? (
            <button
              type="button"
              onClick={onStop}
              className="p-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
              title="停止生成"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!value.trim() || busy}
              className="p-2 rounded-lg bg-foreground text-background disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground/90"
              title="发送"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground/60 text-center mt-1.5">
          Enter 发送 · Shift+Enter 换行 · 不绕过 WebXXM 安装启用机制 · 不绕过 QA
        </div>
      </div>
    </div>
  );
}

