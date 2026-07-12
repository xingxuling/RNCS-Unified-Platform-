import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * DemoFirstEntry · Demo 优先体验
 * 让用户先看到结果，不需要先理解理论。
 */
export function DemoFirstEntry() {
  return (
    <Card className="p-5 aether-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Demo First · 演示主体
        </div>
        <Badge variant="outline">模拟数据</Badge>
      </div>

      <div className="text-sm text-muted-foreground">
        这是模拟数据，用来演示产品怎么工作。不代表你的真实结果。
      </div>

      <div className="rounded-md border border-border/60 p-4 space-y-2 bg-background/40">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">今日示例判断</div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>当前状态：半定</Badge>
          <Badge variant="outline">建议动作：小步推进</Badge>
        </div>
        <div className="text-sm text-foreground/85">
          解释：事情方向正在变清楚，但还需要一个现实反馈。
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/calendar">看详情</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/feedback">记录结果</Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link to="/subject">创建我的模型</Link>
        </Button>
      </div>
    </Card>
  );
}
