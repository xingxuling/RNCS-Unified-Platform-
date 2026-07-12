import { toast } from "sonner";
import type { ChatMessage } from "@/lib/chat/chatMessageEngine";
import { CALCULUS_LABEL } from "@/lib/chat/calculusRouteResultTypes";
import { ChatFusionInfoPanel } from "./ChatFusionInfoPanel";
import { ChatPredictionCard } from "./ChatPredictionCard";
import { ChatSchedulerTaskCard } from "./ChatSchedulerTaskCard";
import { ChatLegacyModuleCard } from "./ChatLegacyModuleCard";
import { ChatAgentPanelCard } from "./ChatAgentPanelCard";
import { ChatSequenceAiCard } from "./ChatSequenceAiCard";
import { ChatManualCard } from "./ChatManualCard";
import { ChatRecordCenterCard } from "./ChatRecordCenterCard";
import { ChatOpenArchitectureCard } from "./ChatOpenArchitectureCard";
import { ChatNetworkSourceCard } from "./ChatNetworkSourceCard";
import { ChatProjectFusionCard } from "./ChatProjectFusionCard";
import { ChatImaginativeFusionCard } from "./ChatImaginativeFusionCard";
import { ChatLayerAuditCard } from "./ChatLayerAuditCard";
import { ChatPersonalModelForgeCard } from "./ChatPersonalModelForgeCard";
import { ChatIntakeForgeCard } from "./ChatIntakeForgeCard";
import { ChatDatasetCard } from "./ChatDatasetCard";
import { ChatTrainingFactoryCalculusCard } from "./ChatTrainingFactoryCalculusCard";
import { ChatCapabilityAssetCard } from "./ChatCapabilityAssetCard";
import { ChatLocalTrainingCard } from "./ChatLocalTrainingCard";
import { ChatExperimentLedgerCard } from "./ChatExperimentLedgerCard";
import { ChatAutoTrainingCard } from "./ChatAutoTrainingCard";
import { ChatUserAssetCard } from "./ChatUserAssetCard";
import { ChatTrainingWorkflowCard } from "./ChatTrainingWorkflowCard";
import { ChatLocalGatewayCard } from "./ChatLocalGatewayCard";
import { ChatFirstRunCard } from "./ChatFirstRunCard";

interface Props {
  data: NonNullable<ChatMessage["answerCard"]>;
  streaming?: boolean;
  source?: ChatMessage["source"];
  errorText?: string;
  slowHint?: string;
  providerInfo?: ChatMessage["providerInfo"];
  calculusInfo?: ChatMessage["calculusInfo"];
  fusionInfo?: ChatMessage["fusionInfo"];
  memoryInfo?: ChatMessage["memoryInfo"];
  currencyInfo?: ChatMessage["currencyInfo"];
  mslInfo?: ChatMessage["mslInfo"];
  predictionInfo?: ChatMessage["predictionInfo"];
  schedulerInfo?: ChatMessage["schedulerInfo"];
  legacyInfo?: ChatMessage["legacyInfo"];
  agentInfo?: ChatMessage["agentInfo"];
  sequenceAiInfo?: ChatMessage["sequenceAiInfo"];
  manualInfo?: ChatMessage["manualInfo"];
  recordInfo?: ChatMessage["recordInfo"];
  openArchInfo?: ChatMessage["openArchInfo"];
  networkInfo?: ChatMessage["networkInfo"];
  projectFusionInfo?: ChatMessage["projectFusionInfo"];
  imaginativeFusionInfo?: ChatMessage["imaginativeFusionInfo"];
  layerAuditInfo?: ChatMessage["layerAuditInfo"];
  personalModelForgeInfo?: ChatMessage["personalModelForgeInfo"];
  trainingFactoryCalculusInfo?: ChatMessage["trainingFactoryCalculusInfo"];
  intakeForgeInfo?: ChatMessage["intakeForgeInfo"];
  datasetInfo?: ChatMessage["datasetInfo"];
  capabilityAssetInfo?: ChatMessage["capabilityAssetInfo"];
  localTrainingInfo?: ChatMessage["localTrainingInfo"];
  experimentLedgerInfo?: ChatMessage["experimentLedgerInfo"];
  autoTrainingInfo?: ChatMessage["autoTrainingInfo"];
  userAssetInfo?: ChatMessage["userAssetInfo"];
  trainingWorkflowInfo?: ChatMessage["trainingWorkflowInfo"];
  localGatewayInfo?: ChatMessage["localGatewayInfo"];
  firstRunInfo?: ChatMessage["firstRunInfo"];
}

