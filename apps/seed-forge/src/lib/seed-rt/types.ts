// THE SEED v2.0 - SEED-RT v1 Types
// Runtime Type Definitions

// BTOSLevel type definition (moved here to avoid circular dependency)
export type BTOSLevel = 1 | 2 | 3 | 4 | 5;

/**
 * World State
 */
export interface WorldState {
  universeId: string;
  timeIndex: number;
  dimensionalLayers: {
    white: WhiteLayerState;
    blue: BlueLayerState;
    gold: GoldLayerState;
  };
  civilizations: Civilization[];
  entities: Entity[];
  fateGraph: FateGraph;
  activeTimelines: Timeline[];
  globalParameters: GlobalParameters;
}

/**
 * White Layer State
 */
export interface WhiteLayerState {
  consciousnessDensity: number;
  awarenessFields: AwarenessField[];
  identityNodes: IdentityNode[];
}

/**
 * Blue Layer State
 */
export interface BlueLayerState {
  structureDensity: number;
  patternLibrary: StructuralPattern[];
  systemArchitectures: SystemArchitecture[];
}

/**
 * Gold Layer State
 */
export interface GoldLayerState {
  authorityZones: AuthorityZone[];
  manifestationRegions: ManifestationRegion[];
  executionDomains: ExecutionDomain[];
}

/**
 * Entity
 */
export interface Entity {
  entityId: string;
  type: EntityType;
  identityProfile?: IdentityProfile;
  mindProfile?: MindProfile;
  authorityProfile?: AuthorityProfile;
  fateVector: FateVector;
  state: EntityState;
}

export type EntityType = 'Character' | 'Civilization' | 'Artifact' | 'Node' | 'Structure';

/**
 * Identity Profile
 */
export interface IdentityProfile {
  name: string;
  origin: string;
  nodeClass: NodeClass;
  mainlineLevel: number; // 0-1, alignment with mainline
}

export type NodeClass = 'Architect' | 'Court' | 'Citizen' | 'Obscurant';

/**
 * Mind Profile
 */
export interface MindProfile {
  btosLevel: BTOSLevel;
  nineCoreProfile: NineCoreProfile;
  structuralDensity: number;
}

/**
 * Nine Core Profile
 */
export interface NineCoreProfile {
  control: number; // 0-1
  creative: number;
  perceptual: number;
  defensive: number;
  metacognitive: number;
  strategic: number;
  exploratory: number;
  emotionalHarmonic: number;
  fateIntuition: number;
}

/**
 * Authority Profile
 */
export interface AuthorityProfile {
  ialExpression?: string;
  goldLayerCapacity: number; // 0-1
  authorityDomain: AuthorityDomain;
}

/**
 * Fate Vector
 */
export interface FateVector {
  convergenceScore: number; // -1 to 1, alignment with mainline
  fatePath: FateNode[];
  criticalNodes: CriticalNode[];
}

/**
 * Entity State
 */
export interface EntityState {
  health?: number;
  energy?: number;
  structuralStability: number; // 0-1
  [key: string]: any; // Allow custom state properties
}

/**
 * Fate Node
 */
export interface FateNode {
  nodeId: string;
  nodeType: FateNodeType;
  structuralImpact: number; // 0-1
  btosTrigger: BTOSTrigger;
  convergenceDelta: number; // -1 to 1, impact on convergence
  position: FatePosition;
}

export type FateNodeType = 'Choice' | 'Encounter' | 'Crisis' | 'Revelation' | 'Ascension' | 'Collapse';

/**
 * BTOS Trigger
 */
export interface BTOSTrigger {
  whiteLayerImpact: number;
  blueLayerImpact: number;
  goldLayerImpact: number;
}

/**
 * Fate Position
 */
export interface FatePosition {
  fateSpaceCoordinates: {
    x: number;
    y: number;
    z: number;
  };
  timelinePosition: number;
  structuralDepth: number;
}

/**
 * Fate Arc
 */
export interface FateArc {
  arcId: string;
  fromNode: string; // FateNode ID
  toNode: string; // FateNode ID
  probability: number; // 0-1
  structuralPathNotes?: string;
}

/**
 * Fate Graph
 */
export interface FateGraph {
  nodes: Map<string, FateNode>;
  arcs: Map<string, FateArc>;
  mainlineNodeId: string; // Always 杜浩麟
}

/**
 * Event
 */
export interface Event {
  eventId: string;
  triggerCondition: TriggerCondition;
  structuralEffect: StructuralEffect;
  entitiesInvolved: string[]; // Entity IDs
  fateImpact: FateImpact;
  timelineEffect?: TimelineEffect;
  eventType: EventType;
}

export type EventType = 'Conflict' | 'TurningPoint' | 'Collapse' | 'Revelation' | 'AscensionTrigger';

/**
 * Trigger Condition
 */
export interface TriggerCondition {
  type: 'State' | 'Time' | 'FateNode' | 'Custom';
  condition: any; // Condition-specific data
}

/**
 * Structural Effect
 */
