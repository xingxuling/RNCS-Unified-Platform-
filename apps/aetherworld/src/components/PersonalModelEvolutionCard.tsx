import { evolutionBand } from "@/constants/feedbackWeightFactors";
import { Brain } from "lucide-react";

interface Props {
  score: number;
  feedbackCount: number;
  hitRate: number;
}

export function PersonalModelEvolutionCard({ score, feedbackCount, hitRate }: Props) {
  const band = evolutionBand(score);
  const tone =
    band.tone === "peak" ? "text-trigger-peak" :
    band.tone === "high" ? "text-trigger-high" :
    band.tone === "mid"  ? "text-trigger-mid"  : "text-trigger-low";

  const calibration =
    feedbackCount < 10 ? "当前主体模型仍处于早期校准阶段，定数判断仅供参考。" :
    feedbackCount >= 30 ? "当前主体模型已具备初步个体校准能力。" :
    "继续完成回验以提升模型可信度。";

  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Personal Model Evolution
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Brain className="w-4 h-4 text-primary" />
            <div className="font-display text-lg gold-text">个人模型进化分</div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{band.advice}</div>
        </div>
        <div className="text-right">
          <div className={`font-display text-4xl ${tone}`}>{score}</div>
          <div className="text-[10px] text-muted-foreground tracking-widest mt-0.5">/ 100</div>
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-muted/20 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: "var(--primary)", opacity: 0.85 }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground font-mono">
        <span>未形成</span><span>校准中</span><span>学习中</span><span>稳定</span><span>高可信</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <Mini label="状态" value={band.label} />
        <Mini label="回验数" value={feedbackCount} />
        <Mini label="命中率" value={`${hitRate}%`} />
      </div>

      <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/85">
        {calibration}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border/60 p-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-base">{value}</div>
    </div>
  );
}
