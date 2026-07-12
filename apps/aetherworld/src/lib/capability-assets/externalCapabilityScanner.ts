// 外部能力扫描：把外部 GitHub / API / 模型 / 论文方法 / 第三方 SaaS 包装成候选
// 本轮只生成 草案，不真正调用 / 安装 / 上传。
import type {
  CapabilityAssetCandidate,
  CapabilityInstallMode,
  CapabilityMonetization,
  CapabilityOwnershipStatus,
  CapabilityPackageType,
  CapabilityRiskLevel,
  CapabilitySafetyStatus,
} from "./capabilityAssetTypes";
import { detectSensitiveHits } from "./capabilityAssetSafetyPolicy";

export interface ExternalCapabilitySeed {
  ref: string;
  title: string;
  cnTitle: string;
  description: string;
  packageType: CapabilityPackageType;
  requiredApiKey?: boolean;
  externalDependency?: boolean;
  dataUploadRisk?: boolean;
  executionRisk?: boolean;
  licenseNote?: string;
  trustScore?: number; // 0-1
}

const DEFAULT_EXTERNAL_SEEDS: ExternalCapabilitySeed[] = [
  { ref: "ollama", title: "Ollama", cnTitle: "Ollama 本地模型 Provider",
    description: "本地模型运行 / Provider 接入。",
    packageType: "MODEL", requiredApiKey: false, externalDependency: true,
    dataUploadRisk: false, executionRisk: false, licenseNote: "MIT", trustScore: 0.9 },
  { ref: "webllm", title: "WebLLM", cnTitle: "WebLLM 浏览器模型",
    description: "在浏览器中运行的 LLM。",
    packageType: "MODEL", requiredApiKey: false, externalDependency: true,
    dataUploadRisk: false, executionRisk: false, licenseNote: "Apache-2.0", trustScore: 0.85 },
  { ref: "openai-api", title: "OpenAI Compatible API", cnTitle: "OpenAI 兼容 API",
    description: "外部 LLM Provider，需要 API Key。",
    packageType: "API_WRAPPER", requiredApiKey: true, externalDependency: true,
    dataUploadRisk: true, executionRisk: false, licenseNote: "Commercial", trustScore: 0.8 },
  { ref: "github-readme-method", title: "GitHub README Method", cnTitle: "GitHub 论文方法",
    description: "外部论文 / 开源方法描述。",
    packageType: "METHOD_PACKAGE", requiredApiKey: false, externalDependency: false,
    dataUploadRisk: false, executionRisk: false, licenseNote: "见原仓库", trustScore: 0.6 },
  { ref: "open-source-agent-arch", title: "Open Source Agent Architecture", cnTitle: "开源 Agent 架构",
    description: "外部 Agent 框架（LangChain / AutoGen / CrewAI 等）。",
    packageType: "OPEN_SOURCE_ADAPTER", requiredApiKey: false, externalDependency: true,
    dataUploadRisk: false, executionRisk: true, licenseNote: "见原仓库", trustScore: 0.7 },
  { ref: "external-saas", title: "Third-party SaaS", cnTitle: "第三方 SaaS",
    description: "外部 SaaS 工具的能力包装。",
    packageType: "EXTERNAL_TOOL", requiredApiKey: true, externalDependency: true,
    dataUploadRisk: true, executionRisk: false, licenseNote: "Commercial", trustScore: 0.5 },
  { ref: "external-data-source", title: "External Data Source", cnTitle: "外部数据源",
    description: "外部数据集 / 数据 API。",
    packageType: "DATA_SOURCE", requiredApiKey: false, externalDependency: true,
    dataUploadRisk: false, executionRisk: false, licenseNote: "见原数据源", trustScore: 0.55 },
];

