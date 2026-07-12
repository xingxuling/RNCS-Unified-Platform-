// AetherSeed Dataset · Chat 结果卡
import type { ChatDatasetInfo } from "@/lib/aetherseed-dataset/datasetChatBridge";
import { DATASET_TYPE_LABEL } from "@/lib/aetherseed-dataset/datasetTypes";

interface Props {
  info: ChatDatasetInfo;
}

const STATUS_COLOR: Record<string, string> = {
  PASS: "text-emerald-500 border-emerald-500/40",
  WARN: "text-amber-500 border-amber-500/40",
  BLOCK: "text-rose-500 border-rose-500/40",
};

export function ChatDatasetCard({ info }: Props) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          AetherSeed Dataset · 数据集
        </div>
        <a
          href="/system/datasets"
          className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
        >
          打开数据集工作台
        </a>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-500">
          焦点 · {info.focusLabel}
        </span>
        {info.recommendedDatasetTypeLabel && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-sky-500/40 text-sky-400">
            建议类型 · {info.recommendedDatasetTypeLabel}
          </span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          训练样本 {info.counters.trainingSamples}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          评测样本 {info.counters.evalSamples}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          数据集版本 {info.counters.datasetVersions}
        </span>
      </div>

      <div className="text-sm text-foreground/90 leading-relaxed">{info.summary}</div>

      {info.recentVersions.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">最近数据集版本</div>
          <div className="space-y-1">
            {info.recentVersions.map((v) => (
              <div
                key={v.id}
                className="rounded-md border border-border/40 bg-muted/10 p-2 text-[11px] flex items-center gap-2 flex-wrap"
              >
                <span className="text-foreground/90">{v.name}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{v.version}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{DATASET_TYPE_LABEL[v.datasetType]}</span>
                <span className="text-muted-foreground">· {v.sampleCount} 条 · 质量 {v.qualityScore}</span>
                <span
                  className={`ml-auto px-1.5 py-0.5 rounded-full border text-[10px] ${
                    STATUS_COLOR[v.safetyStatus]
                  }`}
                >
                  {v.safetyStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[11px] text-muted-foreground">
        推荐导出格式：{info.recommendedExportFormats.length > 0 ? info.recommendedExportFormats.join(" / ") : "—"} · {info.workbenchHint}
      </div>

      <div className="space-y-1">
        <div className="text-[11px] text-muted-foreground">真实文件下载能力</div>
        <ul className="text-[11px] text-foreground/80 space-y-0.5 list-disc list-inside">
          {info.downloadCapabilities.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
        <div className="text-[10px] text-muted-foreground">
          下载仅在浏览器本地生成，不上传外部；BLOCK 样本永不导出。
        </div>
      </div>

      <details className="text-[11px] text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">安全策略（允许 / 禁止）</summary>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          <ul className="space-y-1 list-disc list-inside">
            {info.safetyAllowed.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <ul className="space-y-1 list-disc list-inside">
            {info.safetyForbidden.map((a, i) => (
              <li key={i} className="text-rose-400/80">{a}</li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
