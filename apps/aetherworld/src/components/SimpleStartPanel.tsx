import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, PlayCircle, UserPlus, BookOpen } from "lucide-react";

interface Props {
  /** 隐藏标题（用于嵌入首页） */
  compact?: boolean;
}

/**
 * SimpleStartPanel · 简化开始面板
 * 首屏只回答：这是什么 / 我能做什么 / 第一步点哪里。
 */
export function SimpleStartPanel({ compact }: Props) {
  return (
    <Card className="p-6 md:p-8 aether-card-elevated space-y-5">
      {!compact && (
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <Sparkles className="w-3 h-3" /> Start Here · 快速开始
        </div>
      )}
      <div className="space-y-2">
        <h1 className="font-display text-2xl md:text-3xl leading-tight gold-text">
          当你不知道「该不该行动」时，先看这件事定没定。
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
          以太命运引擎是一个个人决策辅助工具，帮你判断当前信号、时间窗口和下一步动作。
          它不会替你决定人生，而是帮你减少内耗。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="lg" className="gap-2">
          <Link to="/onboarding">
            <PlayCircle className="w-4 h-4" /> 体验 Demo
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="gap-2">
          <Link to="/subject">
            <UserPlus className="w-4 h-4" /> 创建我的个人模型
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost" className="gap-2">
          <Link to="/onboarding">
            <BookOpen className="w-4 h-4" /> 先看 1 分钟说明
          </Link>
        </Button>
      </div>

      <div className="text-[11px] text-muted-foreground/80 pt-2 border-t border-border/40">
        预测 ≠ 断言未来；行动可改变结果。Demo 数据为模拟主体，不代表真实命运。
      </div>
    </Card>
  );
}
