export type Domain = "tian" | "di" | "ren" | "shen" | "feng";

export const DOMAIN_META: Record<
  Domain,
  { name: string; label: string; question: string; colorVar: string }
> = {
  tian: {
    name: "天",
    label: "时间 · 周期 · 窗口",
    question: "现在是不是窗口期？早了、迟了，还是正好？",
    colorVar: "var(--tian)",
  },
  di: {
    name: "地",
    label: "空间 · 资源 · 承载",
    question: "现实环境是否支持？资源、场域、身体是否到位？",
    colorVar: "var(--di)",
  },
  ren: {
    name: "人",
    label: "人物 · 关系 · 合作",
    question: "谁是关键人？谁是贵人？谁只是噪声？",
    colorVar: "var(--ren)",
  },
  shen: {
    name: "神",
    label: "主轴 · 意义 · 使命",
    question: "此事是否服务主体主线？",
    colorVar: "var(--shen)",
  },
  feng: {
    name: "风",
    label: "变局 · 流动 · 传播",
    question: "事件会如何加速、扩散、转向或消散？",
    colorVar: "var(--feng)",
  },
};

export const DOMAINS: Domain[] = ["tian", "di", "ren", "shen", "feng"];
