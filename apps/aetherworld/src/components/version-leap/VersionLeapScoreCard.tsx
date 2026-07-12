import type { VersionLeapScore } from "@/lib/version-leap/versionLeapScorer";

const COLOR: Record<string, string> = {
  PATCH: "text-emerald-500", MINOR: "text-sky-500", MAJOR: "text-amber-500",
  LEAP: "text-fuchsia-500", GENERATION: "text-rose-500",
};

export function VersionLeapScoreCard({ score }: { score: VersionLeapScore }) {
  return (
    <div className="border border-border/40 rounded-md p-4 bg-muted/10 space-y-3">
      <div className="flex items-baseline gap-4">
        <span className="text-3xl font-display gold-text">{score.totalScore}</span>
        <span className={`text-lg font-semibold ${COLOR[score.leapLevel]}`}>{score.leapLevel}</span>
      </div>
      <div>
        <p className="text-xs font-semibold mb-1">评分原因</p>
        <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
          {score.reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>
      {score.forcedRules.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1 text-amber-600">强制规则</p>
          <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
            {score.forcedRules.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
      {score.requiredFollowUps.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1">必须的后续</p>
          <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
            {score.requiredFollowUps.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
