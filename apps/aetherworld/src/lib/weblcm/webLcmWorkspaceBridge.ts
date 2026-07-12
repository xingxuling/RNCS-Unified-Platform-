import type { AetherConcept, AetherConceptChain, AetherConceptGraph, ConceptCompressionResult, ConceptPrediction, ConceptExpansionPlan, ConceptSearchResult } from "./webLcmTypes";
import type { WebLcmRuntimeMode } from "@/constants/weblcm/webLcmRuntimeModes";
import { newId } from "./webLcmTypes";

export interface WorkspaceWebLcmRunRecord {
  recordId: string;
  runId: string;
  sourceType: string;
  conceptCount: number;
  chainCount: number;
  graphCount: number;
  runtimeMode: WebLcmRuntimeMode;
  qaStatus: string;
  createdAt: string;
}

const STORAGE_KEY = "aether.weblcm.workspace.v1";

interface WorkspaceStore {
  records: WorkspaceWebLcmRunRecord[];
  concepts: AetherConcept[];
  chains: AetherConceptChain[];
  graphs: AetherConceptGraph[];
  compressions: ConceptCompressionResult[];
  predictions: ConceptPrediction[];
  expansions: ConceptExpansionPlan[];
  searches: ConceptSearchResult[];
}

function emptyStore(): WorkspaceStore {
  return { records: [], concepts: [], chains: [], graphs: [], compressions: [], predictions: [], expansions: [], searches: [] };
}

function loadStore(): WorkspaceStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    return { ...emptyStore(), ...JSON.parse(raw) };
  } catch { return emptyStore(); }
}

function saveStore(store: WorkspaceStore): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed: WorkspaceStore = {
      records: store.records.slice(-50),
      concepts: store.concepts.slice(-200),
      chains: store.chains.slice(-50),
      graphs: store.graphs.slice(-30),
      compressions: store.compressions.slice(-30),
      predictions: store.predictions.slice(-30),
      expansions: store.expansions.slice(-30),
      searches: store.searches.slice(-30),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* quota */ }
}

export function recordWebLcmRun(args: {
  runId: string;
  sourceType: string;
  concepts: AetherConcept[];
  chain?: AetherConceptChain;
  graph?: AetherConceptGraph;
  compression?: ConceptCompressionResult;
  prediction?: ConceptPrediction;
  expansion?: ConceptExpansionPlan;
  runtimeMode: WebLcmRuntimeMode;
  qaStatus: string;
}): WorkspaceWebLcmRunRecord {
  const store = loadStore();
  const record: WorkspaceWebLcmRunRecord = {
    recordId: newId("rec"),
    runId: args.runId,
    sourceType: args.sourceType,
    conceptCount: args.concepts.length,
    chainCount: args.chain ? 1 : 0,
    graphCount: args.graph ? 1 : 0,
    runtimeMode: args.runtimeMode,
    qaStatus: args.qaStatus,
    createdAt: new Date().toISOString(),
  };
  store.records.push(record);
  store.concepts.push(...args.concepts);
  if (args.chain) store.chains.push(args.chain);
  if (args.graph) store.graphs.push(args.graph);
  if (args.compression) store.compressions.push(args.compression);
  if (args.prediction) store.predictions.push(args.prediction);
  if (args.expansion) store.expansions.push(args.expansion);
  saveStore(store);
  return record;
}

export function recordSearchResult(result: ConceptSearchResult): void {
  const store = loadStore();
  store.searches.push(result);
  saveStore(store);
}

export function getWorkspaceStore(): WorkspaceStore { return loadStore(); }
export function listWorkspaceRecords(): WorkspaceWebLcmRunRecord[] { return loadStore().records; }
export function listWorkspaceConcepts(): AetherConcept[] { return loadStore().concepts; }
export function listWorkspaceChains(): AetherConceptChain[] { return loadStore().chains; }
export function listWorkspaceGraphs(): AetherConceptGraph[] { return loadStore().graphs; }
export function clearWorkspace(): void { saveStore(emptyStore()); }
