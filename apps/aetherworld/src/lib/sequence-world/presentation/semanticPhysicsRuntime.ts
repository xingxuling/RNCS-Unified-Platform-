import type { SequenceCoreProfile } from "../sequenceCoreEngine";
import { DIGIT_PHYSICS_FIELDS } from "@/constants/sequence-world/presentation/semanticPhysicsFields";

export interface FlowFieldProfile {
  direction: string;
  turbulence: number;
  speed: number;
  affectedZones: string[];
}

export interface AttractionField {
  fieldId: string;
  sourceType: "RESOURCE" | "NPC" | "ZONE" | "EVENT" | "SYMBOL" | "FOUNDER_CORE";
  strength: number;
  radius: number;
  meaning: string;
}

export interface CollapseRule {
  trigger: string;
  threshold: number;
  result: string;
}

export interface RecoveryRule {
  trigger: string;
  recoveryForce: number;
  result: string;
}

export interface EventForceMap {
  byEventType: Record<string, number>;
}

export interface SemanticPhysicsRuntime {
  globalMotionBias: string;
  gravityField: string;
  resistanceField: number;
  flowField: FlowFieldProfile;
  attractionFields: AttractionField[];
  collapseRules: CollapseRule[];
  recoveryRules: RecoveryRule[];
  eventForceMap: EventForceMap;
  physicsSafetyNotes: string[];
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export function generateSemanticPhysicsRuntime(core: SequenceCoreProfile): SemanticPhysicsRuntime {
  const top = core.dominantDigits[0] ?? "5";
  const t = DIGIT_PHYSICS_FIELDS[top];
  const f = core.digitFrequency;
  const total = Object.values(f).reduce((s, n) => s + n, 0) || 1;

  const resistance = clamp01(
    Object.entries(f).reduce((s, [d, n]) => s + (DIGIT_PHYSICS_FIELDS[d]?.resistance ?? 0) * (n / total), 0),
  );
  const turbulence = clamp01(
    Object.entries(f).reduce((s, [d, n]) => s + (DIGIT_PHYSICS_FIELDS[d]?.flowTurbulence ?? 0) * (n / total), 0),
  );

  const attractionFields: AttractionField[] = core.dominantDigits.map(d => {
    const h = DIGIT_PHYSICS_FIELDS[d];
    const sourceType = d === "8" ? "RESOURCE" : d === "2" ? "NPC" : d === "9" ? "SYMBOL" : d === "5" ? "EVENT" : "ZONE";
    return {
      fieldId: `attr-${d}`,
      sourceType,
      strength: h?.attractionStrength ?? 0.3,
      radius: 1 + (h?.attractionStrength ?? 0.3) * 4,
      meaning: `digit ${d}`,
    };
  });

  return {
    globalMotionBias: t?.motion ?? "balanced_flow",
    gravityField: t?.gravity ?? "balanced",
    resistanceField: resistance,
    flowField: {
      direction: top === "5" ? "spiral_burst" : top === "9" ? "ritual_orbit" : "ambient_drift",
      turbulence,
      speed: clamp01(0.2 + turbulence * 0.8),
      affectedZones: ["*"],
    },
    attractionFields,
    collapseRules: [
      { trigger: "event_pressure", threshold: 0.7, result: "phase_shift" },
      { trigger: `digit:${top}_overload`, threshold: 0.6, result: "world_state_change" },
    ],
    recoveryRules: [
      { trigger: "low_pressure", recoveryForce: 0.6, result: "stabilization" },
    ],
    eventForceMap: { byEventType: { CONFLICT: 0.8, RITUAL: 0.6, TRADE: 0.4, COLLAPSE: 0.9, RECOVERY: 0.5 } },
    physicsSafetyNotes: [
      "语义物理是世界规则参数，不是精确物理仿真。",
      "输出可用于游戏 gameplay / 表现层，不要作为现实物理依据。",
    ],
  };
}
