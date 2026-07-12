// sequenceObjectWorkspaceBridge.ts
import type { SequenceObjectType } from "@/constants/sequence-object/sequenceObjectTypes";
import type { SequenceObjectLifecyclePhase } from "@/constants/sequence-object/sequenceObjectLifecyclePhases";
import type { SequenceObjectPermissionLevel } from "@/constants/sequence-object/sequenceObjectPermissionLevels";

export interface WorkspaceSequenceObjectRecord {
  recordId: string;
  objectId: string;
  objectType: SequenceObjectType;
  title: string;
  summary: string;
  source: string;
  reusableInEngines: string[];
  lifecyclePhase: SequenceObjectLifecyclePhase;
  privacyLevel: SequenceObjectPermissionLevel;
  createdAt: string;
}

const store = new Map<string, WorkspaceSequenceObjectRecord>();

export function saveObjectToWorkspace(rec: Omit<WorkspaceSequenceObjectRecord, "recordId" | "createdAt">): WorkspaceSequenceObjectRecord {
  const r: WorkspaceSequenceObjectRecord = { ...rec, recordId: `wsobj_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, createdAt: new Date().toISOString() };
  store.set(r.recordId, r);
  return r;
}

export function listWorkspaceObjects(): WorkspaceSequenceObjectRecord[] {
  return [...store.values()];
}

export function archiveWorkspaceObject(recordId: string): boolean {
  const r = store.get(recordId);
  if (!r) return false;
  r.lifecyclePhase = "ARCHIVE";
  return true;
}