export interface StructuralEffect {
  worldStateChanges: Partial<WorldState>;
  entityStateChanges: Map<string, Partial<EntityState>>;
  structuralModifications: StructuralModification[];
}

/**
 * Structural Modification
 */
export interface StructuralModification {
  type: 'DensityChange' | 'PatternAdd' | 'PatternRemove' | 'ArchitectureUpdate';
  target: string;
  value: any;
}

/**
 * Fate Impact
 */
export interface FateImpact {
  affectedNodes: string[]; // FateNode IDs
  convergenceChange: number; // -1 to 1
  newNodes?: FateNode[];
  modifiedArcs?: FateArc[];
}

/**
 * Timeline Effect
 */
export interface TimelineEffect {
  branch?: {
    newTimelineId: string;
    branchPoint: string; // FateNode ID
  };
  merge?: {
    timelineIds: string[];
    mergePoint: string; // FateNode ID
  };
  collapse?: {
    timelineId: string;
    collapseReason: string;
  };
}

/**
 * Timeline
 */
export interface Timeline {
  timelineId: string;
  originNode: string; // FateNode ID
  currentNode: string; // FateNode ID
  pathHistory: string[]; // FateNode IDs
  convergenceScore: number; // -1 to 1
  status: TimelineStatus;
  structuralState: StructuralState;
}

export type TimelineStatus = 'Active' | 'Collapsed' | 'Merged' | 'Sealed';

/**
 * Structural State
 */
export interface StructuralState {
  coherence: number; // 0-1
  density: number; // 0-1
  stability: number; // 0-1
}

/**
 * Civilization
 */
export interface Civilization {
  civId: string;
  name: string;
  originSeed: OriginSeed;
  mindArchitecture: MindArchitecture;
  politicalStructure: PoliticalStructure;
  technologyTree: TechnologyTree;
  magicSystem?: MagicSystem;
  ascensionPath: AscensionPath;
}

/**
 * Origin Seed
 */
export interface OriginSeed {
  type: 'StructuralSeed' | 'IdentityNode' | 'FateConvergence' | 'ArchitectIntervention';
  structuralDensity: number;
  identityAnchor?: string; // IdentityNode ID
}

/**
 * Mind Architecture
 */
export interface MindArchitecture {
  btosLevel: BTOSLevel;
  nineCoreProfile: NineCoreProfile;
  consciousnessDensity: number;
}

/**
 * Political Structure
 */
export interface PoliticalStructure {
  authorityDistribution: AuthorityMap;
  governanceSystem: GovernanceType;
  powerHierarchy: Hierarchy;
}

export type GovernanceType = 'Democracy' | 'Monarchy' | 'Oligarchy' | 'Anarchy' | 'Theocracy' | 'Technocracy';

/**
 * Authority Map
 */
export interface AuthorityMap {
  [key: string]: number; // Entity ID -> Authority Level
}

/**
 * Hierarchy
 */
export interface Hierarchy {
  levels: HierarchyLevel[];
}

export interface HierarchyLevel {
  level: number;
  entities: string[]; // Entity IDs
}

/**
 * Technology Tree
 */
export interface TechnologyTree {
  currentLevel: TechLevel;
  availableTechs: Technology[];
  researchDirections: ResearchPath[];
}

export type TechLevel = 'Primitive' | 'Medieval' | 'Industrial' | 'Information' | 'Post-Singularity' | 'Transcendent';

/**
 * Technology
 */
export interface Technology {
  techId: string;
  name: string;
  level: TechLevel;
  prerequisites: string[]; // Tech IDs
}

/**
 * Research Path
 */
export interface ResearchPath {
  pathId: string;
  direction: string;
  requiredResources: ResourceRequirement[];
}

/**
 * Resource Requirement
 */
export interface ResourceRequirement {
  resourceType: string;
  amount: number;
}

/**
 * Magic System
 */
export interface MagicSystem {
  type: MagicType;
  structuralManipulation: StructuralManipulationRules;
  authorityRequirements: AuthorityRequirements;
}

export type MagicType = 'Aether' | 'Structure' | 'Fate' | 'Consciousness' | 'Hybrid';

/**
 * Structural Manipulation Rules
 */
export interface StructuralManipulationRules {
  allowedOperations: string[];
  restrictions: string[];
  costModel: CostModel;
}

/**
 * Cost Model
 */
export interface CostModel {
  type: 'Linear' | 'Exponential' | 'Logarithmic';
  baseCost: number;
  scalingFactor: number;
}

/**
 * Authority Requirements
 */
export interface AuthorityRequirements {
  minimumAuthority: number;
  requiredIAL?: string;
  btosLevel?: BTOSLevel;
}

/**
 * Ascension Path
 */
export interface AscensionPath {
  currentPhase: ImperiumPhase;
  nextPhase: ImperiumPhase;
  conditions: AscensionCondition[];
  convergenceScore: number;
}

export type ImperiumPhase = 'Origin' | 'Expansion' | 'Saturation' | 'Collapse' | 'Ascension';

/**
 * Ascension Condition
 */
