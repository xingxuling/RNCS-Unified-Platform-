// 文案版本生成器
import type { CopyGenerationInput } from "./copywritingGenerationCalculus";
import type { CopywritingStyle } from "@/constants/copywritingStyles";
import type { CopywritingTarget } from "@/constants/copywritingTargets";
import { COPY_REPLACEMENTS } from "@/constants/copySafetyRules";

export interface CopyVariant {
  id: string;
  title?: string;
  body: string;
  style: string;
  targetUser: string;
  channel: string;
  safetyNote?: string;
}

interface BuildArgs {
  input: CopyGenerationInput;
  style: CopywritingStyle;
  target?: CopywritingTarget;
}

const SAFETY_NOTE_SHORT = "本系统提供结构化判断与时间窗口建议，不构成医疗、法律、金融或心理诊断意见。";
const SAFETY_NOTE_FULL60 = "深度个人模型读取你的完整结构数列，请在私密环境中使用。";

export function generateVariants({ input, style, target }: BuildArgs): CopyVariant {
  const id = `${input.target}-${style.id}-${Date.now().toString(36)}`;
  const concepts = input.sourceConcepts.length ? input.sourceConcepts.join("、") : "你的当前结构";
  let title: string | undefined;
  let body: string;

  switch (input.target) {
    case "HOMEPAGE_HERO":
      title = pickTitle(style.id, [
        "把模糊的状态，变成可读的判断",
        "你不是不会决定，只是缺一张结构地图",
        "Decision OS · 把信号变成下一步",
      ]);
      body = style.id === "HIGH_CONCEPT"
        ? "Aether 是一个面向个人的结构化判断系统：把母体数列、常数与回验编译成可以使用的趋势与时间窗口。"
        : "把复杂的情绪和事件，整理成可以判断的下一步。";
      break;
    case "BEGINNER_ONBOARDING":
      title = "三分钟开始你的第一次判断";
      body = "我们会先生成一个轻量个人模型；你可以随时停下、随时回来。这里没有命运，只有结构。";
      break;
    case "DEMO_EXPLANATION":
      body = "你看到的内容来自 Demo 数据，不代表你本人。它用来展示系统如何工作。";
      break;
    case "PREDICTION_DETAIL_COPY":
      body = `这是基于 ${concepts} 的当前判断：可能表现为某种倾向，请结合记录结果一起观察。`;
      break;
    case "FEEDBACK_EXPLANATION":
      body = "记录你这次实际发生的事，是让系统更贴合你的关键步骤。哪怕只是一行字，也算。";
      break;
    case "FULL60_PRIVACY_COPY":
      body = "深度个人模型会读取你的完整结构数列，请只在私密环境中使用。";
      break;
    case "FOUNDER_MODE_COPY":
      body = "Founder Mode 是创始人后台，普通用户不会看到这里的设置。";
      break;
    case "ENCYCLOPEDIA_ENTRY":
      title = `关于 ${concepts}`;
      body = `普通解释：${concepts} 指的是…\n专业解释：${concepts} 的结构基础是…\n相关：可以同时查看「定没定」「回验」「Safety Boundary」。`;
      break;
    case "XIAOHONGSHU_TITLE":
      title = pickTitle(style.id, [
        "我用一个系统替自己「先定没定」",
        "原来犹豫不是性格，是结构没读懂",
        "停止内耗，从一张个人结构图开始",
      ]);
      body = title ?? "";
      break;
    case "XIAOHONGSHU_POST":
      body = `${pickTitle(style.id, ["我最近发现自己一直在「等一个信号」", "原来犹豫，是因为结构没读懂"])}
我开始用 Aether 把当前状态变成一张可以读的结构图，
比起算命，更像「这件事到底定没定」的判断面板。
评论区聊聊你最近最想知道「定没定」的那件事。`;
      break;
    case "ENTERPRISE_SAFE_COPY":
      title = "Decision OS · 为关键决策提供结构化判断";
      body = "我们把信号、风险窗口、回验循环组合成可审计的判断流程，不涉及命运叙事，也不替代专业意见。";
      break;
    case "INVESTOR_PITCH_COPY":
      body = "我们正在构建个人 Decision OS：母体结构 + 常数宇宙 + 回验权重，形成可复用的结构化判断引擎，目标是替代「靠感觉决定」。";
      break;
    case "IN_APP_MICROCOPY":
      body = pickTitle(style.id, ["先小步推进", "记录一下结果", "再看一眼信号"]);
      break;
    case "ERROR_EMPTY_STATE":
      body = "这里还没有内容。先从一个最小动作开始，比如生成一个轻量模型。";
      break;
    case "CTA_COPY":
      body = pickTitle(style.id, ["生成我的轻量模型", "继续", "查看下一步"]);
      break;
    case "SAFETY_BOUNDARY_COPY":
      body = SAFETY_NOTE_SHORT;
      break;
    case "WORLD_REPORT_COPY":
      title = "你的个人世界报告";
      body = `这是基于 ${concepts} 生成的象征性个人世界。它不是真实宇宙，也不是绝对命运，而是把你当前的结构投射成一张可阅读的世界地图。`;
      break;
    case "QUEST_DESCRIPTION":
      body = `在「${concepts}」推进当前阶段的小步任务。完成后记得回验结果。`;
      break;
    case "NPC_DIALOGUE":
      body = `「我不是你现实里的某个人。我是你结构里反复出现的一种角色。」`;
      break;
    default:
      body = `（${style.name}）针对「${input.target}」生成的文案：${concepts}。`;
  }

  // 风格微调
  if (style.id === "ACTION_ORIENTED" && !body.includes("下一步")) body += " 下一步：记录结果并继续。";
  if (style.id === "ENTERPRISE_SAFE") body = body.replace(/命运|算命|玄学/g, "结构判断");
  if (style.id === "MICROCOPY" && body.length > 40) body = body.slice(0, 38) + "…";

  // 安全替换提示（不修改 body，只在 safetyNote 里提示）
  const replacementHints = COPY_REPLACEMENTS.filter(r => body.includes(r.from))
    .map(r => `建议替换：${r.from} → ${r.to}`);

  const safetyNote = target?.requiresSafetyNote
    ? (input.target === "FULL60_PRIVACY_COPY" ? SAFETY_NOTE_FULL60 : SAFETY_NOTE_SHORT)
    : replacementHints[0];

  return {
    id, title, body, style: style.name,
    targetUser: input.targetUser, channel: input.channel, safetyNote,
  };
}

function pickTitle(styleId: string, choices: string[]): string {
  const idx = Math.abs(hash(styleId)) % choices.length;
  return choices[idx];
}
function hash(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}
