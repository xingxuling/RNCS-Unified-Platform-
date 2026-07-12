import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Calendar, Eye, MessageSquarePlus, UserCheck } from "lucide-react";

const STEPS = [
  { icon: Sparkles,          title: "1 · 体验 Demo",        desc: "先用模拟主体熟悉系统结构与预测形态。",                  to: "/subject" },
  { icon: Calendar,          title: "2 · 查看触发日历",     desc: "看看未来 30 天的结构触发分布与强度。",                    to: "/calendar" },
  { icon: Eye,               title: "3 · 打开一个日期详情", desc: "理解定数 / 五域 / 事件类型 / 行动许可。",                 to: "/calendar" },
  { icon: MessageSquarePlus, title: "4 · 提交一次回验",     desc: "用真实结果反向训练系统权重。",                            to: "/feedback" },
  { icon: UserCheck,         title: "5 · 创建真实主体",     desc: "在了解隐私边界后，可启用 Light 20 或 Full 60。",          to: "/real-subject" },
];

export function QuickStartGuidePanel({ className }: { className?: string }) {
  return (
    <div className={`aether-card-elevated p-5 ${className ?? ""}`}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Quick Start · 五步快速开始</div>
      <h2 className="font-display text-lg gold-text mt-1">快速上手</h2>
      <p className="text-xs text-muted-foreground mt-1">
        Aether 不是普通预测 App，而是一个结构化预测操作系统。建议按以下顺序熟悉。
      </p>

      <div className="mt-4 space-y-2">
        {STEPS.map((s) => (
          <Link
            key={s.title}
            to={s.to}
            className="flex items-start gap-3 rounded-md border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition px-3 py-2.5"
          >
            <s.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium">{s.title}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-1 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
