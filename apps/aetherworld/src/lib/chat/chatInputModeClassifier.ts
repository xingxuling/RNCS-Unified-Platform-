// 把用户输入分类为 ASK / DO / ASK_TO_DO / MIXED
import type { ChatInputMode } from "@/constants/chat/chatIntentTypes";

const ASK_RX = /(是什么|什么意思|为什么|怎么理解|有什么区别|对比|解释|介绍|分析|诊断|看看|缺什么|有什么用|有哪些|如何理解|status|怎么样|如何评价|是不是)/i;
const ASK_HOW_RX = /(怎么做|如何做|该怎么|应该怎么|步骤是|流程是|how to|how do|下一步)/i;
const FEASIBILITY_RX = /(能不能|可不可以|能否|可否|可行|值不值得|要不要|是否应该|是否能|能做吗)/i;
const DO_VERB_RX = /^(做|创建|新建|生成|帮我创建|帮我生成|帮我做|帮我打开|打开|跑|运行|执行|检查|安装|下载|启用|禁用|卸载|导出|保存|编辑|修改|删除|开始)/i;
const DO_HINT_RX = /(创建一个|新建一个|做一个|生成一个|帮我生成|帮我创建|帮我做|跑一下|执行一下|开始执行)/i;
const MIXED_RX = /(分析.*(并|然后|再).*(生成|创建|运行|修复|执行)|(诊断|定位).*(并|然后).*(修复|生成)|先.*再.*)/i;

const QUESTION_MARK_RX = /[?？]\s*$/;

export interface ChatInputModeResult {
  mode: ChatInputMode;
  rationale: string;
  isQuestion: boolean;
  hasDoVerb: boolean;
}

export function classifyChatInputMode(raw: string): ChatInputModeResult {
  const text = raw.trim();
  const isQuestion = QUESTION_MARK_RX.test(text) || ASK_RX.test(text);
  const hasDoVerb = DO_VERB_RX.test(text) || DO_HINT_RX.test(text);

  if (MIXED_RX.test(text) || (isQuestion && hasDoVerb)) {
    return { mode: "MIXED_MODE", rationale: "同时包含分析和执行诉求。", isQuestion, hasDoVerb };
  }
  if (FEASIBILITY_RX.test(text) || (ASK_HOW_RX.test(text) && !hasDoVerb)) {
    return { mode: "ASK_TO_DO_MODE", rationale: "在询问可行性或下一步方案。", isQuestion: true, hasDoVerb };
  }
  if (hasDoVerb && !isQuestion) {
    return { mode: "DO_MODE", rationale: "包含明确的执行动词。", isQuestion, hasDoVerb };
  }
  if (isQuestion) {
    return { mode: "ASK_MODE", rationale: "识别为提问/解释类输入。", isQuestion, hasDoVerb };
  }
  // 默认：当作 ASK，避免误触发执行
  return { mode: "ASK_MODE", rationale: "未识别明确执行意图，按提问处理。", isQuestion: false, hasDoVerb: false };
}
