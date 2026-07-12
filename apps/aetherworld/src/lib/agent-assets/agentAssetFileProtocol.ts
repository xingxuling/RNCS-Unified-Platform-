import type { AgentBlueprint } from "./agentBlueprintRegistry";
import type { SkillDefinition } from "./skillRegistry";
import type { SoulProfile } from "./soulProfileRegistry";

export type AgentAssetKind = "SKILL" | "SOUL" | "BLUEPRINT";
export type AgentAssetImportDecision = "READY" | "WARN" | "BLOCK";

export interface AgentAssetEnvelope<TAsset> {
  protocol: "AETHER_AGENT_ASSET";
  schemaVersion: "1.0.0";
  assetKind: AgentAssetKind;
  assetVersion: string;
  exportedAt: string;
  exportedBy?: string;
  asset: TAsset;
  sourceSnapshot?: string;
}

export type SkillAssetFile = AgentAssetEnvelope<SkillDefinition> & { assetKind: "SKILL" };
export type SoulAssetFile = AgentAssetEnvelope<SoulProfile> & { assetKind: "SOUL" };
export type BlueprintAssetFile = AgentAssetEnvelope<AgentBlueprint> & { assetKind: "BLUEPRINT" };
export type AgentAssetFile = SkillAssetFile | SoulAssetFile | BlueprintAssetFile;

export interface AgentAssetImportPreview {
  decision: AgentAssetImportDecision;
  assetKind?: AgentAssetKind;
  assetId?: string;
  assetName?: string;
  schemaVersion?: string;
  warnings: string[];
  blockedReasons: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function validateEnvelope(value: unknown): AgentAssetImportPreview & { file?: AgentAssetFile } {
  const warnings: string[] = [];
  const blockedReasons: string[] = [];

  if (!isRecord(value)) {
    return {
      decision: "BLOCK",
      warnings,
      blockedReasons: ["Asset file must be a JSON object."],
    };
  }

  const protocol = getString(value.protocol);
  const schemaVersion = getString(value.schemaVersion);
  const assetKind = getString(value.assetKind) as AgentAssetKind | undefined;
  const assetVersion = getString(value.assetVersion);
  const exportedAt = getString(value.exportedAt);
  const asset = value.asset;

  if (protocol !== "AETHER_AGENT_ASSET") blockedReasons.push("Invalid protocol. Expected AETHER_AGENT_ASSET.");
  if (!schemaVersion) blockedReasons.push("schemaVersion is required.");
  if (schemaVersion && schemaVersion !== "1.0.0") warnings.push(`Unsupported schemaVersion ${schemaVersion}; migration may be required.`);
  if (!assetKind || !["SKILL", "SOUL", "BLUEPRINT"].includes(assetKind)) blockedReasons.push("assetKind must be SKILL, SOUL or BLUEPRINT.");
  if (!assetVersion) warnings.push("assetVersion is missing.");
  if (!exportedAt) warnings.push("exportedAt is missing.");
  if (!isRecord(asset)) blockedReasons.push("asset must be an object.");

  const assetId = isRecord(asset) ? getString(asset.id) : undefined;
  const assetName = isRecord(asset) ? getString(asset.name) : undefined;
  if (!assetId) blockedReasons.push("asset.id is required.");
  if (!assetName) warnings.push("asset.name is missing.");

  if (blockedReasons.length) {
    return {
      decision: "BLOCK",
      assetKind,
      assetId,
      assetName,
      schemaVersion,
      warnings,
      blockedReasons,
    };
  }

  const file = value as unknown as AgentAssetFile;
  return {
    decision: warnings.length ? "WARN" : "READY",
    assetKind,
    assetId,
    assetName,
    schemaVersion,
    warnings,
    blockedReasons,
    file,
  };
}

export function previewAgentAssetImport(rawJson: string): AgentAssetImportPreview {
  const parsed = parseJson(rawJson);
  return validateEnvelope(parsed);
}

export function parseAgentAssetFile(rawJson: string): { file: AgentAssetFile | null; preview: AgentAssetImportPreview } {
  const parsed = parseJson(rawJson);
  const result = validateEnvelope(parsed);
  return {
    file: result.decision === "BLOCK" ? null : result.file ?? null,
    preview: {
      decision: result.decision,
      assetKind: result.assetKind,
      assetId: result.assetId,
      assetName: result.assetName,
      schemaVersion: result.schemaVersion,
      warnings: result.warnings,
      blockedReasons: result.blockedReasons,
    },
  };
}

export function createAgentAssetEnvelope<TAsset extends SkillDefinition | SoulProfile | AgentBlueprint>(
  assetKind: AgentAssetKind,
  asset: TAsset,
  options: { exportedBy?: string; sourceSnapshot?: string } = {},
): AgentAssetEnvelope<TAsset> {
  return {
    protocol: "AETHER_AGENT_ASSET",
    schemaVersion: "1.0.0",
    assetKind,
    assetVersion: asset.version,
    exportedAt: new Date().toISOString(),
    exportedBy: options.exportedBy,
    asset,
    sourceSnapshot: options.sourceSnapshot,
  };
}

export function stringifyAgentAssetFile(file: AgentAssetFile): string {
  return JSON.stringify(file, null, 2);
}
