import { createFileRoute } from "@tanstack/react-router";
import { ThingItselfPanel } from "@/components/ThingItselfPanel";

export const Route = createFileRoute("/thing-itself")({
  head: () => ({
    meta: [
      { title: "看清一个东西 · 万物本身 — Thing Itself" },
      { name: "description", content: "万物本身计算法：在预测/破解/创造之前，先读取对象本体——本质、边界、不变量、阶段。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Thing-Itself Calculus Engine</div>
        <h1 className="font-display text-2xl gold-text">万物本身 · 对象本体读取</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          所有高级计算法的前置本体层：先看清对象是什么、不是什么、靠什么成立、当前处于什么阶段。
        </p>
      </header>
      <ThingItselfPanel />
    </div>
  ),
});
