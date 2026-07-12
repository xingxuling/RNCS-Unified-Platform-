import { createFileRoute, Link } from "@tanstack/react-router";
import { useFounderState } from "@/hooks/useFounderState";
import { Code2, PenLine, Shield } from "lucide-react";

export const Route = createFileRoute("/generation-os")({
  head: () => ({
    meta: [
      { title: "生成 OS · Generation OS" },
      { name: "description", content: "代码生成计算法与文案生成计算法的统一入口。" },
    ],
  }),
  component: GenerationOSRoute,
});

function GenerationOSRoute() {
  const { active: founder } = useFounderState();
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Generation OS v0.1</div>
        <h1 className="font-display text-3xl gold-text">生成 OS · 自动扩展层</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          基于事件宇宙、常数宇宙、产品百科与 Prompt Forge，自动生成代码任务与多渠道文案。
          所有产出均带有安全边界与不要破坏（do-not-break）的核心模块声明。
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {founder ? (
          <Link to="/code-generator" className="aether-card-elevated p-5 hover:border-primary/40 transition">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Founder Only</div>
            </div>
            <div className="font-display text-xl mt-2">代码生成计算法</div>
            <div className="text-xs text-muted-foreground mt-1">Code Generation Calculus</div>
            <p className="text-sm mt-3 text-foreground/85">
              根据模块、事件库、常数与百科条目，规划文件、验收清单、依赖警告，并生成 Lovable / Codex / Cursor 提示词。
            </p>
          </Link>
        ) : (
          <div className="aether-card p-5 opacity-60">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Founder Only · 受保护</div>
            </div>
            <div className="font-display text-xl mt-2">代码生成计算法</div>
            <p className="text-xs text-muted-foreground mt-3">
              此模块仅创始人模式可用。请前往「创始人控制台」登录后访问。
            </p>
          </div>
        )}

        <Link to="/copy-generator" className="aether-card-elevated p-5 hover:border-primary/40 transition">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-primary" />
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Creator & Founder</div>
          </div>
          <div className="font-display text-xl mt-2">文案生成计算法</div>
          <div className="text-xs text-muted-foreground mt-1">Copywriting Generation Calculus</div>
          <p className="text-sm mt-3 text-foreground/85">
            根据目标用户、渠道、语言层级生成 3 个版本（清晰 / 共鸣 / 高概念），内置 Copy Safety Guard。
          </p>
        </Link>
      </div>

      <div className="aether-card p-4 text-xs text-muted-foreground leading-relaxed">
        安全边界 · 生成 OS 产出的代码与文案：不删除现有功能、不破坏 Demo/Real 隔离、不开放 Founder-only 模块、
        不绝对化预测、不在企业渠道使用命运化术语。
      </div>
    </div>
  );
}