const SOURCE_LABEL: Record<string, string> = {
  PROVIDER: "真实模型",
  WEBLLM: "本地 WebLLM",
  RULE: "规则回答",
  FALLBACK: "规则降级",
};

function formatLatency(ms?: number): string {
  if (typeof ms !== "number") return "";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function ChatAnswerCard({
  data,
  streaming,
  source,
  errorText,
  slowHint,
  providerInfo,
  calculusInfo,
  fusionInfo,
  memoryInfo,
  currencyInfo,
  mslInfo,
  predictionInfo,
  schedulerInfo,
  legacyInfo,
  agentInfo,
  sequenceAiInfo,
  manualInfo,
  recordInfo,
  openArchInfo,
  networkInfo,
  projectFusionInfo,
  imaginativeFusionInfo,
  layerAuditInfo,
  personalModelForgeInfo,
  trainingFactoryCalculusInfo,
  intakeForgeInfo,
  datasetInfo,
  capabilityAssetInfo,
  localTrainingInfo,
  experimentLedgerInfo,
  autoTrainingInfo,
  userAssetInfo,
  trainingWorkflowInfo,
  localGatewayInfo,
  firstRunInfo,
}: Props) {
  const sourceLabel = source ? SOURCE_LABEL[source] ?? source : undefined;
  const handleCopy = () => {
    if (!data.answer) return;
    try {
      navigator.clipboard.writeText(data.answer);
      toast.success("已复制到剪贴板");
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/70 p-4 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {data.title}
        </div>
        {sourceLabel && (
          <div
            className={`text-[10px] px-2 py-0.5 rounded-full border ${
              source === "PROVIDER"
                ? "border-sky-500/40 text-sky-500"
                : source === "WEBLLM"
                ? "border-emerald-500/40 text-emerald-500"
                : source === "FALLBACK"
                ? "border-amber-500/40 text-amber-500"
                : "border-border/60 text-muted-foreground"
            }`}
          >
            {sourceLabel}
            {streaming ? " · 生成中" : ""}
          </div>
        )}
      </div>

      {source === "PROVIDER" && providerInfo && (
        <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
          <span>来源：{providerInfo.chineseName}</span>
          {providerInfo.modelId && <span>模型：{providerInfo.modelId}</span>}
          {providerInfo.promptModeLabel && (
            <span>Prompt 模式：{providerInfo.promptModeLabel}</span>
          )}
          {providerInfo.latencyMs != null && (
            <span>耗时：{formatLatency(providerInfo.latencyMs)}</span>
          )}
          <span>模式：真实模型</span>
          <span>{providerInfo.sanitized ? "上下文已脱敏" : "无敏感内容"}</span>
          <span>Fallback：否</span>
        </div>
      )}

      {(source === "FALLBACK" || source === "RULE") && (
        <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
          <span>模式：规则模式</span>
          <span>Fallback：是</span>
        </div>
      )}

      {calculusInfo && (
        <div className="rounded-md border border-border/40 bg-muted/30 p-2 space-y-1 text-[10px] text-muted-foreground">
          <div>
            计算法路由：
            <span className="text-foreground/80">
              {calculusInfo.contract.calculusIds
                .map((id) => CALCULUS_LABEL[id])
                .join(" → ") || "—"}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            <span>Prompt Contract：已应用</span>
            <span>常数约束：已应用</span>
            <span>
              漂移检测：
              {!calculusInfo.drift
                ? "—"
                : calculusInfo.drift.severity === "NONE"
                ? "通过"
                : calculusInfo.drift.severity === "MINOR"
                ? "轻微漂移"
                : "严重漂移"}
            </span>
            <span>
              工具调用：
              {!calculusInfo.toolExecutions || calculusInfo.toolExecutions.length === 0
                ? "无"
                : calculusInfo.toolExecutions
                    .map((t) =>
                      t.status === "EXECUTED"
                        ? `${t.toolId}（已执行）`
                        : t.status === "PENDING_CONFIRM"
                        ? `${t.toolId}（待确认）`
                        : `${t.toolId}（被阻断）`,
                    )
                    .join(" · ")}
            </span>
            {calculusInfo.fingerprint && (
              <span>语义指纹：{calculusInfo.fingerprint.sequenceCode}</span>
            )}
          </div>
        </div>
      )}

      {fusionInfo && <ChatFusionInfoPanel info={fusionInfo} />}

      {predictionInfo && <ChatPredictionCard prediction={predictionInfo} />}

      {schedulerInfo && schedulerInfo.tasks.length > 0 && (
        <ChatSchedulerTaskCard tasks={schedulerInfo.tasks} />
      )}

      {legacyInfo && <ChatLegacyModuleCard info={legacyInfo} />}

      {agentInfo && <ChatAgentPanelCard info={agentInfo} />}

      {sequenceAiInfo && <ChatSequenceAiCard info={sequenceAiInfo} />}

      {manualInfo && <ChatManualCard info={manualInfo} />}

      {recordInfo && <ChatRecordCenterCard info={recordInfo} />}

      {openArchInfo && <ChatOpenArchitectureCard info={openArchInfo} />}

      {networkInfo && <ChatNetworkSourceCard info={networkInfo} />}

      {projectFusionInfo && <ChatProjectFusionCard info={projectFusionInfo} />}

      {imaginativeFusionInfo && <ChatImaginativeFusionCard info={imaginativeFusionInfo} />}

      {layerAuditInfo && <ChatLayerAuditCard info={layerAuditInfo} />}

      {personalModelForgeInfo && <ChatPersonalModelForgeCard info={personalModelForgeInfo} />}

      {trainingFactoryCalculusInfo && (
        <ChatTrainingFactoryCalculusCard info={trainingFactoryCalculusInfo} />
      )}

      {intakeForgeInfo && <ChatIntakeForgeCard info={intakeForgeInfo} />}

      {datasetInfo && <ChatDatasetCard info={datasetInfo} />}

      {capabilityAssetInfo && <ChatCapabilityAssetCard info={capabilityAssetInfo} />}

      {localTrainingInfo && <ChatLocalTrainingCard info={localTrainingInfo} />}

      {experimentLedgerInfo && <ChatExperimentLedgerCard info={experimentLedgerInfo} />}

      {autoTrainingInfo && <ChatAutoTrainingCard info={autoTrainingInfo} />}

      {userAssetInfo && <ChatUserAssetCard info={userAssetInfo} />}

      {trainingWorkflowInfo && <ChatTrainingWorkflowCard info={trainingWorkflowInfo} />}

      {localGatewayInfo && <ChatLocalGatewayCard info={localGatewayInfo} />}

      {firstRunInfo && <ChatFirstRunCard info={firstRunInfo} />}


      {memoryInfo && (
        <details className="rounded-md border border-border/40 bg-muted/20 text-[10px] text-muted-foreground px-2 py-1.5">
          <summary className="cursor-pointer hover:text-foreground flex flex-wrap gap-x-2">
            <span>数列记忆：</span>
            <span>
              {memoryInfo.created
                ? `已生成 ${memoryInfo.unitCount} 条`
                : "本轮未生成"}
            </span>
            {memoryInfo.sequenceCodes[0] && (
              <>
                <span>·</span>
                <span>{memoryInfo.sequenceCodes[0]}</span>
              </>
            )}
            <span>·</span>
            <span>压缩率 {(memoryInfo.compressionRatio * 100).toFixed(0)}%</span>
            <span>·</span>
            <span>注入历史 {memoryInfo.injectedMemoryCount} 条</span>
            <span>·</span>
            <span>
              安全 {memoryInfo.safetyStatus === "PASS" ? "PASS" : memoryInfo.safetyStatus === "WARN" ? "已脱敏" : "已阻断"}
            </span>
          </summary>
          {memoryInfo.notes.length > 0 && (
            <div className="mt-1.5 space-y-0.5 border-t border-border/40 pt-1.5">
              {memoryInfo.notes.map((n, i) => (
                <div key={i}>· {n}</div>
              ))}
            </div>
          )}
        </details>
      )}

      {currencyInfo && (
        <details className="rounded-md border border-border/40 bg-muted/20 text-[10px] text-muted-foreground px-2 py-1.5">
          <summary className="cursor-pointer hover:text-foreground flex flex-wrap gap-x-2">
            <span>数列货币：</span>
            <span>{currencyInfo.recorded ? "已写入价值账本" : "未写入"}</span>
            {currencyInfo.providerName && (
              <>
                <span>·</span>
                <span>模型 {currencyInfo.providerName}{currencyInfo.modelId ? ` / ${currencyInfo.modelId}` : ""}</span>
              </>
            )}
            {typeof currencyInfo.latencyMs === "number" && (
              <>
                <span>·</span>
                <span>耗时 {formatLatency(currencyInfo.latencyMs)}</span>
              </>
            )}
            {typeof currencyInfo.tokenEstimate === "number" && (
              <>
                <span>·</span>
                <span>≈{currencyInfo.tokenEstimate} tok</span>
              </>
            )}
            {currencyInfo.chainSummary && (
              <>
                <span>·</span>
                <span>链 {currencyInfo.chainSummary}</span>
              </>
            )}
            <span>·</span>
            <span>账本 {currencyInfo.subjectMode}</span>
          </summary>
          <div className="mt-1.5 space-y-0.5 border-t border-border/40 pt-1.5">
            <div>贡献类型：{currencyInfo.contributionType}</div>
            {currencyInfo.awardedUnits.length > 0 && (
              <div>
                计量：{currencyInfo.awardedUnits.map((u) => `${u.unitType} +${u.amount}`).join(" · ")}
              </div>
            )}
            {currencyInfo.ledgerEntryIds.length > 0 && (
              <div className="font-mono text-[9px] opacity-70">
                条目 {currencyInfo.ledgerEntryIds.slice(0, 2).join(", ")}
              </div>
            )}
            <div className="opacity-70">
              数列货币为 Aetherworld 内部价值计量，不等于法币 / 证券 / 代币，不支持提现 / 真实交易 / 上链。
            </div>
            {currencyInfo.notes.length > 0 &&
              currencyInfo.notes.map((n, i) => <div key={i}>· {n}</div>)}
          </div>
        </details>
      )}

      {mslInfo && mslInfo.frames.length > 0 && (
        <details className="rounded-md border border-border/40 bg-muted/20 text-[10px] text-muted-foreground px-2 py-1.5">
          <summary className="cursor-pointer hover:text-foreground flex flex-wrap gap-x-2">
            <span>MSL 状态：</span>
            <span>共 {mslInfo.frames.length} 帧</span>
            {mslInfo.frames.map((f) => (
              <span key={f.id}>
                · {f.frameType}={f.status}
              </span>
            ))}
          </summary>
          <div className="mt-1.5 space-y-1.5 border-t border-border/40 pt-1.5">
            {mslInfo.frames.map((f) => (
              <pre
                key={f.id}
                className="whitespace-pre-wrap font-mono text-[9px] leading-snug opacity-90"
              >
                {f.mslCode}
              </pre>
            ))}
            {mslInfo.notes.length > 0 && (
              <div className="border-t border-border/40 pt-1">
                {mslInfo.notes.map((n, i) => (
                  <div key={i}>· {n}</div>
                ))}
              </div>
            )}
            <div className="opacity-70">
              MSL 为 Aetherworld 内部状态语言，不包含明文 secret / Full60 原始数列 / Founder-only 原文。
            </div>
          </div>
        </details>
      )}






      <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 min-h-[1.2em]">
        {data.answer || (streaming ? "正在生成……" : "")}
        {streaming && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-foreground/60 align-middle animate-pulse" />
        )}
      </div>

      {streaming && slowHint && (
        <div className="text-[11px] text-muted-foreground italic">{slowHint}</div>
      )}

      {errorText && (
        <div className="text-[11px] text-amber-500/90 pt-1 border-t border-border/40">
          {errorText}
        </div>
      )}

      {!streaming && data.answer && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
          <button
            onClick={handleCopy}
            className="text-[11px] px-2.5 py-1 rounded-md border border-border/60 hover:border-border hover:text-foreground text-muted-foreground"
          >
            复制
          </button>
        </div>
      )}

      {data.usedKnowledge && data.usedKnowledge.length > 0 && (
        <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/40">
          参考：{data.usedKnowledge.join(" · ")}
        </div>
      )}
    </div>
  );
}
