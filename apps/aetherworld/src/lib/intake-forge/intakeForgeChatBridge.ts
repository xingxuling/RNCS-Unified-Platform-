// 投喂铸造炉 · Chat Bridge
// 仅做意图识别 + 工坊说明卡片；不在 Chat 里真正吞掉粘贴/文件（避免误操作）。
import {
  INTAKE_ALLOWED_FILE_EXT,
  INTAKE_FORBIDDEN_FILE_EXT,
  INTAKE_MAX_FILES_PER_RUN,
  INTAKE_MAX_SINGLE_FILE_MB,
  INTAKE_MAX_TOTAL_TEXT_CHARS,
  INTAKE_SAFETY_ALLOWED,
  INTAKE_SAFETY_FORBIDDEN,
} from "./intakeSafetyPolicy";

export interface ChatIntakeForgeInfo {
  question: string;
  summary: string;
  focus: "OVERVIEW" | "PASTE" | "FILE" | "FOLDER" | "SAFETY" | "TRAINING";
  focusLabel: string;
  allowed: string[];
  forbidden: string[];
  limits: { maxFiles: number; maxFileMb: number; maxTotalChars: number };
  allowedExt: string[];
  forbiddenExt: string[];
  workbenchHint: string;
}

const TRIGGER_KEYWORDS = [
  "投喂", "投喂炉", "intake", "intake forge",
  "粘贴训练", "扔进来", "丢进来", "拖进来",
  "训练材料", "训练数据", "训练语料",
  "压缩对话", "chatgpt 导出", "导出对话",
  "Lovable Prompt", "lovable 返回",
  "项目文件夹", "整个文件夹", "整套项目",
  "脱敏", "样本候选", "评测候选",
];

export function detectIntakeForgeIntent(raw: string): boolean {
  if (!raw) return false;
  const lower = raw.toLowerCase();
  return TRIGGER_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
}

function pickFocus(raw: string): ChatIntakeForgeInfo["focus"] {
  const t = raw.toLowerCase();
  if (/文件夹|整个项目|整套项目|folder/.test(t)) return "FOLDER";
  if (/文件|file|上传|附件/.test(t)) return "FILE";
  if (/粘贴|paste|压缩对话|chatgpt 导出/.test(t)) return "PASTE";
  if (/脱敏|安全|敏感|secret/.test(t)) return "SAFETY";
  if (/训练任务|训练计划|样本|评测/.test(t)) return "TRAINING";
  return "OVERVIEW";
}

const FOCUS_LABEL: Record<ChatIntakeForgeInfo["focus"], string> = {
  OVERVIEW: "投喂炉总览",
  PASTE: "粘贴投喂",
  FILE: "文件投喂",
  FOLDER: "文件夹投喂",
  SAFETY: "安全策略",
  TRAINING: "训练任务建议",
};

const FOCUS_SUMMARY: Record<ChatIntakeForgeInfo["focus"], string> = {
  OVERVIEW:
    "投喂式训练数据铸造炉：你只负责粘贴 / 拖入 / 选择，工坊自动完成识别 → 脱敏 → 切片 → 样本 → 评测 → 任务建议。不会自动训练，不会自动上传。",
  PASTE:
    "把 ChatGPT 压缩对话、Lovable Prompt / 返回、MSL / 文档原文粘贴到 /system/intake-forge 的「粘贴投喂」区，提交后自动生成训练样本候选。",
  FILE:
    `在 /system/intake-forge 的「文件投喂」区选择允许后缀（${INTAKE_ALLOWED_FILE_EXT.join(", ")}）的文件，单文件最大 ${INTAKE_MAX_SINGLE_FILE_MB} MB。`,
  FOLDER:
    `在「文件夹投喂」区选择整个项目文件夹（仅处理允许后缀，最多 ${INTAKE_MAX_FILES_PER_RUN} 个文件 / 累计 ${INTAKE_MAX_TOTAL_TEXT_CHARS} 字符）。`,
  SAFETY:
    "脱敏自动屏蔽密钥 / token / Bearer / Full60 原始数列 / Founder-only 原文。.env / 私钥 / 可执行二进制文件不会被读取。",
  TRAINING:
    "每次投喂会按命中的 SourceType 自动建议训练任务草案（Lovable Handoff / Router / MSL / 架构吸收 / 世界语料 / QA 评测），仅生成草案，不会自动执行。",
};

export function buildChatIntakeForgeInfo(raw: string): ChatIntakeForgeInfo | undefined {
  if (!detectIntakeForgeIntent(raw)) return undefined;
  const focus = pickFocus(raw);
  return {
    question: raw,
    summary: FOCUS_SUMMARY[focus],
    focus,
    focusLabel: FOCUS_LABEL[focus],
    allowed: INTAKE_SAFETY_ALLOWED,
    forbidden: INTAKE_SAFETY_FORBIDDEN,
    limits: {
      maxFiles: INTAKE_MAX_FILES_PER_RUN,
      maxFileMb: INTAKE_MAX_SINGLE_FILE_MB,
      maxTotalChars: INTAKE_MAX_TOTAL_TEXT_CHARS,
    },
    allowedExt: INTAKE_ALLOWED_FILE_EXT,
    forbiddenExt: INTAKE_FORBIDDEN_FILE_EXT,
    workbenchHint: "打开 /system/intake-forge 进行投喂，工坊会自动完成整个流水线。",
  };
}
