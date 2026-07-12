// 个人模型铸造工坊 · 结果卡
import type { ChatPersonalModelForgeInfo } from "@/lib/personal-model-forge/personalModelForgeChatBridge";
import { describeLocation } from "@/lib/personal-model-forge/personalModelForgeChatBridge";

interface Props {
  info: ChatPersonalModelForgeInfo;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "草案",
  READY: "就绪",
  RUNNING_MANUAL: "手动运行中",
  COMPLETED: "完成",
  FAILED: "失败",
  EVALUATED: "已评测",
};

export function ChatPersonalModelForgeCard({ info }: Props) {
  const { report } = info;

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          AetherSeed 个人模型铸造工坊
        </div>
        <a
          href="/system/personal-model-forge"
          className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
        >
          打开工坊
        </a>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-500">
          焦点 · {info.focusLabel}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          本机 = 慢速训练炉
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          服务器 = 爆发训练炉
        </span>
      </div>

      <div className="text-sm text-foreground/90">{info.summary}</div>

      {info.focus === "TOOLCHAIN" && (
        <div className="space-y-1.5">
          <div className="text-[11px] text-muted-foreground">工具链地图</div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {report.toolchain.map((t) => (
              <div
                key={t.id}
                className="rounded-md border border-border/40 bg-muted/10 p-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-foreground/90">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground">{t.roleLabel}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  状态：{t.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {info.focus === "BLOODLINE" && (
        <div className="space-y-1.5">
          <div className="text-[11px] text-muted-foreground">AetherSeed 血统线</div>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {report.bloodline.map((s) => (
              <span
                key={s.id}
                className="px-2 py-0.5 rounded-full border border-border/60 text-foreground/90"
              >
                {s.modelName}（{describeLocation(s.forgeLocation)}）
              </span>
            ))}
          </div>
        </div>
      )}

      {info.focus === "CIVILIZATION_SEED" && (
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          {(["seed", "skeleton", "muscle", "blood", "nerve", "growth"] as const).map(
            (k) => {
              const labels: Record<string, string> = {
                seed: "种子",
                skeleton: "骨架",
                muscle: "肌肉",
                blood: "血液",
                nerve: "神经",
                growth: "生长",
              };
              return (
                <div
                  key={k}
                  className="rounded-md border border-border/40 bg-muted/10 p-2"
                >
                  <div className="text-muted-foreground">{labels[k]}</div>
                  <div className="text-foreground/90 leading-relaxed">
                    {report.civilizationSeed[k].join("、")}
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}

      {info.focus === "CORPUS" && (
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">当前语料资产</div>
          {report.corpusAssets.map((c) => (
            <div
              key={c.id}
              className="text-[11px] rounded-md border border-border/40 bg-muted/10 p-1.5 flex items-center justify-between gap-2"
            >
              <span className="text-foreground/90">{c.name}</span>
              <span className="text-muted-foreground">{c.source} · {c.readiness}</span>
            </div>
          ))}
        </div>
      )}

      {info.focus === "SOLO_TIME" && (
        <ul className="text-[11px] text-foreground/85 list-disc list-inside space-y-0.5">
          {report.soloTimeModelNotes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}

      {(info.focus === "LOCAL" ||
        info.focus === "SERVER" ||
        info.focus === "OVERVIEW") &&
        info.highlightedExperiments &&
        info.highlightedExperiments.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] text-muted-foreground">
              {info.focus === "SERVER" ? "服务器实验草案" : "本机实验草案"}
            </div>
            {info.highlightedExperiments.map((e) => (
              <div
                key={e.id}
                className="rounded-md border border-border/40 bg-muted/10 p-2 space-y-1"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs text-foreground/90">{e.name}</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/60 text-muted-foreground">
                    {STATUS_LABEL[e.status] ?? e.status}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-2">
                  <span>类型：{e.experimentTypeLabel}</span>
                  <span>位置：{describeLocation(e.location)}</span>
                  <span>预计：{e.estimatedDuration}</span>
                </div>
                {e.goal && <div className="text-[11px] text-foreground/85">目标：{e.goal}</div>}
              </div>
            ))}
          </div>
        )}

      <div className="space-y-1">
        <div className="text-[11px] text-muted-foreground">下一步建议</div>
        <ul className="text-[11px] text-foreground/85 list-disc list-inside space-y-0.5">
          {report.nextSuggestions.slice(0, 4).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="text-[10px] text-muted-foreground">
        说明：Aetherworld 不会自动执行训练 / 上传数据 / 调外部服务器。一切训练由用户在本机或服务器手动启动。
      </div>
    </div>
  );
}
