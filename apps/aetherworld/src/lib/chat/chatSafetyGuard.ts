import { CHAT_BLOCK_KEYWORDS } from "@/constants/chat/chatSafetyRules";

export interface ChatSafetyVerdict {
  status: "PASS" | "WARN" | "BLOCK";
  reasons: string[];
}

export function evaluateChatSafety(raw: string): ChatSafetyVerdict {
  const lower = raw.toLowerCase();
  const reasons: string[] = [];
  let status: ChatSafetyVerdict["status"] = "PASS";
  for (const kw of CHAT_BLOCK_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      status = "BLOCK";
      reasons.push(`命中安全黑名单：${kw}`);
    }
  }
  if (status === "PASS" && /(实盘|真实交易|医疗诊断|法律最终)/.test(lower)) {
    status = "WARN";
    reasons.push("涉及高风险领域，仅作模拟与建议，不做最终判断。");
  }
  return { status, reasons };
}
