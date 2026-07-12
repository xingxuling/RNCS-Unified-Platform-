// Shared types and helpers for the Multi-World Network (v0.7).
import type { WorldTypeId } from "@/constants/sequence-world/multiverse/worldTypes";
import type { PortalTypeId } from "@/constants/sequence-world/multiverse/portalTypes";
import type { CrossWorldRelationTypeId } from "@/constants/sequence-world/multiverse/crossWorldRelationTypes";
import type { WorldTransferTypeId } from "@/constants/sequence-world/multiverse/worldTransferTypes";
import type { WorldFederationTypeId } from "@/constants/sequence-world/multiverse/worldFederationTypes";
import type { MultiWorldEventTypeId } from "@/constants/sequence-world/multiverse/multiWorldEventTypes";

export type SubjectMode = "DEMO" | "LIGHT_20" | "FULL_60" | "FOUNDER";
export type NetworkMode = "DEMO" | "PERSONAL_MULTIVERSE" | "CREATOR_MULTIVERSE" | "GAME_MULTIVERSE" | "FOUNDER_MULTIVERSE";
export type PrivacyLevel = "PUBLIC_DEMO" | "USER_PRIVATE" | "FOUNDER_PRIVATE" | "SYSTEM_ONLY";
export type CanonStatus = "DRAFT" | "SOFT_CANON" | "HARD_CANON" | "FOUNDER_LOCKED";

export interface RegisteredWorld {
  worldId: string;
  worldName: string;
  worldType: WorldTypeId;
  sourceSequenceMode: "DEMO" | "LIGHT_20" | "FULL_60" | "OBJECT" | "WORLD" | "FOUNDER";
  ownerSubjectMode: SubjectMode;
  privacyLevel: PrivacyLevel;
  currentPhase: string;
  simulationVersion?: string;
  growthVersion?: string;
  societyVersion?: string;
  civilizationVersion?: string;
  presentationVersion?: string;
  canonCount: number;
  npcCount: number;
  assetCount: number;
  portalCount: number;
  createdAt: string;
  updatedAt: string;
  safetyNotes: string[];
}

export interface WorldIdentity {
  worldId: string;
  name: string;
  alias: string[];
  coreSequence?: string;
  dominantDigits: string[];
  worldSignature: string;
  foundingEvent: string;
  primaryTheme: string;
  boundaryRules: string[];
  allowedConnections: string[];
  forbiddenConnections: string[];
}

export interface WorldPortal {
  portalId: string;
  fromWorldId: string;
  toWorldId: string;
  portalType: PortalTypeId;
  accessRule: string;
  stability: number;
  transferAllowed: boolean;
  allowedTransferTypes: WorldTransferTypeId[];
  requiredPermission: string;
  visualStyle: string;
  safetyNotes: string[];
}

export interface CrossWorldRelation {
  relationId: string;
  worldA: string;
  worldB: string;
  relationType: CrossWorldRelationTypeId;
  strength: number;
  trust: number;
  conflict: number;
  resourceFlow: number;
  canonCompatibility: number;
  narrativeCompatibility: number;
  history: string[];
}

export interface WorldTravelRecord {
  recordId: string;
  fromWorldId: string;
  toWorldId: string;
  portalId: string;
  traveledAt: string;
  purpose: string;
  resultSummary: string;
}
export interface WorldTravelState {
  userId: string;
  currentWorldId: string;
  previousWorldId?: string;
  visitedWorldIds: string[];
  travelHistory: WorldTravelRecord[];
  currentRoleInWorld: string;
  permissionsInCurrentWorld: string[];
  travelRisks: string[];
}

export interface WorldTransferRecord {
  transferId: string;
  fromWorldId: string;
  toWorldId: string;
  transferType: WorldTransferTypeId;
  assetId: string;
  assetSummary: string;
  allowed: boolean;
  reason: string;
  canonImpact: string;
  safetyNotes: string[];
}

export interface AgentMigrationRecord {
  migrationId: string;
  agentId: string;
  fromWorldId: string;
  toWorldId: string;
  migrationReason: string;
  memoryTransferMode: "NONE" | "SUMMARY" | "FULL" | "FOUNDER_ONLY";
  roleInTargetWorld: string;
  canonStatus: CanonStatus;
  risks: string[];
}

export interface CrossWorldCanonLink {
  linkId: string;
  sourceWorldId: string;
  targetWorldId: string;
  canonEntryId: string;
  linkType: "REFERENCE" | "IMPORT" | "MIRROR" | "BRANCH" | "FOUNDER_LOCK";
  allowed: boolean;
  reason: string;
}
export interface CrossWorldCanonConflict {
  conflictId: string;
  type: string;
  worldIds: string[];
  description: string;
}
export interface CrossWorldCanonState {
  canonLinks: CrossWorldCanonLink[];
  conflicts: CrossWorldCanonConflict[];
  sharedCanonEntries: string[];
  isolatedCanonEntries: string[];
}

export interface MultiWorldEvent {
  eventId: string;
  title: string;
  eventType: MultiWorldEventTypeId;
  involvedWorldIds: string[];
  triggerReason: string;
  consequences: string[];
  affectedPortals: string[];
  affectedRelations: string[];
  safetyNotes: string[];
}

export interface WorldFederationState {
  federationId: string;
  name: string;
  memberWorldIds: string[];
  federationType: WorldFederationTypeId;
  sharedRules: string[];
  sharedResources: string[];
  governanceModel: string;
  stability: number;
  conflictRisk: number;
  founderLocked: boolean;
}

export interface WorldConflict {
  conflictId: string;
  conflictType: string;
  involvedWorldIds: string[];
  rootCause: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  suggestedResolution: string;
  autoFixAvailable: boolean;
}

export interface WorldSyncState {
  networkId: string;
  syncedWorldIds: string[];
  staleWorldIds: string[];
  syncConflicts: WorldConflict[];
  lastSyncedAt: string;
  syncMode: "MANUAL" | "AUTO_SAFE" | "FOUNDER_ONLY";
}

export interface MultiWorldSnapshot {
  snapshotId: string;
  networkId: string;
  worldIds: string[];
  portalCount: number;
  relationCount: number;
  federationCount: number;
  conflictCount: number;
  createdAt: string;
  summary: string;
}

export const nowIso = () => new Date().toISOString();
export const shortId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
