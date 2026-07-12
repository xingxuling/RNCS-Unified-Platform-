// 用户能力扫描：识别用户在 Aetherworld 中的创造物候选
// 不真正发布，仅生成草案；高敏感 / 含 secret / 未确认的内容必须 NEEDS_REVIEW。
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

export interface UserCapabilitySeed {
  ref: string;
  title: string;
  cnTitle: string;
  packageType: CapabilityPackageType;
  description: string;
  /** 用户是否已确认愿意发布；未确认默认 NEEDS_REVIEW。 */
  userConfirmedPublish?: boolean;
  /** 用户声明的所有权 */
  declaredOwnership?: CapabilityOwnershipStatus;
  /** 是否包含 Full60 原文 / Founder-only / secret 等。 */
  containsPrivate?: boolean;
  containsSecret?: boolean;
  highAutomationRisk?: boolean;
  rawTextSample?: string;
}

const FALLBACK_USER_SEEDS: UserCapabilitySeed[] = [
  { ref: "user-prompt-sample", title: "User Prompt", cnTitle: "用户 Prompt",
    packageType: "PROMPT", description: "用户在 Workspace 中创建的 Prompt 草稿。",
    userConfirmedPublish: false, declaredOwnership: "USER_DECLARED" },
  { ref: "user-app-sample", title: "User App", cnTitle: "用户应用",
    packageType: "APP", description: "用户在 Aetherworld 中创造的应用方案。",
    userConfirmedPublish: false, declaredOwnership: "USER_DECLARED" },
  { ref: "user-agent-sample", title: "User Agent", cnTitle: "用户 Agent",
    packageType: "AGENT", description: "用户自定义的 Agent。",
    userConfirmedPublish: false, declaredOwnership: "USER_DECLARED" },
  { ref: "user-workflow-sample", title: "User Workflow", cnTitle: "用户工作流",
    packageType: "WORKFLOW", description: "用户自定义的工作流。",
    userConfirmedPublish: false, declaredOwnership: "USER_DECLARED" },
  { ref: "user-dataset-sample", title: "User Dataset", cnTitle: "用户数据集",
    packageType: "DATASET", description: "用户在 Dataset Builder 中构建的数据集。",
    userConfirmedPublish: false, declaredOwnership: "USER_DECLARED" },
  { ref: "user-world-sample", title: "User World Package", cnTitle: "用户世界包",
    packageType: "WORLD_PACKAGE", description: "用户创造的世界设定。",
    userConfirmedPublish: false, declaredOwnership: "USER_DECLARED" },
  { ref: "user-character-sample", title: "User Character Package", cnTitle: "用户角色包",
    packageType: "CHARACTER_PACKAGE", description: "用户创造的角色设定。",
    userConfirmedPublish: false, declaredOwnership: "USER_DECLARED" },
  { ref: "user-music-sample", title: "User Music Package", cnTitle: "用户音乐包",
    packageType: "MUSIC_PACKAGE", description: "用户创作的音乐 Prompt / 风格包。",
    userConfirmedPublish: false, declaredOwnership: "USER_DECLARED" },
  { ref: "user-template-sample", title: "User Template", cnTitle: "用户模板",
    packageType: "TEMPLATE", description: "用户沉淀的模板。",
    userConfirmedPublish: false, declaredOwnership: "USER_DECLARED" },
  { ref: "user-training-pack-sample", title: "User Training Pack", cnTitle: "用户训练包",
    packageType: "TRAINING_TOOL", description: "用户训练流水线包。",
    userConfirmedPublish: false, declaredOwnership: "USER_DECLARED" },
  { ref: "user-method-sample", title: "User Methodology", cnTitle: "用户方法论",
    packageType: "METHOD_PACKAGE", description: "用户沉淀的项目方法论。",
    userConfirmedPublish: false, declaredOwnership: "USER_DECLARED" },
];

function pickRisk(seed: UserCapabilitySeed): CapabilityRiskLevel {
  let score = 0;
  if (seed.containsSecret) score += 3;
  if (seed.containsPrivate) score += 2;
  if (seed.highAutomationRisk) score += 2;
  const hits = detectSensitiveHits(`${seed.title} ${seed.description} ${seed.rawTextSample ?? ""}`);
  if (hits.length > 0) score += 2;
  if (score >= 5) return "CRITICAL";
  if (score >= 3) return "HIGH";
  if (score >= 1) return "MEDIUM";
  return "LOW";
}

function pickSafety(seed: UserCapabilitySeed, risk: CapabilityRiskLevel): CapabilitySafetyStatus {
  if (seed.containsSecret) return "BLOCK";
  if (risk === "CRITICAL") return "BLOCK";
  if (risk === "HIGH") return "NEEDS_REVIEW";
  if (!seed.userConfirmedPublish) return "NEEDS_REVIEW";
  if (risk === "MEDIUM") return "WARN";
  return "PASS";
}

function pickInstallMode(packageType: CapabilityPackageType): CapabilityInstallMode {
  switch (packageType) {
    case "PROMPT":
    case "METHOD_PACKAGE":
    case "TEMPLATE":
      return "COPY_PROMPT";
    case "DATASET":
      return "DOWNLOAD_FILE";
    case "MODEL":
      return "MODEL_PROVIDER";
    case "AGENT":
    case "WORKFLOW":
    case "APP":
      return "IMPORT_JSON";
    case "WORLD_PACKAGE":
    case "CHARACTER_PACKAGE":
    case "MUSIC_PACKAGE":
      return "IMPORT_JSON";
    default:
      return "LOCAL_ONLY";
  }
}

function pickMonetization(seed: UserCapabilitySeed, safety: CapabilitySafetyStatus): CapabilityMonetization {
  if (safety === "BLOCK" || seed.containsSecret) return "NOT_FOR_SALE";
  if (!seed.userConfirmedPublish) return "PRIVATE";
  return "UNKNOWN";
}

export function scanUserCapabilityCandidates(seeds?: UserCapabilitySeed[]): CapabilityAssetCandidate[] {
  const list = seeds && seeds.length > 0 ? seeds : FALLBACK_USER_SEEDS;
  return list.map((s, idx) => {
    const risk = pickRisk(s);
    const safety = pickSafety(s, risk);
    const ownership: CapabilityOwnershipStatus = s.declaredOwnership ?? "USER_DECLARED";
    const installMode = pickInstallMode(s.packageType);
    const monetization = pickMonetization(s, safety);
    const needsReview = safety === "NEEDS_REVIEW" || safety === "BLOCK";
    const notes = [
      s.userConfirmedPublish ? "用户已确认愿意发布" : "用户尚未确认发布",
      s.containsPrivate ? "可能包含隐私" : null,
      s.containsSecret ? "包含 secret，禁止发布" : null,
      s.highAutomationRisk ? "存在高自动化风险" : null,
    ].filter(Boolean).join("；");
    return {
      id: `CAC-USR-${idx + 1}`,
      sourceType: "USER_CAPABILITY",
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
      notes: notes || "用户内容，需要用户确认后才能发布。",
    };
  });
}
