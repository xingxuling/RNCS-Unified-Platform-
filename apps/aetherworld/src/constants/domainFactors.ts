export type FoldDomainKey =
  | "tian" | "di" | "ren" | "shen" | "feng"
  | "resource" | "body" | "institution" | "noise";

export interface FoldDomain {
  key: FoldDomainKey;
  name: string;
  en: string;
  question: string;
  isNegative?: boolean;
}

export const FOLD_DOMAINS: FoldDomain[] = [
  { key: "tian",        name: "天域",   en: "Time",        question: "时间窗口是否到位？" },
  { key: "di",          name: "地域",   en: "Field",       question: "场域是否承载？" },
  { key: "ren",         name: "人域",   en: "People",      question: "关键人是否在位？" },
  { key: "shen",        name: "神域",   en: "Mainline",    question: "是否服务主线？" },
  { key: "feng",        name: "风域",   en: "Flow",        question: "是否有流动/触发？" },
  { key: "resource",    name: "资源域", en: "Resource",    question: "资源/金钱/平台是否到位？" },
  { key: "body",        name: "身体域", en: "Body",        question: "身体/算力是否支持？" },
  { key: "institution", name: "制度域", en: "Institution", question: "制度/合同/合规是否通过？" },
  { key: "noise",       name: "噪声域", en: "Noise",       question: "干扰/误解/延迟有多大？", isNegative: true },
];
