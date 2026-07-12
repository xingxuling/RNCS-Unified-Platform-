// 大规模文件夹投喂 · Chat Bridge
import {
  FOLDER_INTAKE_SCALE_PRESETS,
  FOLDER_SCALE_LABEL,
  getCurrentFolderRun,
  type FolderIntakeScaleMode,
} from "./folderIntakeScale";

export const FOLDER_INTAKE_TRIGGERS: RegExp[] = [
  /文件夹投喂.*只有.*500/,
  /开启.*10\s*万.*文件/,
  /文件夹投喂上限/,
  /大语料.*处理到哪里/,
  /哪些文件被跳过/,
  /哪些文件被阻断/,
  /当前\s*batch\s*进度/i,
  /Full\s*Corpus.*吸收/i,
  /使用本地网关处理大文件夹/,
  /文件夹.*(规模|大小|数量).*限制/,
];

export function shouldRouteToFolderIntake(input: string): boolean {
  return FOLDER_INTAKE_TRIGGERS.some((r) => r.test(input));
}

export interface FolderIntakeScaleCard {
  kind: "FOLDER_INTAKE_SCALE_CARD";
  title: string;
  summary: string;
  modes: Array<{
    mode: FolderIntakeScaleMode;
    label: string;
    maxFiles: number;
    maxTotalChars: number;
    batchSize: number;
    requireLocalGatewayRecommended: boolean;
  }>;
  currentRun?: {
    id: string;
    mode: FolderIntakeScaleMode;
    folderName: string;
    status: string;
    totalFiles: number;
    eligibleFiles: number;
    skippedFiles: number;
    blockedFiles: number;
    processedFiles: number;
    completedBatchCount: number;
    batchCount: number;
    absorbedTokenEstimate: number;
    fullCorpusCandidateId?: string;
  };
  recommendation: string;
}

export function buildFolderIntakeScaleCard(): FolderIntakeScaleCard {
  const run = getCurrentFolderRun();
  const modes = (Object.keys(FOLDER_INTAKE_SCALE_PRESETS) as FolderIntakeScaleMode[]).map((m) => ({
    mode: m,
    label: FOLDER_SCALE_LABEL[m],
    maxFiles: FOLDER_INTAKE_SCALE_PRESETS[m].maxFiles,
    maxTotalChars: FOLDER_INTAKE_SCALE_PRESETS[m].maxTotalChars,
    batchSize: FOLDER_INTAKE_SCALE_PRESETS[m].batchSize,
    requireLocalGatewayRecommended: FOLDER_INTAKE_SCALE_PRESETS[m].requireLocalGatewayRecommended,
  }));

  const summary = run
    ? `当前任务 ${run.id} · ${FOLDER_SCALE_LABEL[run.mode]} · ${run.status} · ` +
      `已处理 ${run.processedFiles}/${run.eligibleFiles} 文件 / 吸收 ${run.absorbedTokenEstimate} token。`
    : "尚未启动文件夹投喂任务。文件夹投喂上限已升级：普通 1,000 / 大语料 100,000 / 创始人本地 500,000。";

  const recommendation = run?.mode === "FOUNDER_LOCAL"
    ? "建议启动 local-gateway 协同处理超大文件夹。"
    : "默认大语料模式即可处理 10 万文件级别目录。如需 50 万文件请切换创始人本地模式。";

  return {
    kind: "FOLDER_INTAKE_SCALE_CARD",
    title: "大规模文件夹投喂",
    summary,
    modes,
    currentRun: run
      ? {
          id: run.id,
          mode: run.mode,
          folderName: run.folderName,
          status: run.status,
          totalFiles: run.totalFiles,
          eligibleFiles: run.eligibleFiles,
          skippedFiles: run.skippedFiles,
          blockedFiles: run.blockedFiles,
          processedFiles: run.processedFiles,
          completedBatchCount: run.completedBatchCount,
          batchCount: run.batchCount,
          absorbedTokenEstimate: run.absorbedTokenEstimate,
          fullCorpusCandidateId: run.fullCorpusCandidateId,
        }
      : undefined,
    recommendation,
  };
}
