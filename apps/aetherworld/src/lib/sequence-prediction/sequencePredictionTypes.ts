// Sequence Prediction Engine v0.1 —— 类型定义
export type PredictionTargetType =
  | "PROJECT" | "APP" | "CODE_TASK" | "WORLD_OBJECT" | "MUSIC_OBJECT"
  | "SOCIAL_POST" | "CALENDAR_TASK" | "MODEL_PROVIDER" | "STORE_PACKAGE"
  | "WORKSPACE_OBJECT" | "PERSON" | "RELATIONSHIP" | "ORGANIZATION"
  | "MARKET" | "CUSTOM";

export type PredictionHorizon = "SHORT" | "MID" | "LONG" | "STRATEGIC";

export type ProbabilityBand = "HIGH" | "MEDIUM" | "LOW" | "LOW_PROB_HIGH_IMPACT";

export type ActionPermissionStatus =
  | "ALLOW" | "WAIT" | "BLOCK" | "WATCH" | "REVIEW" | "ESCALATE";

export interface SequencePredictionRequest {
  id: string;
  targetType: PredictionTargetType;
  targetId?: string;
  rawInput: string;
  horizon: PredictionHorizon;
  useMemory: boolean;
  useMsl: boolean;
  useCurrency: boolean;
  useFusion: boolean;
  createdAt: string;
}

export interface FiveDomainState {
  heaven: number;
  earth: number;
  human: number;
  spirit: number;
  wind: number;
  explanation: Record<string, string>;
}

export interface PredictionVariables {
  invariants: string[];
  dynamicVariables: string[];
  multiplierVariables: string[];
  divisorVariables: string[];
  riskVariables: string[];
  windowVariables: string[];
  leapVariables: string[];
}

export interface SequenceTrajectory {
  id: string;
  label: string;
  probabilityBand: ProbabilityBand;
  probabilityRange: string;
  description: string;
  nextSequenceState?: string;
  risks: string[];
  opportunities: string[];
  suggestedActions: string[];
}

export interface ActionPermission {
  status: ActionPermissionStatus;
  reason: string;
  allowedActions: string[];
  blockedActions: string[];
}

export interface ReviewNode {
  id: string;
  label: string;
  suggestedDateOffset: string;
  reason: string;
  calendarReady: boolean;
}

export interface SequencePredictionResult {
  id: string;
  requestId: string;
  targetType: PredictionTargetType;
  currentSequenceState: string;
  fiveDomainState: FiveDomainState;
  variables: PredictionVariables;
  trajectories: SequenceTrajectory[];
  actionPermission: ActionPermission;
  reviewNodes: ReviewNode[];
  confidence: number;
  safetyStatus: "PASS" | "WARN" | "BLOCK";
  safetyNotes: string[];
  referenceSummary: {
    memoryUnits: number;
    mslFrames: number;
    valueEvents: number;
    fusionUsed: boolean;
  };
  generatedAt: string;
}

export function newPredictionId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
