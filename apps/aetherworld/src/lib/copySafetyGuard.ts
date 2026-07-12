// 文案安全守护
import { scanCopySafety, type CopySafetyScanResult } from "@/constants/copySafetyRules";

export function runCopySafetyGuard(
  text: string, opts?: { needsSafetyNote?: boolean; channel?: string; targetUser?: string },
): CopySafetyScanResult & { recommendations: string[] } {
  const r = scanCopySafety(text, opts);
  const recs: string[] = [];
  if (opts?.needsSafetyNote && !text.includes("不构成") && !text.includes("仅供参考")) {
    recs.push("缺少 Safety Boundary：建议追加一句免责说明。");
  }
  if (opts?.channel === "ENTERPRISE_DECK" && /(命运|算命|玄学)/.test(text)) {
    recs.push("企业渠道命中命运化术语，建议改为「结构判断 / 时间窗口」。");
  }
  if (opts?.channel === "XIAOHONGSHU" && /(立即购买|限时秒杀|马上抢|扫码下单)/.test(text)) {
    recs.push("小红书广告感过强，建议改为「评论区聊聊 / 可以收藏后慢慢看」。");
  }
  return { ...r, recommendations: recs };
}
