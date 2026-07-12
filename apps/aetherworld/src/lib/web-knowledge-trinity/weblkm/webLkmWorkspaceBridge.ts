import { newWktId } from "../webKnowledgeTrinityTypes";
const KEY = "aether.weblkm.workspace.v1";
interface Rec { id: string; type: string; runId: string; createdAt: string; payload: unknown; }
function load(): Rec[] { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } }
function save(rs: Rec[]) { try { localStorage.setItem(KEY, JSON.stringify(rs.slice(-200))); } catch {} }
export function recordWebLkmEvent(type: string, runId: string, payload: unknown): string {
  const id = newWktId("wlkmrec");
  const rs = load();
  rs.push({ id, type, runId, createdAt: new Date().toISOString(), payload });
  save(rs);
  return id;
}
export function listWebLkmRecords(): Rec[] { return load().slice().reverse(); }
