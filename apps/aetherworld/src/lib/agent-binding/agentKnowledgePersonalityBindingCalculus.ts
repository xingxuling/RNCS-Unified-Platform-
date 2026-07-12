import type { AgentToolTypeId } from "@/constants/agent-binding/agentToolTypes";
import type { AgentBindingStatus, KnowledgeScope, PrivacyLevel, SubjectMode } from "@/constants/agent-binding/agentBindingTypes";
import type { AgentAutonomyLevel } from "@/constants/agent-binding/agentAutonomyLevels";
import type { AgentMemoryMode } from "@/constants/agent-binding/agentMemoryModes";

export interface AgentKnowledgeBinding {
  bindingId: string;
  enabledKnowledgeSources: string[];
  requiredKnowledgeSources: string[];
  optionalKnowledgeSources: string[];
  knowledgeScope: KnowledgeScope;
  allowedKnowledgeTypes: string[];
  forbiddenKnowledgeTypes: string[];
  staleKnowledgePolicy: "ALLOW_WITH_WARNING" | "BLOCK" | "REQUIRE_RECALCULATION";
  citationOrSourcePolicy: string;
}

export interface AgentPersonalityBinding {
  bindingId: string;
  subjectMode: SubjectMode;
  subjectProfileId?: string;
  personalitySource: string[];
  judgmentStyle: string[];
  outputStyle: string[];
  riskPreference: string;
  creativityPreference: string;
  executionPreference: string;
  communicationStyle: string;
  forbiddenPersonalityUses: string[];
  privacyLevel: PrivacyLevel;
  safetyNotes: string[];
}

export interface AgentCalculusRouting {
  routingId: string;
  allowedCalculusIds: string[];
  requiredCalculusIds: string[];
  forbiddenCalculusIds: string[];
  defaultCalculusId: string;
  routingPolicy: "AUTO" | "TASK_BASED" | "FOUNDER_CONTROLLED" | "MANUAL_ONLY";
  fallbackCalculusIds: string[];
}

export interface AgentObjectInterfaceBinding {
  bindingId: string;
  acceptedInputObjectTypes: string[];
  producedOutputObjectTypes: string[];
  requiredObjectContracts: string[];
  workspaceSaveRequired: boolean;
  exportable: boolean;
  objectQaRequired: boolean;
}

export interface AgentRuntimeBinding {
  bindingId: string;
  runtimeMode: "SUGGEST_ONLY" | "DRAFT_OUTPUT" | "HUMAN_REVIEW_REQUIRED" | "AUTO_RUN_SAFE" | "FOUNDER_ONLY";
  requiresTrace: boolean;
  requiresValidation: boolean;
  requiresQa: boolean;
  requiresWorkspaceRecord: boolean;
  allowedRuntimeSteps: string[];
  blockedRuntimeSteps: string[];
}

export interface AgentGovernanceBinding {
  bindingId: string;
  constitutionRequired: boolean;
  qaRequired: boolean;
  clmRequired: boolean;
  permissionGuardRequired: boolean;
  meaningDriftCheckRequired: boolean;
  highRiskBlockRequired: boolean;
  rules: string[];
}

export interface AgentMemoryPolicy {
  memoryMode: AgentMemoryMode;
  canReadRawSequence: boolean;
  canWriteMemory: boolean;
  canSummarizeMemory: boolean;
  canExportMemory: boolean;
  retentionPolicy: string;
  privacyNotes: string[];
}

export interface AgentAutonomyPolicy {
  autonomyLevel: AgentAutonomyLevel;
  allowedAutonomousActions: string[];
  actionsRequiringConfirmation: string[];
  forbiddenAutonomousActions: string[];
}

export interface AgentBindingProfile {
  bindingId: string;
  agentName: string;
  agentType: AgentToolTypeId;
  toolType: string;
  sourceToolName?: string;
  bindingPurpose: string;
  knowledgeBinding: AgentKnowledgeBinding;
  personalityBinding: AgentPersonalityBinding;
  calculusRouting: AgentCalculusRouting;
  objectInterfaceBinding: AgentObjectInterfaceBinding;
  runtimeBinding: AgentRuntimeBinding;
  governanceBinding: AgentGovernanceBinding;
  memoryPolicy: AgentMemoryPolicy;
  autonomyPolicy: AgentAutonomyPolicy;
  allowedActions: string[];
  forbiddenActions: string[];
  outputProfile: string;
  workspacePolicy: string;
  qaRequirements: string[];
  safetyNotes: string[];
  status: AgentBindingStatus;
  version: string;
  createdAt: string;
  updatedAt: string;
}
