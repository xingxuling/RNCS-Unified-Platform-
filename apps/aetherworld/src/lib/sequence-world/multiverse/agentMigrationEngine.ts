import type { AgentMigrationRecord, RegisteredWorld } from "./types";
import { shortId } from "./types";

export interface MigrateAgentInput {
  agentId: string;
  fromWorld: RegisteredWorld;
  toWorld: RegisteredWorld;
  reason: string;
  memoryTransferMode?: AgentMigrationRecord["memoryTransferMode"];
  founderOnly?: boolean;
}

export function migrateAgent(input: MigrateAgentInput): AgentMigrationRecord {
  const risks: string[] = [];
  let mode: AgentMigrationRecord["memoryTransferMode"] = input.memoryTransferMode ?? "SUMMARY";
  if (input.founderOnly && input.toWorld.privacyLevel !== "FOUNDER_PRIVATE") {
    risks.push("Founder-only agent 不得普通迁移；已降级为 NONE。");
    mode = "NONE";
  }
  if (mode === "FULL" && input.toWorld.privacyLevel === "PUBLIC_DEMO") {
    risks.push("FULL memory 不应迁移到公共 Demo 世界；建议 SUMMARY。");
  }
  return {
    migrationId: shortId("mig"),
    agentId: input.agentId,
    fromWorldId: input.fromWorld.worldId,
    toWorldId: input.toWorld.worldId,
    migrationReason: input.reason,
    memoryTransferMode: mode,
    roleInTargetWorld: "MIGRANT",
    canonStatus: input.founderOnly ? "FOUNDER_LOCKED" : "SOFT_CANON",
    risks,
  };
}
