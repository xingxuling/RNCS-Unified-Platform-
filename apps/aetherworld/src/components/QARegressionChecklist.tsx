import { useState } from "react";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";

interface Item { id: string; label: string }
interface Section { id: string; title: string; en: string; items: Item[] }

const SECTIONS: Section[] = [
  {
    id: "core", title: "核心流程", en: "Core Flow",
    items: [
      { id: "c1", label: "打开首页" },
      { id: "c2", label: "进入 Demo Persona" },
      { id: "c3", label: "查看 Dashboard 今日定数" },
      { id: "c4", label: "打开 Trigger Calendar" },
      { id: "c5", label: "进入 Prediction Detail" },
      { id: "c6", label: "提交 Feedback（快速回验）" },
      { id: "c7", label: "查看 Feedback Center" },
    ],
  },
  {
    id: "real", title: "真实主体", en: "Real Subject Flow",
    items: [
      { id: "r1", label: "创建 Light 20 主体" },
      { id: "r2", label: "创建 Full 60 主体（首次确认）" },
      { id: "r3", label: "查看三循环对比" },
      { id: "r4", label: "删除真实主体" },
      { id: "r5", label: "确认 Demo 不受影响" },
    ],
  },
  {
    id: "safety", title: "安全流程", en: "Safety Flow",
    items: [
      { id: "s1", label: "Full 60 首次进入有确认" },
      { id: "s2", label: "Prediction Detail 有安全边界" },
      { id: "s3", label: "金融 / 健康相关页面有提示" },
    ],
  },
  {
    id: "prompt", title: "Prompt 流程", en: "Prompt Flow",
    items: [
      { id: "p1", label: "Prompt Forge 可复制" },
      { id: "p2", label: "Prompt 历史保存" },
      { id: "p3", label: "Prompt 回验可用" },
    ],
  },
  {
    id: "docs", title: "文档流程", en: "Docs Flow",
    items: [
      { id: "d1", label: "产品文档中心可打开" },
      { id: "d2", label: "计算法文档包含最新模块" },
      { id: "d3", label: "Roadmap 显示 v1.0" },
    ],
  },
];

export function QARegressionChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const total = SECTIONS.reduce((s, sec) => s + sec.items.length, 0);
  const completed = Object.values(done).filter(Boolean).length;
  const toggle = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }));

  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-center gap-2">
        <ListChecks className="w-4 h-4 text-primary" />
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Regression Checklist · 回归测试清单
        </div>
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <h2 className="font-display text-lg gold-text">每次 Lovable 修改后逐项验证</h2>
        <span className="text-[11px] text-muted-foreground">{completed}/{total} 已确认</span>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mt-4">
        {SECTIONS.map((sec) => (
          <div key={sec.id} className="p-3 rounded-md border border-border/60 bg-secondary/15">
            <div className="text-sm">{sec.title}</div>
            <div className="text-[10px] text-muted-foreground">{sec.en}</div>
            <ul className="mt-2 space-y-1.5">
              {sec.items.map((it) => {
                const on = !!done[it.id];
                return (
                  <li key={it.id}>
                    <button
                      onClick={() => toggle(it.id)}
                      className={`flex items-center gap-2 text-[11px] w-full text-left ${on ? "text-emerald-300" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {on ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                      <span>{it.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
        清单仅本地状态，不会写入存储；用于人工 QA 验证流程是否未回归。
      </div>
    </div>
  );
}
