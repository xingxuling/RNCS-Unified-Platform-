// src/components/AGIShellConsole.tsx
import React, { useEffect, useState } from "react";
import { AGIShellCore, ShellMessage } from "../agi-shell/agiShellCore";
import { WorldState } from "../seed-runtime/seedRuntime";

import { Terminal, SendHorizontal } from "lucide-react";

interface Props {
  shell: AGIShellCore;
  onWorldStateUpdate: (world: WorldState) => void;
}

export const AGIShellConsole: React.FC<Props> = ({
  shell,
  onWorldStateUpdate,
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ShellMessage[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // 初始提示
    setMessages([
      {
        role: "system",
        text:
          "欢迎进入 The Seed · AGI Shell。\n你可以使用自然语言或 IAL 指令来操控文明运行时。\n输入 \"help\" 查看可用指令。",
      },
    ]);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput("");

    try {
      const result = await shell.processUserInput(text);
      setMessages((prev) => [...prev, ...result.messages]);
      onWorldStateUpdate(result.worldState);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { role: "system", text: "执行指令时出现错误（见 Console）" },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Terminal className="w-4 h-4 text-cyan-400" />
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            AGI Shell Console
          </div>
          <div className="text-[11px] text-slate-300">
            基于文明运行时的结构智能外壳（本地执行）
          </div>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 rounded-2xl border border-slate-800/80 bg-slate-950/90 p-3 overflow-y-auto text-[11px] space-y-2 min-h-[400px]">
        {messages.map((m, idx) => (
          <div key={idx} className="space-y-1">
            <div className="text-[10px] text-slate-500">
              {m.role === "user"
                ? "你"
                : m.role === "agent"
                ? "Shell"
                : m.role === "world"
                ? "World"
                : "System"}
            </div>
            <div
              className={
                m.role === "user"
                  ? "bg-slate-800/80 rounded-xl px-3 py-2 text-slate-100 whitespace-pre-wrap"
                  : m.role === "world"
                  ? "bg-indigo-900/40 border border-indigo-700/70 rounded-xl px-3 py-2 text-indigo-100 whitespace-pre-wrap"
                  : "bg-slate-900/80 rounded-xl px-3 py-2 text-slate-200 whitespace-pre-wrap"
              }
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* 输入区域 */}
      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-[11px] outline-none focus:border-cyan-400 text-slate-200"
          placeholder='例如："看一下当前宇宙状态" 或 `IAL Ψ Σ : Γ K Z : V Z₊`'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={busy}
        />
        <button
          onClick={handleSend}
          disabled={busy || !input.trim()}
          className="px-3 py-2 rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 text-xs flex items-center gap-1 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          <SendHorizontal className="w-3 h-3" />
          Send
        </button>
      </div>
    </div>
  );
};

