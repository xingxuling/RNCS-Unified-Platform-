import { createFileRoute } from "@tanstack/react-router";
import { ThingItselfPanel } from "@/components/ThingItselfPanel";

export const Route = createFileRoute("/object-essence")({
  head: () => ({
    meta: [
      { title: "本质读取器 · Essence Reader" },
      { name: "description", content: "读取对象本质：核心需求、核心驱动、核心功能、它不是什么。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Essence Reader</div>
        <h1 className="font-display text-2xl gold-text">本质读取器</h1>
      </header>
      <ThingItselfPanel />
    </div>
  ),
});
