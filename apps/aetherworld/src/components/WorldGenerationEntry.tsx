import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";

export function WorldGenerationEntry({ compact }: { compact?: boolean }) {
  return (
    <div className={`aether-card-elevated relative overflow-hidden ${compact ? "p-5" : "p-6 md:p-8"}`}>
      <div className="absolute inset-0 pointer-events-none opacity-30"
           style={{ background: "radial-gradient(600px 200px at 20% 0%, var(--primary), transparent 60%)" }} />
      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Personal World Generator
        </div>
        <h2 className={`font-display gold-text mt-2 ${compact ? "text-xl" : "text-2xl md:text-3xl"}`}>
          生成你的个人世界
        </h2>
        <p className="text-sm text-foreground/85 mt-2 max-w-2xl leading-relaxed">
          把你的主体结构转化成一个象征性世界模型：世界法则、事件地图、角色定位、行动窗口与成长主线。
        </p>
        <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
          这是自我理解与结构可视化体验，不是绝对命运判断。
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/world-generator"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
            开始生成 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link to="/personal-world"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm hover:border-primary/50 transition">
            查看我的世界
          </Link>
        </div>
      </div>
    </div>
  );
}
