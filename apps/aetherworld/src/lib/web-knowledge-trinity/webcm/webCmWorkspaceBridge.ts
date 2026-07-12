import { newWktId } from "../webKnowledgeTrinityTypes";
const KEY = "aether.webcm.workspace.v1";
interface Rec { id: string; routeId: string; createdAt: string; payload: unknown; }
function load(): Rec[] { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } }
function save(rs: Rec[]) { try { localStorage.setItem(KEY, JSON.stringify(rs.slice(-200))); } catch {} }
export function recordWebCmRoute(routeId: string, payload: unknown): string {
  const id = newWktId("wcmrec");
  const rs = load();
  rs.push({ id, routeId, createdAt: new Date().toISOString(), payload });
  save(rs);
  return id;
}
export function listWebCmRecords(): Rec[] { return load().slice().reverse(); }
