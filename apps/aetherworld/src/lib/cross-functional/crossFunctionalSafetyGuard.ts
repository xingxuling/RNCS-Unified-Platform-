import type { CrossFunctionalOutput } from "./crossFunctionalOutputAdapter";

export interface CrossFunctionalSafetyFinding {
  code: string;
  message: string;
  severity: "INFO" | "WARN" | "BLOCK";
}

const RULES: Array<{ code: string; re: RegExp; message: string; severity: CrossFunctionalSafetyFinding["severity"] }> = [
  { code: "CURRENCY_FINANCIALIZATION", re: /(数列货币).*(炒|理财|股票|外汇|加密)/, message: "数列货币不能跨域成现实金融", severity: "BLOCK" },
  { code: "VIRTUAL_AS_REALITY", re: /(虚拟世界).*(预测现实|一定会发生)/, message: "虚拟世界不能跨域成现实预测", severity: "BLOCK" },
  { code: "CONSTANT_AS_LAW", re: /(常数宇宙).*(物理定律)/, message: "常数宇宙不能跨域成现实物理定律", severity: "BLOCK" },
  { code: "CONSTITUTION_AS_LAW", re: /(系统宪法).*(现实法律|诉讼)/, message: "系统宪法不能跨域成现实法律文件", severity: "BLOCK" },
  { code: "DEMO_REAL_CONFUSION", re: /(Demo).*(写入 Real|视为真实)/i, message: "Demo 内容不能跨域成 Real 内容", severity: "BLOCK" },
  { code: "FOUNDER_LEAK", re: /(Founder[- ]?only|founder 私密)/i, message: "Founder-only 不能跨域到公共输出", severity: "BLOCK" },
  { code: "OVERPROMISE", re: /(保证.*成功|绝对.*盈利)/, message: "不要给出绝对化承诺", severity: "WARN" },
];

export function runCrossFunctionalSafetyGuard(output: CrossFunctionalOutput): {
  findings: CrossFunctionalSafetyFinding[];
  blocked: boolean;
} {
  const blob = JSON.stringify(output);
  const findings: CrossFunctionalSafetyFinding[] = [];
  for (const r of RULES) {
    if (r.re.test(blob)) {
      findings.push({ code: r.code, message: r.message, severity: r.severity });
    }
  }
  return {
    findings,
    blocked: findings.some((f) => f.severity === "BLOCK"),
  };
}

export const CROSS_FUNCTIONAL_SAFETY_NOTE_TEXT =
  "跨功能调用遵守系统宪法：数列货币 ≠ 现实金融、虚拟世界 ≠ 现实预测、常数宇宙 ≠ 物理定律、系统宪法 ≠ 现实法律、Demo ≠ Real、Founder-only 不外泄。";
