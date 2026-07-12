import type { VersionNumberSuggestion } from "@/lib/version-leap/versionNumberAdvisor";

export function VersionNumberAdvisorPanel({ suggestion }: { suggestion: VersionNumberSuggestion }) {
  return (
    <div className="border border-border/40 rounded-md p-4 bg-muted/10 space-y-3">
      <div className="flex items-baseline gap-3">
        <span className="text-xs text-muted-foreground">当前</span>
        <span className="font-mono">{suggestion.currentVersion}</span>
        <span className="text-muted-foreground">→</span>
        <span className="font-mono text-lg gold-text">{suggestion.suggestedVersion}</span>
      </div>
      {suggestion.releaseName && (
        <p className="text-sm"><span className="text-muted-foreground">Release Name：</span>{suggestion.releaseName}</p>
      )}
      <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
      {suggestion.alternativeVersions.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1">备选版本号</p>
          <div className="flex flex-wrap gap-1">
            {suggestion.alternativeVersions.map((v) => (
              <span key={v} className="text-xs px-2 py-0.5 rounded bg-muted font-mono">{v}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
