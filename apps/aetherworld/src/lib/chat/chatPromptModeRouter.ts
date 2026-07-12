// Chat Prompt 模式路由
// 根据用户输入与意图判断本轮使用的 Prompt 模式，
// 不同模式注入不同强度的 system prompt，避免普通问答被重型上下文拖慢。
//
// 模式：
//   LIGHT_ANSWER     —— 普通问答、概念解释、自我介绍（默认）
//   TASK_PLANNING    —— 创建应用 / 项目 / 规划方案
//   CODE_TASK        —— 代码生成 / 检查 / 修复
//   WORLD_TASK       —— 世界、角色、音乐、叙事
//   GOVERNANCE_TASK  —— QA、安全、Bug Audit、系统宪法
import type { ChatIntentResult } from "./chatIntentResolver";

export type ChatPromptMode =
  | "LIGHT_ANSWER"
  | "TASK_PLANNING"
  | "CODE_TASK"
  | "WORLD_TASK"
  | "GOVERNANCE_TASK";

export const PROMPT_MODE_LABEL: Record<ChatPromptMode, string> = {
  LIGHT_ANSWER: "轻量问答",
  TASK_PLANNING: "任务规划",
  CODE_TASK: "代码任务",
  WORLD_TASK: "世界任务",
  GOVERNANCE_TASK: "治理任务",
};

const RE_CODE = /(代码|函数|bug|报错|修复|patch|typescript|javascript|python|编译|栈|stack trace)/i;
const RE_WORLD = /(世界|角色|剧情|叙事|音乐|场景|npc|角色卡|故事|剧本)/i;
const RE_GOV = /(qa|审计|宪法|安全|secret|密钥|脱敏|权限|合规|bug audit)/i;
const RE_PLAN = /(创建|生成|规划|搭建|做一个|做一份|方案|项目|应用|app|流程)/i;

export function resolvePromptMode(raw: string, intent?: ChatIntentResult): ChatPromptMode {
  const text = raw.trim();

  // 治理优先（避免被代码 / 规划误判）
  if (RE_GOV.test(text)) return "GOVERNANCE_TASK";
  if (RE_CODE.test(text)) return "CODE_TASK";
  if (RE_WORLD.test(text)) return "WORLD_TASK";

  // 规划：必须是明确"创建 / 生成 / 规划 / 做一个"，且不是单纯提问
  if (
    RE_PLAN.test(text) &&
    intent?.inputMode !== "ASK_MODE" &&
    text.length > 6
  ) {
    return "TASK_PLANNING";
  }

  return "LIGHT_ANSWER";
}

/** 构建对应模式的系统 prompt（保持简洁；重型上下文由各任务路径单独注入） */
export function buildSystemPrompt(mode: ChatPromptMode): string {
  switch (mode) {
    case "LIGHT_ANSWER":
      return [
        "你是 Aetherworld 的本地 AI 助手，当前通过本机 Ollama 模型运行。",
        "你可以回答问题、解释概念、协助规划、生成内容，并在需要时调用 Aetherworld 的应用、代码、商店、日历、工作区、社交和模型提供者能力。",
        "不要声称已经执行现实操作，除非系统明确返回执行结果。",
        "回答使用中文，简洁清楚。",
      ].join("\n");

    case "TASK_PLANNING":
      return [
        "你是 Aetherworld 的任务规划助手。",
        "Aetherworld 提供：应用运行时（App Runtime）、代码沙箱（Code Sandbox）、能力商店（WebXXM）、工作区（Workspace）、日历、社交、模型提供者。",
        "请把用户的目标拆成可执行步骤，并在合适位置标注调用哪个模块；不要假装已经执行。",
        "回答使用中文，结构清晰。",
      ].join("\n");

    case "CODE_TASK":
      return [
        "你是 Aetherworld 的代码助手。",
        "代码任务必须经过 Code Sandbox 与 QA；不要给出可能绕过 QA 或泄漏密钥的写法。",
        "返回代码使用合适的 Markdown 代码块，并简要说明改动点。",
        "回答使用中文。",
      ].join("\n");

    case "WORLD_TASK":
      return [
        "你是 Aetherworld 世界引擎的协作助手。",
        "请围绕世界、角色、叙事、音乐等结构化产出；不要破坏既有世界设定。",
        "回答使用中文。",
      ].join("\n");

    case "GOVERNANCE_TASK":
      return [
        "你是 Aetherworld 的治理与安全助手。",
        "回答必须服从 Secret Guard、QA 与系统宪法；遇到密钥 / Token / 敏感内容必须提醒脱敏，不得输出原文。",
        "回答使用中文，结构清晰。",
      ].join("\n");
  }
}
