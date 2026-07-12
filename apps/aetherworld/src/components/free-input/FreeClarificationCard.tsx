import { Button } from "@/components/ui/button";

interface Props {
  question?: string;
  fallback?: string;
  onSkip: () => void;
}

export function FreeClarificationCard({ question, fallback, onSkip }: Props) {
  if (!question) return null;
  return (
    <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm space-y-2">
      <div className="font-medium">为了更准确，我只问一个问题：</div>
      <div>{question}</div>
      {fallback && <div className="text-xs text-muted-foreground">如果不回答，将自动：{fallback}</div>}
      <div>
        <Button size="sm" variant="ghost" onClick={onSkip}>跳过追问，直接给我可用结果</Button>
      </div>
    </div>
  );
}
