import type { FreeInputTypeId } from "@/constants/free-input/freeInputTypes";

export interface NormalizedFreeInput {
  rawText: string;
  cleanedText: string;
  detectedLanguage: string;
  inputType: FreeInputTypeId;
  possibleIntents: string[];
  entities: string[];
  numbersOrSequences: string[];
  userProvidedContext: string;
  noiseLevel: number;
  urgencyLevel: number;
}

const PLATFORM_TOKENS = ["Lovable", "Codex", "Suno", "Udio", "Godot", "Unity", "小红书", "微信", "GitHub"];
const MODULE_TOKENS = ["MSL", "Omni", "Sequence AI", "数列人工智能", "数列世界", "声乐", "翻译", "万物本身", "万物破解", "虚拟生活"];

function detectLanguage(text: string): string {
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[éèàâçùœîôû]/i.test(text)) return "fr";
  if (/[\u4e00-\u9fff]/.test(text)) return /[國學寫繁體聲]/.test(text) ? "zh-HK" : "zh-CN";
  if (/[a-z]/i.test(text)) return "en";
  return "zh-CN";
}

function detectSequences(text: string): string[] {
  const out: string[] = [];
  const m = text.match(/\b\d{5}(?:\s*\d{5})*\b/g);
  if (m) out.push(...m);
  const blockM = text.match(/BLOCK\s*\d+(?:\.\.\d+)?/gi);
  if (blockM) out.push(...blockM);
  return out;
}

function detectEntities(text: string): string[] {
  const out = new Set<string>();
  [...PLATFORM_TOKENS, ...MODULE_TOKENS].forEach((tok) => {
    if (text.toLowerCase().includes(tok.toLowerCase())) out.add(tok);
  });
  return Array.from(out);
}

function classifyInputType(text: string): FreeInputTypeId {
  const t = text.trim();
  if (t.length === 0) return "UNKNOWN";
  if (detectSequences(t).length > 0) return "NUMBER_SEQUENCE";
  if (/(bug|报错|找不到|崩了|错误)/i.test(t)) return "BUG_REPORT";
  if (/(用户|流程|体验).{0,10}(复杂|看不懂|难)/i.test(t)) return "PRODUCT_FEEDBACK";
  if (/(写.{0,6}剧情|漫画|脚本|章节)/i.test(t)) return "CREATIVE_REQUEST";
  if (/(代码|打包|安卓|编译|sdk|api)/i.test(t)) return "TECH_REQUEST";
  if (/(翻译|翻成|translate|英文|日文|韩文|法文|繁体)/i.test(t)) return "TRANSLATION_REQUEST";
  if (/(歌|唱|声线|suno|udio|歌词|音乐)/i.test(t)) return "MUSIC_REQUEST";
  if (/(模型|schema|结构|字段)/i.test(t)) return "MODEL_REQUEST";
  if (/(我.{0,4}(乱|焦虑|累|烦|崩溃|纠结))/i.test(t)) return "EMOTIONAL_STATE";
  const verbs = (t.match(/(分析|生成|翻译|写|做|检查|导出|改写|总结|拆)/g) ?? []).length;
  if (verbs >= 2) return "MIXED_TASK";
  if (t.length > 160) return "LONG_CONTEXT";
  if (t.length <= 40 && /[？?吗呢]/.test(t)) return "SHORT_QUESTION";
  if (t.length <= 60) return "RAW_IDEA";
  return "LONG_CONTEXT";
}

function noise(text: string): number {
  const punct = (text.match(/[。.!！?？,，；;~～]/g) ?? []).length;
  const total = text.length || 1;
  return Math.min(1, punct / total * 4);
}

function urgency(text: string): number {
  if (/(马上|立刻|尽快|急|现在就要|asap)/i.test(text)) return 1;
  if (/(今天|今晚|本周)/i.test(text)) return 0.6;
  return 0.2;
}

export function normalizeFreeInput(raw: string): NormalizedFreeInput {
  const trimmed = raw.replace(/\u00A0/g, " ").trim();
  const cleaned = trimmed.replace(/[ \t]+/g, " ").replace(/\s+\n/g, "\n");
  const lang = detectLanguage(cleaned);
  const seqs = detectSequences(cleaned);
  const entities = detectEntities(cleaned);

  const intents: string[] = [];
  if (/(分析|看看|拆)/.test(cleaned)) intents.push("ANALYZE");
  if (/(怎么办|该不该|要不要|怎么做)/.test(cleaned)) intents.push("ASK", "SOLVE");
  if (/(生成|做.{0,3}个|帮我做|create|generate)/i.test(cleaned)) intents.push("GENERATE");
  if (/(翻译|translate)/i.test(cleaned)) intents.push("TRANSLATE");
  if (/(解释|是什么|定义)/i.test(cleaned)) intents.push("EXPLAIN");
  if (/(提示词|prompt)/i.test(cleaned)) intents.push("GENERATE");
  if (/(导出|export)/i.test(cleaned)) intents.push("EXPORT");
  if (/(检查|审计|缺什么)/.test(cleaned)) intents.push("AUDIT");
  if (/(模型|schema)/i.test(cleaned)) intents.push("MODEL");
  if (intents.length === 0) intents.push("ASK");

  return {
    rawText: raw,
    cleanedText: cleaned,
    detectedLanguage: lang,
    inputType: classifyInputType(cleaned),
    possibleIntents: Array.from(new Set(intents)),
    entities,
    numbersOrSequences: seqs,
    userProvidedContext: cleaned.length > 80 ? cleaned.slice(0, 200) : "",
    noiseLevel: noise(cleaned),
    urgencyLevel: urgency(cleaned),
  };
}
