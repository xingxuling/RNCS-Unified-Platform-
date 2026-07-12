export interface SemanticPhysicsFieldHint {
  digit: string;
  motion: string;
  gravity: string;
  resistance: number;
  collapseRisk: number;
  recoveryForce: number;
  attractionStrength: number;
  flowTurbulence: number;
}

export const DIGIT_PHYSICS_FIELDS: Record<string, SemanticPhysicsFieldHint> = {
  "0": { digit: "0", motion: "frozen", gravity: "null_void", resistance: 0.9, collapseRisk: 0.3, recoveryForce: 0.1, attractionStrength: 0, flowTurbulence: 0 },
  "1": { digit: "1", motion: "directional_thrust", gravity: "center_pull", resistance: 0.2, collapseRisk: 0.1, recoveryForce: 0.5, attractionStrength: 0.7, flowTurbulence: 0.1 },
  "2": { digit: "2", motion: "orbital_pair", gravity: "pair_attraction", resistance: 0.3, collapseRisk: 0.1, recoveryForce: 0.4, attractionStrength: 0.8, flowTurbulence: 0.2 },
  "3": { digit: "3", motion: "wave_diffusion", gravity: "signal_spread", resistance: 0.2, collapseRisk: 0.2, recoveryForce: 0.3, attractionStrength: 0.3, flowTurbulence: 0.5 },
  "4": { digit: "4", motion: "bounded_grid", gravity: "rule_wall", resistance: 0.7, collapseRisk: 0.1, recoveryForce: 0.4, attractionStrength: 0.2, flowTurbulence: 0.1 },
  "5": { digit: "5", motion: "burst_turn", gravity: "wind_shear", resistance: 0.2, collapseRisk: 0.5, recoveryForce: 0.2, attractionStrength: 0.3, flowTurbulence: 0.9 },
  "6": { digit: "6", motion: "breathing", gravity: "bio_cushion", resistance: 0.4, collapseRisk: 0.1, recoveryForce: 0.9, attractionStrength: 0.4, flowTurbulence: 0.2 },
  "7": { digit: "7", motion: "hidden_drag", gravity: "unseen_pull", resistance: 0.6, collapseRisk: 0.3, recoveryForce: 0.2, attractionStrength: 0.4, flowTurbulence: 0.4 },
  "8": { digit: "8", motion: "heavy_converge", gravity: "resource_well", resistance: 0.5, collapseRisk: 0.2, recoveryForce: 0.3, attractionStrength: 0.9, flowTurbulence: 0.2 },
  "9": { digit: "9", motion: "ritual_collapse", gravity: "end_state_converge", resistance: 0.4, collapseRisk: 0.6, recoveryForce: 0.3, attractionStrength: 0.7, flowTurbulence: 0.3 },
};
