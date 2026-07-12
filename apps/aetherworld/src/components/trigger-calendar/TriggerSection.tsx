import { TriggerCard } from "./TriggerCard";
import type { TriggerItem } from "@/lib/trigger-calendar/triggerTypes";

interface Props {
  title: string;
  description?: string;
  items: TriggerItem[];
  emptyText?: string;
  compact?: boolean;
}

export function TriggerSection({ title, description, items, emptyText, compact }: Props) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {items.length === 0 ? (
        <div className="aether-card p-6 text-center text-sm text-muted-foreground">
          {emptyText ?? "暂无内容。"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((it) => (
            <TriggerCard key={it.triggerId} trigger={it} compact={compact} />
          ))}
        </div>
      )}
    </section>
  );
}
