import type { SequenceObjectQaResult } from "@/lib/sequence-object/sequenceObjectQaBridge";
import type { MeaningDriftCheck } from "@/lib/sequence-object/sequenceObjectMeaningDriftDetector";

const statusColor: Record<string, string> = {
  PASS: "text-emerald-400",
  WARN: "text-amber-300",
  FAIL: "text-orange-400",
  BLOCKED: "text-red-400",
};

export function SequenceObjectQaPanel({ qa, drift }: { qa: SequenceObjectQaResult; drift: MeaningDriftCheck }) {
  return (
    <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
      <div className="mb-2 font-medium">对象 QA & 意义漂移</div>
      <div className={`text-xs ${statusColor[qa.status]}`}>QA 状态：{qa.status}</div>
      <ul className="mt-1 text-xs space-y-0.5">
        {qa.issues.map((i) => <li key={i.code}>· [{i.severity}] {i.message}</li>)}
        {qa.issues.length === 0 && <li className="text-muted-foreground">无问题。</li>}
      </ul>
      <div className={`mt-3 text-xs ${drift.level === "BLOCK" ? "text-red-400" : drift.level === "WARN" ? "text-amber-300" : "text-emerald-400"}`}>
        意义漂移：{drift.level}
      </div>
      <ul className="mt-1 text-xs space-y-0.5">
        {drift.findings.map((f, i) => <li key={i}>· [{f.severity}] {f.message}</li>)}
      </ul>
    </div>
  );
}
