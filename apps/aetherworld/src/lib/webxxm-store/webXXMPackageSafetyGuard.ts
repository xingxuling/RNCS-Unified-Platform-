import { WEBXXM_PACKAGE_SAFETY_RULES } from "@/constants/webxxm-store/webXXMPackageSafetyRules";
import { CURRENT_AETHER_VERSION } from "@/constants/webxxm-store/webXXMCompatibilityRules";
import type { WebXXMPackageManifest } from "./webXXMStoreTypes";
import { listInstalled } from "./webXXMPackageRegistry";

export interface PackageCheckIssue {
  ruleId: string;
  severity: "INFO" | "WARN" | "FAIL" | "CRITICAL";
  message: string;
}
export interface PackageCheckReport {
  status: "PASS" | "WARN" | "FAIL" | "BLOCKED";
  issues: PackageCheckIssue[];
  canInstall: boolean;
}

function semverGte(a: string, b: string) {
  const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  return true;
}

export function checkCompatibility(m: WebXXMPackageManifest): PackageCheckReport {
  const issues: PackageCheckIssue[] = [];
  if (!semverGte(CURRENT_AETHER_VERSION, m.requiredAetherVersion)) {
    issues.push({ ruleId: "MIN_AETHER_VERSION", severity: "FAIL", message: `需要 Aetherworld ≥ ${m.requiredAetherVersion}` });
  }
  // 依赖检查（其他 WebXXM）
  const enabledIds = new Set(listInstalled().filter((i) => i.enabled).map((i) => i.packageId));
  for (const dep of m.dependencies) {
    if (dep.type === "OTHER_WEBXXM" && dep.required && !enabledIds.has(dep.dependencyId)) {
      issues.push({ ruleId: "REQUIRED_PACKAGES", severity: "FAIL", message: `缺少依赖能力包：${dep.dependencyId}` });
    }
  }
  const status = issues.some((i) => i.severity === "FAIL") ? "FAIL" : issues.length ? "WARN" : "PASS";
  return { status, issues, canInstall: status !== "FAIL" };
}

export function evaluatePackageSafety(m: WebXXMPackageManifest): PackageCheckReport {
  const issues: PackageCheckIssue[] = [];
  const blob = JSON.stringify(m);
  if (/Full60原始|完整六十数列/i.test(blob)) {
    issues.push({ ruleId: "NO_FULL60_RAW", severity: "CRITICAL", message: "能力包疑似包含 Full60 原始数列。" });
  }
  if (/sk-[a-zA-Z0-9]{20,}|password=|token=/.test(blob)) {
    issues.push({ ruleId: "NO_SECRETS", severity: "CRITICAL", message: "能力包疑似包含密钥/Token。" });
  }
  if (m.permissions.some((p) => p.riskLevel === "CRITICAL")) {
    issues.push({ ruleId: "NO_DANGEROUS_COMMANDS", severity: "WARN", message: "包含 CRITICAL 权限，需 Founder 审批。" });
  }
  const status: PackageCheckReport["status"] =
    issues.some((i) => i.severity === "CRITICAL") ? "BLOCKED" :
    issues.some((i) => i.severity === "FAIL") ? "FAIL" :
    issues.length ? "WARN" : "PASS";
  return { status, issues, canInstall: status !== "BLOCKED" && status !== "FAIL" };
}

export function runPackageQa(m: WebXXMPackageManifest): PackageCheckReport {
  const issues: PackageCheckIssue[] = [];
  if (!m.qaRules.length) issues.push({ ruleId: "QA_RULES_MISSING", severity: "WARN", message: "未声明 QA 规则。" });
  if (!m.safetyRules.length) issues.push({ ruleId: "SAFETY_RULES_MISSING", severity: "WARN", message: "未声明安全规则。" });
  const status = issues.length ? "WARN" : "PASS";
  return { status, issues, canInstall: true };
}

export const SAFETY_RULES = WEBXXM_PACKAGE_SAFETY_RULES;
