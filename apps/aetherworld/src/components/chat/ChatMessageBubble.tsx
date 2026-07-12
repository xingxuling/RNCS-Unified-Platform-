import { Link } from "@tanstack/react-router";
import type { ChatMessage } from "@/lib/chat/chatMessageEngine";
import { ChatQaStatusBadge } from "./ChatQaStatusBadge";
import { ChatRouteCard } from "./ChatRouteCard";
import { ChatRunResultCard } from "./ChatRunResultCard";
import { ChatObjectCard } from "./ChatObjectCard";
import { ChatCapabilityInstallCard } from "./ChatCapabilityInstallCard";
import { ChatSuggestedActions } from "./ChatSuggestedActions";
import { ChatAnswerCard } from "./ChatAnswerCard";
import { ChatAskToDoCard } from "./ChatAskToDoCard";
import { ChatConfirmCard } from "./ChatConfirmCard";
import { ChatWebCodeMResultCard } from "./ChatWebCodeMResultCard";
import { ChatDisplayResultRenderer } from "./results/ChatDisplayResultRenderer";
import { defaultHandleResultAction } from "@/lib/chat/chatResultPersistenceBridge";
import { runWebCodeM } from "@/lib/web-codem/webCodeMRuntime";


interface Props {
  message: ChatMessage;
  onAction?: (route?: string) => void;
}

