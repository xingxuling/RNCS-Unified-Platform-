// 迁移向导 · Prompt Migration Wizard
import { DomainSelectorGrid } from "./DomainSelectorGrid";
import { PromptTransferMap } from "./PromptTransferMap";

interface Props {
  sourceDomain: string;
  targetDomain: string;
  patternId?: string;
  onSourceChange: (id: string) => void;
  onTargetChange: (id: string) => void;
  onPatternChange: (id: string) => void;
}

export function PromptMigrationWizard({
  sourceDomain, targetDomain, patternId,
  onSourceChange, onTargetChange, onPatternChange,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <DomainSelectorGrid label="Step 1 · 源领域" value={sourceDomain} onChange={onSourceChange} />
        <DomainSelectorGrid label="Step 2 · 目标领域" value={targetDomain} onChange={onTargetChange} />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Step 3 · 选择迁移模式（可选）
        </div>
        <PromptTransferMap
          sourceDomain={sourceDomain}
          targetDomain={targetDomain}
          value={patternId}
          onSelect={onPatternChange}
        />
      </div>
    </div>
  );
}
