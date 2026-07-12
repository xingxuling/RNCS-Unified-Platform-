import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { SequenceAIQuickAction } from "@/lib/sequence-ai/sequenceAIResponseComposer";
import { buildHandoff, persistHandoff } from "@/lib/sequence-ai/sequenceAIHandoffEngine";
import type { SequenceAIResponse } from "@/lib/sequence-ai/sequenceAIResponseComposer";

interface Props {
  actions: SequenceAIQuickAction[];
  response: SequenceAIResponse;
  sourceInput: string;
  subjectMode: string;
  language: string;
}

export function SequenceAIQuickActions({ actions, response, sourceInput, subjectMode, language }: Props) {
  if (!actions.length) return null;
  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">快捷动作 · Quick Actions</div>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((action, i) => {
          const handoff = () => persistHandoff(buildHandoff(action, response, sourceInput, subjectMode, language));
          if (action.route) {
            return (
              <Button key={i} asChild size="sm" variant="outline" onClick={handoff}>
                <Link to={action.route}>{action.label}</Link>
              </Button>
            );
          }
          return (
            <Button key={i} size="sm" variant="outline" onClick={handoff}>
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
