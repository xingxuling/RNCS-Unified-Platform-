import { listRuns, type RunPanelItem } from "./runPanelEngine";
export function getRecentRuns(limit = 12): RunPanelItem[] {
  return listRuns().slice(0, limit);
}
