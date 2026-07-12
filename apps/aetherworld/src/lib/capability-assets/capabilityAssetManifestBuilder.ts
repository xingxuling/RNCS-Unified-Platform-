// Capability Asset · Manifest 构建器
import type { CapabilityAssetManifest, CapabilityAssetPackage } from "./capabilityAssetTypes";
import {
  CAPABILITY_ASSET_SAFETY_ALLOWED,
  CAPABILITY_ASSET_SAFETY_FORBIDDEN,
} from "./capabilityAssetSafetyPolicy";

export function buildManifest(pkg: CapabilityAssetPackage): CapabilityAssetManifest {
  const ownershipNote =
    pkg.sourceType === "INTERNAL_CAPABILITY" ? "Aetherworld 自有能力，所有权清晰。" :
    pkg.sourceType === "USER_CAPABILITY" ? "用户声明的创造物，发布前需用户二次确认。" :
    "外部能力，请保留原始作者署名与 license。";

  const licenseNote =
    pkg.ownershipStatus === "OPEN_SOURCE" ? "遵循原仓库开源协议（请保留 LICENSE 文件）" :
    pkg.ownershipStatus === "RESTRICTED" ? "商业受限，使用前请确认授权" :
    pkg.ownershipStatus === "LICENSE_UNKNOWN" ? "License 未知，禁止打包分发" :
    pkg.ownershipStatus === "PRIVATE" ? "私密资产，禁止对外发布" :
    "用户自有 / 自声明";

  const usageGuide = (() => {
    switch (pkg.installMode) {
      case "ONE_CLICK": return "在 WebXXM 商店一键安装即可使用。";
      case "COPY_PROMPT": return "复制 Prompt 到 Chat 或工作台粘贴使用。";
      case "IMPORT_JSON": return "下载 JSON 后导入 Workspace。";
      case "DOWNLOAD_FILE": return "下载至本机后按 README 使用。";
      case "API_CONNECT": return "在 LLM Provider / Connector 配置中接入外部 API。";
      case "MODEL_PROVIDER": return "在 LLM Provider 中接入对应模型。";
      case "ENTERPRISE_CONTACT": return "请联络企业渠道获取部署方案。";
      case "REFERENCE_ONLY": return "仅供参考，不提供一键安装。";
      case "LOCAL_ONLY": return "仅在本地工作区使用，不对外暴露。";
      default: return "按商店指引使用。";
    }
  })();

  const limitations: string[] = [];
  if (pkg.safetyStatus === "NEEDS_REVIEW") limitations.push("需要人工审核后才能发布或售卖。");
  if (pkg.safetyStatus === "BLOCK") limitations.push("当前被安全策略阻断，禁止发布与导出。");
  if (!pkg.installable) limitations.push("禁止一键安装。");
  if (!pkg.sellable) limitations.push("当前不可售卖。");
  if (!pkg.exportable) limitations.push("当前不可导出。");
  if (pkg.sourceType === "EXTERNAL_CAPABILITY") limitations.push("外部能力请遵守原 license。");
  if (pkg.sourceType === "USER_CAPABILITY") limitations.push("用户能力发布前必须用户确认。");

  return {
    packageId: pkg.id,
    sourceType: pkg.sourceType,
    packageType: pkg.packageType,
    version: pkg.version,
    requiredSystems: pkg.requiredSystems,
    permissions: pkg.permissions,
    installMode: pkg.installMode,
    safetyPolicy: [...CAPABILITY_ASSET_SAFETY_ALLOWED.slice(0, 3), ...CAPABILITY_ASSET_SAFETY_FORBIDDEN.slice(0, 5)],
    ownershipNote,
    licenseNote,
    usageGuide,
    limitations,
  };
}

export function manifestToJson(m: CapabilityAssetManifest): string {
  return JSON.stringify(m, null, 2);
}
