// 五域判词生成器 · 把 TriggerResult 翻译成可读判断
import type { TriggerResult } from "./predictionEngine";
import type { Domain } from "@/constants/types";

export interface FiveDomainJudgment {
  tian: string;
  di: string;
  ren: string;
  shen: string;
  feng: string;
  summary: string; // 总断：进/守/转/断
}

const SUMMARY_OF = (t: TriggerResult): string => {
  const a = t.actionKey;
  if (["jin", "fabu", "hezuo", "goutong"].includes(a)) return "进中带守";
  if (["zhuan"].includes(a)) return "转";
  if (["duan", "qingli", "jujue"].includes(a)) return "断";
  if (["huifu", "bucai", "dengdai"].includes(a)) return "守";
  return "守";
};

function tianText(t: TriggerResult): string {
  const p = t.phase.name;
  if (t.phase.energy === "rising") return `窗口正在打开，处于${p}相位，时机可操作。`;
  if (t.phase.energy === "peak") return `时间场达到${p}高峰，强显化窗口，但已临近转折。`;
  if (t.phase.energy === "falling") return `时间场进入${p}降频段，宜回收而不是扩张。`;
  if (t.phase.energy === "void") return `进入${p}空位，旧结构正在结束，未到新启动期。`;
  return `处于${p}萌芽段，结构尚未成型，宜培育不宜公开。`;
}

function diText(t: TriggerResult): string {
  const di = t.domainScores.di;
  if (di >= 70) return "现实场域承载力强，资源、制度、身体三条线之一可被调用。";
  if (di >= 40) return "场域中等承载，需在资源与制度之间做出选择。";
  return "场域承载偏弱，不宜在此时大幅扩张现实承诺。";
}

function renText(t: TriggerResult): string {
  const ren = t.domainScores.ren;
  if (ren >= 70) return "关键人物变量被激活，弱连接 / 旧关系中可能出现实质推进者。";
  if (ren >= 40) return "人物结构温和，可主动发起一次有目的的对话。";
  return "人际信号较弱，不宜把当下结果归因到关系层。";
}

function shenText(t: TriggerResult, mainline: string): string {
  const shen = t.domainScores.shen;
  if (shen >= 70) return `事件高度服务主线：「${mainline}」。`;
  if (shen >= 40) return `事件部分服务主线「${mainline}」，需自行判断核心相关度。`;
  return "事件偏离主线，注意不要被短期信号牵走主轴。";
}

function fengText(t: TriggerResult): string {
  const feng = t.domainScores.feng;
  if (feng >= 70) return "变局位强烈，可能通过一次沟通、发布、邀约或突发事件触发。";
  if (feng >= 40) return "存在中等流动性，事件可能以缓和方式扩散。";
  return "流动性低，事件偏静态，发展需要外力推动。";
}

export function judgeFiveDomain(
  t: TriggerResult,
  mainline: string,
): FiveDomainJudgment {
  return {
    tian: tianText(t),
    di: diText(t),
    ren: renText(t),
    shen: shenText(t, mainline),
    feng: fengText(t),
    summary: SUMMARY_OF(t),
  };
}

export const DOMAIN_KEYS: Domain[] = ["tian", "di", "ren", "shen", "feng"];
