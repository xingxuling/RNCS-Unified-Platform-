import { Button } from "@/components/ui/button";

export function SequenceAINextActions({ actions }: { actions: string[] }) {
  if (!actions.length) return null;
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">下一步</h4>
      <ol className="text-sm space-y-1 list-decimal list-inside">
        {actions.map((a, i) => (<li key={i}>{a}</li>))}
      </ol>
    </div>
  );
}

export function SequenceAINextActionButtons({ actions, onPick }: { actions: string[]; onPick: (a: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((a, i) => (
        <Button key={i} size="sm" variant="ghost" onClick={() => onPick(a)}>{a}</Button>
      ))}
    </div>
  );
}
