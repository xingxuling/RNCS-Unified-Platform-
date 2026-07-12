import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WebLlmNeuroControlPanel } from "@/components/webllm/WebLlmNeuroControlPanel";
import { applyNeuroControl } from "@/lib/webllm/webLlmNeuroControlLayer";
import { DEFAULT_NEURO_CONTROL_PROFILE_ID } from "@/constants/webllm/webLlmNeuroControlProfiles";

export const Route = createFileRoute("/webllm-neuro-control")({
  head: () => ({
    meta: [
      { title: "WebLLM Neuro Control · 神经启发控制层" },
      { name: "description", content: "工程化的局部细节聚焦、预测误差闸门、上下文漂移检测与执行功能闸门。不是医学诊断。" },
    ],
  }),
  component: NeuroPage,
});

function NeuroPage() {
  const [profile, setProfile] = useState(DEFAULT_NEURO_CONTROL_PROFILE_ID);
  const [text, setText] = useState("示例输出：为番茄钟项目生成 README 草案。");
  const [task, setTask] = useState("番茄钟");
  const report = applyNeuroControl(profile, text, task);
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">WebLLM Neuro Control</h1>
        <p className="text-sm text-muted-foreground">局部细节聚焦、预测误差敏感度、一致性阈值、执行闸门——工程化控制策略，不是医学诊断。</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-3">
          <div className="border border-border/40 rounded p-3 space-y-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">任务关键词</div>
            <input value={task} onChange={(e) => setTask(e.target.value)} className="w-full bg-background border border-border/40 rounded px-2 py-1 text-sm" />
          </div>
          <div className="border border-border/40 rounded p-3 space-y-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">模拟输出</div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full h-40 bg-background border border-border/40 rounded p-2 text-sm font-mono" />
          </div>
        </div>
        <WebLlmNeuroControlPanel value={profile} onChange={setProfile} report={report} />
      </div>
    </div>
  );
}