export function ChatMessageBubble({ message, onAction }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
        {message.text && (
          <div
            className={[
              "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
              isUser
                ? "bg-foreground text-background"
                : "bg-card/70 border border-border/50 text-foreground",
            ].join(" ")}
          >
            {message.text}
          </div>
        )}

        {message.type === "DISPLAY_RESULT" && message.displayResult && (
          <ChatDisplayResultRenderer
            result={message.displayResult}
            onAction={(action, result) => {
              defaultHandleResultAction(action, result, (r) => onAction?.(r));
              if (action.actionType === "RUN" && action.payload) {
                const p = action.payload as { taskType?: string; target?: "CODEX" | "CURSOR" | "LOVABLE"; rawInput?: string; runner?: string };
                if (p.taskType) {
                  const input = p.rawInput || result.summary;
                  runWebCodeM(input, {
                    taskType: p.taskType as never,
                    handoffTarget: p.target,
                  });
                  onAction?.("/chat");
                }
              }
            }}
          />
        )}

        {message.type === "ANSWER_CARD" && message.answerCard && (
          <ChatAnswerCard
            data={message.answerCard}
            streaming={message.streaming}
            source={message.source}
            errorText={message.errorText}
            slowHint={message.slowHint}
            providerInfo={message.providerInfo}
            calculusInfo={message.calculusInfo}
            fusionInfo={message.fusionInfo}
            memoryInfo={message.memoryInfo}
            currencyInfo={message.currencyInfo}
            mslInfo={message.mslInfo}
            predictionInfo={message.predictionInfo}
            schedulerInfo={message.schedulerInfo}
            legacyInfo={message.legacyInfo}
            agentInfo={message.agentInfo}
            sequenceAiInfo={message.sequenceAiInfo}
            manualInfo={message.manualInfo}
            recordInfo={message.recordInfo}
            openArchInfo={message.openArchInfo}
            networkInfo={message.networkInfo}
            projectFusionInfo={message.projectFusionInfo}
            imaginativeFusionInfo={message.imaginativeFusionInfo}
            layerAuditInfo={message.layerAuditInfo}
            personalModelForgeInfo={message.personalModelForgeInfo}
            trainingFactoryCalculusInfo={message.trainingFactoryCalculusInfo}
            intakeForgeInfo={message.intakeForgeInfo}
            datasetInfo={message.datasetInfo}
            capabilityAssetInfo={message.capabilityAssetInfo}
            localTrainingInfo={message.localTrainingInfo}
            experimentLedgerInfo={message.experimentLedgerInfo}
            autoTrainingInfo={message.autoTrainingInfo}
            userAssetInfo={message.userAssetInfo}
            trainingWorkflowInfo={message.trainingWorkflowInfo}
            localGatewayInfo={message.localGatewayInfo}
            firstRunInfo={message.firstRunInfo}
          />
        )}

        {message.type === "ASK_TO_DO_CARD" && message.askToDoCard && (
          <ChatAskToDoCard data={message.askToDoCard} onAction={(r) => onAction?.(r)} />
        )}

        {message.type === "ANALYSIS_CARD" && message.text && (
          <div className="rounded-xl border border-border/50 bg-card/60 p-3 text-xs whitespace-pre-wrap leading-relaxed text-muted-foreground">
            {message.text}
          </div>
        )}

        {message.type === "WEBCODEM_RESULT" && message.webCodeMResult && (
          <ChatWebCodeMResultCard
            data={message.webCodeMResult}
            onAction={(a) => {
              if (a.route) { onAction?.(a.route); return; }
              const payload = a.payload as { taskType?: string; target?: "CODEX" | "CURSOR" | "LOVABLE" } | undefined;
              if (payload?.taskType) {
                runWebCodeM(message.webCodeMResult?.run.rawInput ?? "继续", {
                  taskType: payload.taskType as never,
                  handoffTarget: payload.target,
                });
                onAction?.("/chat");
              }
            }}
          />
        )}


        {message.type === "CONFIRMATION_REQUIRED" && message.confirmation && (
          <ChatConfirmCard data={message.confirmation} />
        )}

        {message.type === "ERROR_BLOCKED" && message.blockedReasons && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs space-y-1">
            <div className="flex items-center gap-2 text-rose-300 font-medium">
              <ChatQaStatusBadge status="BLOCK" /> 已阻断
            </div>
            <ul className="list-disc pl-4 text-rose-200/80 space-y-0.5">
              {message.blockedReasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}


        {message.type === "PAGE_NAVIGATION" && message.routeTarget && (
          <ChatRouteCard
            route={message.routeTarget.route}
            label={message.routeTarget.label}
            reason={message.routeTarget.reason}
            onOpen={() => onAction?.(message.routeTarget?.route)}
          />
        )}

        {(message.type === "CAPABILITY_INSTALL_REQUIRED" ||
          message.type === "CAPABILITY_REQUIRED" ||
          message.type === "CAPABILITY_DOWNLOAD_REQUIRED") &&
          (message.capability || message.routeTarget) && (
            <ChatCapabilityInstallCard
              capabilityId={message.capability?.capabilityId ?? "WEBXXM"}
              installed={message.capability?.installed ?? false}
              enabled={message.capability?.enabled ?? false}
              storeRoute={message.capability?.storeRoute ?? message.routeTarget?.route ?? "/webxxm-store"}
              message={message.text}
              lifecycleStage={message.capability?.lifecycleStage}
              packageId={message.capability?.packageId}
              onOpen={(r) => onAction?.(r)}
            />
          )}

        {message.type === "RUNTIME_RUN_RESULT" && message.runResult && (
          <ChatRunResultCard
            runId={message.runResult.runId}
            runType={message.runResult.runType}
            status={message.runResult.status}
            summary={message.runResult.summary}
            qaStatus={message.runResult.qaStatus}
            createdObjectId={message.runResult.createdObjectId}
            onOpen={(r) => onAction?.(r)}
          />
        )}

        {message.type === "OBJECT_CREATED" && message.objectInfo && (
          <ChatObjectCard
            objectId={message.objectInfo.objectId}
            objectType={message.objectInfo.objectType}
            title={message.objectInfo.title}
            summary={message.objectInfo.summary}
            onOpen={() => onAction?.("/objects")}
          />
        )}

        {message.type === "QA_RESULT" && message.qaInfo && (
          <div className="rounded-xl border border-border/40 bg-card/40 p-3 text-xs flex items-center gap-2">
            <ChatQaStatusBadge status={message.qaInfo.status} />
            <span className="text-muted-foreground">
              {message.qaInfo.reasons.length ? message.qaInfo.reasons.join("；") : "无违反项"}
            </span>
            <Link to="/system-audit" className="ml-auto text-foreground/70 hover:text-foreground underline-offset-2 hover:underline">
              查看 QA
            </Link>
          </div>
        )}

        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <ChatSuggestedActions actions={message.suggestedActions} onAction={(r) => onAction?.(r)} />
        )}
      </div>
    </div>
  );
}
