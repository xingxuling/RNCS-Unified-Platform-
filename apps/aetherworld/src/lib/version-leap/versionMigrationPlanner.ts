import type { VersionLeapLevel } from "@/constants/version-leap/versionLeapLevels";
import type { VersionClassification } from "./versionTypeClassifier";

export interface MigrationStep {
  stepId: string;
  title: string;
  description: string;
  required: boolean;
  relatedModule: string;
}

export interface MigrationPlan {
  fromVersion: string;
  toVersion: string;
  steps: MigrationStep[];
  risks: string[];
  rollbackAvailable: boolean;
}

export function planMigration(
  fromVersion: string,
  toVersion: string,
  level: VersionLeapLevel,
  classification: VersionClassification,
): MigrationPlan {
  const steps: MigrationStep[] = [
    { stepId: "qa",       title: "运行 Software QA",       description: "扫描全部模块测试反馈。",     required: true, relatedModule: "software-qa" },
    { stepId: "ui",       title: "运行 Interface Audit",   description: "检测 UI 模板覆盖与 stale。", required: true, relatedModule: "ui-update-engine" },
    { stepId: "quick",    title: "修复 Quick Start",        description: "补齐缺失入口。",             required: false, relatedModule: "quick-start-manager" },
    { stepId: "text",     title: "运行 Text Audit",        description: "扫描文案安全与 stale。",     required: classification.requiresTextUpdate, relatedModule: "text-audit" },
    { stepId: "docs",     title: "更新 Docs",              description: "刷新教程与模块文档。",       required: classification.requiresDocsUpdate, relatedModule: "module-docs" },
    { stepId: "recalc",   title: "运行 Recalculation",     description: "标记并清理 stale。",         required: classification.requiresRecalculation, relatedModule: "recalculation" },
    { stepId: "notes",    title: "生成 Release Notes",     description: "生成公共版本与 Founder 版本。", required: level !== "PATCH", relatedModule: "release-notes" },
    { stepId: "tag",      title: "标记版本",                description: "记录到版本时间线。",         required: true, relatedModule: "version-timeline" },
  ];

  const risks: string[] = [];
  if (level === "LEAP" || level === "GENERATION") risks.push("跨多个系统的协同变更，需要 Founder 审核。");
  if (classification.requiresConstitutionCheck) risks.push("涉及宪法或常数变更，需更新宪法合规版本号。");
  if (classification.requiresMigration) risks.push("可能涉及数据结构与本地存储迁移。");
  if (level === "GENERATION") risks.push("产品代际跃迁，需要重新撰写首屏与教程入口。");

  return { fromVersion, toVersion, steps, risks, rollbackAvailable: level !== "GENERATION" };
}
