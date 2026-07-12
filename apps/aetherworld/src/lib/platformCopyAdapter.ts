// 平台文案适配器
import type { CopyVariant } from "./copyVariantGenerator";
import { getChannel } from "@/constants/copywritingChannels";

export function adaptForPlatform(v: CopyVariant, channelId: string): CopyVariant {
  const ch = getChannel(channelId);
  if (!ch) return v;
  let body = v.body;

  // 渠道禁词过滤（柔性替换）
  for (const w of ch.forbiddenWords) {
    if (body.includes(w)) body = body.split(w).join("…");
  }

  if (channelId === "XIAOHONGSHU") {
    if (!body.includes("评论") && !body.includes("收藏")) {
      body = body + "\n评论区聊聊你的想法。";
    }
  }
  if (channelId === "ENTERPRISE_DECK" || channelId === "INVESTOR_PITCH") {
    body = body.replace(/命运|算命|玄学|天定/g, "结构判断");
    if (!body.includes("不替代") && !body.includes("不构成")) {
      body += "\n本系统提供结构化判断，不替代专业意见。";
    }
  }
  if (channelId === "ENCYCLOPEDIA") {
    if (!body.includes("相关")) body += "\n相关条目：Safety Boundary、回验、Demo Persona。";
  }
  if (channelId === "EXPORT_REPORT") {
    if (!body.includes("不代表")) body += "\n本报告基于结构化模型生成，不代表真实未来必然发生。";
  }
  if (channelId === "IN_APP" && body.length > 120) body = body.slice(0, 118) + "…";

  return { ...v, body, channel: channelId };
}

export function buildXhsPackage(v: CopyVariant): {
  title: string; body: string; altTitles: string[]; tags: string[]; commentHook: string; fitScore: number;
} {
  return {
    title: v.title ?? "我用一个系统替自己「先定没定」",
    body: v.body,
    altTitles: [
      "原来犹豫不是性格，是结构没读懂",
      "停止内耗：先把结构画出来",
      "比起算命，我更想要一个能判断的系统",
    ],
    tags: ["#个人世界", "#信号系统", "#不算命", "#结构化判断", "#决策"],
    commentHook: "评论区聊聊你最近最想知道「定没定」的那件事。",
    fitScore: 78,
  };
}
