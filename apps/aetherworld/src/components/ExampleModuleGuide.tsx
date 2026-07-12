import { Link } from "@tanstack/react-router";
import { examplesForModule } from "@/lib/exampleModuleMapper";
import { getModuleGuide } from "@/constants/exampleModuleTypes";
import { BookOpen, ArrowRight } from "lucide-react";

export function ExampleModuleGuide({ moduleId, max = 3 }: { moduleId: string; max?: number }) {
  const guide = getModuleGuide(moduleId);
  const examples = examplesForModule(moduleId).slice(0, max);
  if (!guide) return null;
  return (
    <div className="aether-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <div className="text-[11px] font-medium">不会用？看示例</div>
        </div>
        <Link to="/usage-examples" className="text-[11px] text-primary hover:underline flex items-center gap-1">
          全部示例 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">{guide.oneLineUse}</div>
      {examples.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {examples.map((e) => (
            <li key={e.id} className="text-xs flex items-start gap-2">
              <span className="text-primary">·</span>
              <span className="flex-1">
                <span className="font-medium">{e.title}</span>
                <span className="text-muted-foreground"> — {e.exampleOutputSummary}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-2 text-[11px] text-amber-300/80">该模块暂无示例（Software QA 会标记为 HIGH）。</div>
      )}
    </div>
  );
}