function pickInstallMode(seed: ExternalCapabilitySeed, risk: CapabilityRiskLevel): CapabilityInstallMode {
  if (risk === "CRITICAL") return "ENTERPRISE_CONTACT";
  if (risk === "HIGH") return "REFERENCE_ONLY";
  if (seed.packageType === "MODEL") return "MODEL_PROVIDER";
  if (seed.requiredApiKey || seed.packageType === "API_WRAPPER" || seed.packageType === "EXTERNAL_TOOL") return "API_CONNECT";
  if (seed.packageType === "METHOD_PACKAGE") return "COPY_PROMPT";
  if (seed.packageType === "DATA_SOURCE") return "REFERENCE_ONLY";
  return "REFERENCE_ONLY";
}

function pickRisk(seed: ExternalCapabilitySeed): CapabilityRiskLevel {
  let score = 0;
  if (seed.requiredApiKey) score += 1;
  if (seed.dataUploadRisk) score += 2;
  if (seed.executionRisk) score += 2;
  if (seed.externalDependency) score += 1;
  if (typeof seed.trustScore === "number" && seed.trustScore < 0.6) score += 1;
  const hits = detectSensitiveHits(`${seed.title} ${seed.description}`);
  if (hits.length > 0) score += 2;
  if (score >= 5) return "CRITICAL";
  if (score >= 3) return "HIGH";
  if (score >= 1) return "MEDIUM";
  return "LOW";
}

function pickOwnership(seed: ExternalCapabilitySeed): CapabilityOwnershipStatus {
  if (!seed.licenseNote || /未知|unknown/i.test(seed.licenseNote)) return "LICENSE_UNKNOWN";
  if (/MIT|Apache|BSD|GPL/i.test(seed.licenseNote)) return "OPEN_SOURCE";
  if (/Commercial/i.test(seed.licenseNote)) return "RESTRICTED";
  return "LICENSE_UNKNOWN";
}

function pickSafety(risk: CapabilityRiskLevel, ownership: CapabilityOwnershipStatus): CapabilitySafetyStatus {
  if (risk === "CRITICAL") return "BLOCK";
  if (risk === "HIGH") return "NEEDS_REVIEW";
  if (ownership === "LICENSE_UNKNOWN") return "NEEDS_REVIEW";
  if (risk === "MEDIUM") return "WARN";
  return "PASS";
}

function pickMonetization(seed: ExternalCapabilitySeed, ownership: CapabilityOwnershipStatus): CapabilityMonetization {
  if (ownership === "RESTRICTED") return "ENTERPRISE";
  if (ownership === "OPEN_SOURCE") return "FREE";
  if (seed.requiredApiKey) return "NOT_FOR_SALE";
  return "UNKNOWN";
}

export function scanExternalCapabilityCandidates(
  seeds: ExternalCapabilitySeed[] = DEFAULT_EXTERNAL_SEEDS,
): CapabilityAssetCandidate[] {
  return seeds.map((s, idx) => {
    const risk = pickRisk(s);
    const ownership = pickOwnership(s);
    const safety = pickSafety(risk, ownership);
    const installMode = pickInstallMode(s, risk);
    const monetization = pickMonetization(s, ownership);
    const needsReview = safety === "NEEDS_REVIEW" || safety === "BLOCK";
    return {
      id: `CAC-EXT-${idx + 1}`,
      sourceType: "EXTERNAL_CAPABILITY",
      sourceRef: s.ref,
      candidateType: s.packageType,
      title: s.title,
      cnTitle: s.cnTitle,
      valueReason: s.description,
      suggestedPackageType: s.packageType,
      suggestedInstallMode: installMode,
      suggestedMonetization: monetization,
      riskLevel: risk,
      safetyStatus: safety,
      ownershipStatus: ownership,
      shouldAssetizeNow: !needsReview,
      shouldRequireReview: needsReview,
      notes: `License: ${s.licenseNote ?? "未知"}；TrustScore: ${s.trustScore ?? "未知"}；`
        + `${s.requiredApiKey ? "需要 API Key；" : ""}${s.dataUploadRisk ? "存在数据外传风险；" : ""}${s.executionRisk ? "存在执行风险；" : ""}`,
    };
  });
}
