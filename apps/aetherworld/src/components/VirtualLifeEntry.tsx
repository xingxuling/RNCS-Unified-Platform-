import { Link } from "@tanstack/react-router";
import { VirtualLifeSafetyNote } from "./VirtualLifeSafetyNote";

export function VirtualLifeEntry() {
  return (
    <div className="aether-card p-6 space-y-3">
      <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Virtual Life Calculus · 虚拟生活</div>
      <h2 className="text-xl font-display gold-text">把你的虚拟世界，变成一天可生活的体验</h2>
      <p className="text-sm text-muted-foreground">
        虚拟生活计算法基于你的世界种子、角色、任务和回验，生成今天的虚拟生活：你在哪里醒来、你是谁、今天做什么，以及现实中要落到哪一步。
      </p>
      <div className="flex flex-wrap gap-2">
        <Link to="/virtual-life" className="text-sm px-4 py-2 rounded bg-primary/80 hover:bg-primary text-primary-foreground">进入虚拟生活</Link>
        <Link to="/virtual-day" className="text-sm px-4 py-2 rounded bg-background/60 border border-border/40">查看今日</Link>
        <Link to="/virtual-journal" className="text-sm px-4 py-2 rounded bg-background/60 border border-border/40">虚拟生活日记</Link>
      </div>
      <VirtualLifeSafetyNote compact />
    </div>
  );
}
