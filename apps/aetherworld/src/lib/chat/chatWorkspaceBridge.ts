import { linkObject, linkRun } from "./chatSessionEngine";

export function saveChatRunToWorkspace(sessionId: string, runId?: string, objectId?: string) {
  if (runId) linkRun(sessionId, runId);
  if (objectId) linkObject(sessionId, objectId);
}
