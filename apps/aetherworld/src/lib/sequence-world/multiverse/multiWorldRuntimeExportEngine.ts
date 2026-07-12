import type {
  AgentMigrationRecord,
  CrossWorldCanonState,
  CrossWorldRelation,
  MultiWorldEvent,
  RegisteredWorld,
  WorldConflict,
  WorldFederationState,
  WorldPortal,
  WorldSyncState,
  WorldTransferRecord,
  WorldTravelState,
  SubjectMode,
} from "./types";
import { nowIso } from "./types";
import type { MultiWorldExportTargetId } from "@/constants/sequence-world/multiverse/multiWorldExportTargets";

export interface MultiWorldRuntimePackage {
  metadata: {
    version: string;
    source: "Aether Sequence World Engine v0.7";
    exportedAt: string;
    subjectMode: SubjectMode;
    privacyNotes: string[];
  };
  worlds: RegisteredWorld[];
  portals: WorldPortal[];
  relations: CrossWorldRelation[];
  travelState?: WorldTravelState;
  transfers: WorldTransferRecord[];
  migrations: AgentMigrationRecord[];
  crossWorldCanon: CrossWorldCanonState;
  events: MultiWorldEvent[];
  federation?: WorldFederationState;
  conflicts: WorldConflict[];
  syncState: WorldSyncState;
  safetyNotes: string[];
}

export interface ExportInput {
  target: MultiWorldExportTargetId;
  subjectMode: SubjectMode;
  pack: Omit<MultiWorldRuntimePackage, "metadata">;
}

export function exportMultiWorldRuntime(input: ExportInput): { target: MultiWorldExportTargetId; payload: unknown; privacyNotes: string[] } {
  const privacyNotes = [
    "虚拟世界结构，不代表现实事实。",
    "导出包不可作为现实金融、医疗、法律或行动依据。",
  ];
  const pkg: MultiWorldRuntimePackage = {
    metadata: {
      version: "0.7.0",
      source: "Aether Sequence World Engine v0.7",
      exportedAt: nowIso(),
      subjectMode: input.subjectMode,
      privacyNotes,
    },
    ...input.pack,
  };
  // Filter Full60 private worlds out of public exports
  if (input.subjectMode !== "FOUNDER" && input.target !== "FOUNDER_TRACE_JSON") {
    pkg.worlds = pkg.worlds.filter((w) => w.privacyLevel !== "FOUNDER_PRIVATE");
  }
  let payload: unknown = pkg;
  if (input.target === "GODOT_MULTIWORLD_RUNTIME_JSON") {
    payload = {
      meta: { version: pkg.metadata.version, source: pkg.metadata.source, exported_at: pkg.metadata.exportedAt, subject_mode: pkg.metadata.subjectMode, privacy_notes: pkg.metadata.privacyNotes },
      worlds: pkg.worlds.map((w) => ({ world_id: w.worldId, name: w.worldName, type: w.worldType, privacy_level: w.privacyLevel })),
      portals: pkg.portals.map((p) => ({ portal_id: p.portalId, from_world_id: p.fromWorldId, to_world_id: p.toWorldId, type: p.portalType })),
      relations: pkg.relations,
    };
  } else if (input.target === "UNITY_MULTIWORLD_RUNTIME_JSON") {
    payload = {
      Metadata: pkg.metadata,
      Worlds: pkg.worlds,
      Portals: pkg.portals,
      Relations: pkg.relations,
    };
  } else if (input.target === "THREEJS_WORLD_MAP_JSON") {
    payload = {
      metadata: pkg.metadata,
      nodes: pkg.worlds.map((w) => ({ id: w.worldId, label: w.worldName, group: w.worldType })),
      edges: pkg.portals.map((p) => ({ source: p.fromWorldId, target: p.toWorldId, type: p.portalType })),
    };
  } else if (input.target === "NARRATIVE_MULTIVERSE_BIBLE") {
    payload = [
      `# Narrative Multiverse Bible`,
      `version: ${pkg.metadata.version}`,
      `worlds: ${pkg.worlds.length}`,
      `portals: ${pkg.portals.length}`,
      ...pkg.worlds.map((w) => `- ${w.worldName} (${w.worldType})`),
      "",
      "Safety: " + privacyNotes.join(" "),
    ].join("\n");
  } else if (input.target === "PORTAL_GRAPH_JSON") {
    payload = { metadata: pkg.metadata, portals: pkg.portals };
  } else if (input.target === "WORLD_KNOWLEDGE_PACK") {
    payload = { metadata: pkg.metadata, knowledgeType: "MULTIWORLD_NETWORK", worlds: pkg.worlds };
  } else if (input.target === "FOUNDER_TRACE_JSON") {
    payload = pkg;
  }
  return { target: input.target, payload, privacyNotes };
}
