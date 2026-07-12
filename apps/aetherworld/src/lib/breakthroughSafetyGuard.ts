import { BREAKTHROUGH_SAFETY_RULES, MEDICAL_KEYWORDS, LEGAL_KEYWORDS, FINANCE_KEYWORDS } from "@/constants/breakthroughSafetyRules";
import type { SolutionPath } from "./solutionPathGenerator";
import type { ValidationPath } from "./validationPathGenerator";
import type { RecursiveResolveSuggestion } from "./recursiveReseolver";

export interface BreakthroughSafetyFinding {
  ruleId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
}

const ABSOLUTE_RE = /一定会|必然|绝对会|百分之百|稳赚|稳成/;
const FATE_RE = /命运注定|神已决定|不可逆/;
const OTHER_WILL_RE = /操控|控制别人|让对方必然/;

export function checkBreakthroughSafety(args: {
  inputText: string;
  path: SolutionPath;
  validation: ValidationPath;
  recursion: RecursiveResolveSuggestion[];
  beginner: boolean;
  outputText?: string;
}): BreakthroughSafetyFinding[] {
  const findings: BreakthroughSafetyFinding[] = [];
  const all = `${args.inputText} ${args.outputText ?? ""} ${args.path.recommendedActions.map(a => a.how + a.why).join(" ")}`;

  if (ABSOLUTE_RE.test(all)) findings.push(rule("NO_ABSOLUTE_PROMISE", "检测到绝对承诺类用词。"));
  if (FATE_RE.test(all))     findings.push(rule("NO_FATE_LANGUAGE", "检测到命运化绝对表达。"));
  if (OTHER_WILL_RE.test(all)) findings.push(rule("NO_OTHER_WILL_CONTROL", "检测到控制他人意志的表述。"));

  if (MEDICAL_KEYWORDS.some(k => args.inputText.includes(k)))
    findings.push(rule("MEDICAL_DISCLAIMER", "涉及医疗议题，需提示寻求专业医生。"));
  if (LEGAL_KEYWORDS.some(k => args.inputText.includes(k)))
    findings.push(rule("LEGAL_DISCLAIMER", "涉及法律议题，需提示寻求专业律师。"));
  if (FINANCE_KEYWORDS.some(k => args.inputText.includes(k)))
    findings.push(rule("FINANCE_DISCLAIMER", "涉及金融/投资议题，需提示风险与专业建议。"));

  if (!args.validation.successSignals.length) findings.push(rule("REQUIRE_VALIDATION_PATH", "缺少验证路径。"));
  if (!args.recursion.length) findings.push(rule("REQUIRE_RECURSIVE_PATH", "缺少失败后的下一轮路径。"));

  if (args.beginner && /常数|五域|缺口矩阵|计算法/.test(args.outputText ?? "")) {
    findings.push(rule("HIDE_ADVANCED_FOR_BEGINNER", "普通用户输出含高阶术语。"));
  }
  return findings;
}

function rule(id: string, message: string): BreakthroughSafetyFinding {
  const r = BREAKTHROUGH_SAFETY_RULES.find((x) => x.id === id)!;
  return { ruleId: id, severity: r.severity, message };
}

export const SAFETY_DISCLAIMERS = {
  short: "这是一个问题拆解工具，不是保证成功的机器。请把它当成帮你理清下一步的方法。",
  full:
    "万物破解计算法不是绝对答案生成器。它用于结构化拆解问题、生成行动路径和回验方式。" +
    "它不能保证现实一定成功，不替代专业医疗、法律、金融、投资或心理诊断建议。" +
    "它不能控制他人意志，也不能消除全部随机性。所有结果都需要现实验证。",
};
