import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { FreeQuickAction } from "@/lib/free-input/freeAnswerComposer";

export function FreeQuickActions({ actions }: { actions: FreeQuickAction[] }) {
  if (!actions.length) return null;
  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">快捷动作</div>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((a, i) =>
          a.route ? (
            <Button key={i} asChild size="sm" variant="outline">
              <Link to={a.route}>{a.label}</Link>
            </Button>
          ) : (
            <Button key={i} size="sm" variant="outline">{a.label}</Button>
          ),
        )}
      </div>
    </div>
  );
}
