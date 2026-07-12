import { SEQUENCE_AI_SAFETY_DISCLAIMER } from "@/constants/sequence-ai/sequenceAISafetyRules";

export function SequenceAISafetyNote({ notes }: { notes: string[] }) {
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs space-y-1.5">
      <div className="font-medium text-amber-500">安全说明</div>
      {notes.length === 0 ? (
        <div className="text-muted-foreground">本次输出未触发额外安全提示。</div>
      ) : (
        <ul className="space-y-1 list-disc list-inside text-muted-foreground">
          {notes.map((n, i) => (<li key={i}>{n}</li>))}
        </ul>
      )}
      <div className="pt-1.5 border-t border-amber-500/20 text-[10px] text-muted-foreground leading-relaxed">
        {SEQUENCE_AI_SAFETY_DISCLAIMER}
      </div>
    </div>
  );
}
