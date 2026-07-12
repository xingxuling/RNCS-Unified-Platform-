import { newWktId } from "../webKnowledgeTrinityTypes";
const KEY = "aether.webcom.workspace.v1";
interface Rec { id: string; bundleId: string; createdAt: string; payload: unknown; }
function load(): Rec[] { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } }
function save(rs: Rec[]) { try { localStorage.setItem(KEY, JSON.stringify(rs.slice(-200))); } catch {} }
export function recordWebCoMBundle(bundleId: string, payload: unknown): string {
  const id = newWktId("wcomrec");
  const rs = load();
  rs.push({ id, bundleId, createdAt: new Date().toISOString(), payload });
  save(rs);
  return id;
}
export function listWebCoMRecords(): Rec[] { return load().slice().reverse(); }