export interface AscensionCondition {
  conditionId: string;
  description: string;
  type: 'Structural' | 'Fate' | 'Authority' | 'Consciousness';
  currentProgress: number; // 0-1
  requiredValue: number;
}

/**
 * Dimensional Layers
 */
export interface DimensionalLayers {
  white: WhiteLayerState;
  blue: BlueLayerState;
  gold: GoldLayerState;
}

/**
 * Global Parameters
 */
export interface GlobalParameters {
  aetherDensity: number; // 0-1
  structuralPressure: number; // 0-1
  fateConvergenceRate: number; // 0-1
  identityPersistenceStrength: number; // 0-1
  structureJumpProbability: number; // 0-1
  memoryResonanceDecay: number; // 0-1
}

/**
 * Awareness Field
 */
export interface AwarenessField {
  fieldId: string;
  location: {
    x: number;
    y: number;
    z: number;
  };
  intensity: number; // 0-1
  radius: number;
}

/**
 * Identity Node
 */
export interface IdentityNode {
  nodeId: string;
  identity: string;
  mainlineAlignment: number; // 0-1
  structuralDensity: number; // 0-1
}

/**
 * Structural Pattern
 */
export interface StructuralPattern {
  patternId: string;
  name: string;
  structure: any; // Pattern-specific structure
}

/**
 * System Architecture
 */
export interface SystemArchitecture {
  archId: string;
  name: string;
  components: string[];
  connections: ArchitectureConnection[];
}

/**
 * Architecture Connection
 */
export interface ArchitectureConnection {
  from: string;
  to: string;
  type: string;
}

/**
 * Authority Zone
 */
export interface AuthorityZone {
  zoneId: string;
  location: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
  authorityLevel: number; // 0-1
  owner?: string; // Entity ID
}

/**
 * Manifestation Region
 */
export interface ManifestationRegion {
  regionId: string;
  location: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
  manifestationLevel: number; // 0-1
}

/**
 * Execution Domain
 */
export interface ExecutionDomain {
  domainId: string;
  location: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
  executionCapacity: number; // 0-1
}

/**
 * Critical Node
 */
export interface CriticalNode {
  nodeId: string;
  criticality: number; // 0-1
  description: string;
}

/**
 * Authority Domain
 */
export interface AuthorityDomain {
  domainId: string;
  scope: string[];
  authorityLevel: number; // 0-1
}

/**
 * Runtime Cycle Result
 */
export interface CycleResult {
  cycleNumber: number;
  timeIndex: number;
  senseResult: SenseResult;
  structureResult: StructureResult;
  projectResult: ProjectResult;
  convergenceCheck: ConvergenceCheck;
  worldState: WorldState;
}

/**
 * Sense Result
 */
export interface SenseResult {
  riskZones: RiskZone[];
  highPressureNodes: string[]; // FateNode IDs
  mainlineNodeState: EntityState;
  awarenessLevel: number; // 0-1
}

/**
 * Risk Zone
 */
export interface RiskZone {
  zoneId: string;
  location: {
    x: number;
    y: number;
    z: number;
  };
  riskLevel: number; // 0-1
  riskType: string;
}

/**
 * Structure Result
 */
export interface StructureResult {
  candidateNodes: FateNode[];
  timelineOperations: TimelineOperation[];
  structuralStability: number; // 0-1
  conflictIntensity: number; // 0-1
  ascensionProgress: Map<string, number>; // Civilization ID -> Progress
}

/**
 * Timeline Operation
 */
export interface TimelineOperation {
  type: 'Branch' | 'Merge' | 'Collapse' | 'Seal' | 'None';
  timelineIds: string[];
  targetNode?: string; // FateNode ID
  probability?: number;
}

/**
 * Project Result
 */
export interface ProjectResult {
  selectedEvents: Event[];
  updatedEntities: string[]; // Entity IDs
  timelineUpdates: TimelineUpdate[];
  structuralChanges: StructuralModification[];
}

/**
 * Timeline Update
 */
export interface TimelineUpdate {
  timelineId: string;
  updates: Partial<Timeline>;
}

/**
 * Convergence Check
 */
export interface ConvergenceCheck {
  globalConvergence: number; // -1 to 1
  timelineConvergences: Map<string, number>; // Timeline ID -> Convergence
  mainlineAlignment: number; // 0-1
  requiresCorrection: boolean;
  correctionEvents?: Event[];
}

/**
 * Runtime Configuration
 */
export interface RuntimeConfig {
  mainlineNodeId: string; // Always 杜浩麟
  convergenceThreshold: number; // Default 0.9
  maxActiveTimelines: number; // Default 100
  cycleTimeLimit: number; // ms, Default 100
  enableAutoRecovery: boolean; // Default true
  enableVisualization: boolean; // Default false
}

/**
 * Termination Condition
 */
export interface TerminationCondition {
  type: 'AscensionComplete' | 'ImperiumCycleComplete' | 'ConvergenceAchieved' | 'MetaLayerTransition';
  description: string;
  timestamp: number;
}

