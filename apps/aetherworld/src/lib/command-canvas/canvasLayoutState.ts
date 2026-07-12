import { DEFAULT_UI_MODE, type AetherUiModeId } from "@/constants/command-canvas/aetherUiModes";

export interface CommandCanvasWorkspaceState {
  currentWorkspaceId?: string;
  currentObjectId?: string;
  currentRunId?: string;
  pinnedCapabilityIds: string[];
  recentObjectIds: string[];
  recentRunIds: string[];
  uiMode: AetherUiModeId;
  inspectorOpen: boolean;
  runsPanelOpen: boolean;
  sidebarCollapsed: boolean;
}

let STATE: CommandCanvasWorkspaceState = {
  pinnedCapabilityIds: ["WEB_PRODUCT_M", "WEB_CODE_M", "WEBLLM"],
  recentObjectIds: [],
  recentRunIds: [],
  uiMode: DEFAULT_UI_MODE,
  inspectorOpen: true,
  runsPanelOpen: true,
  sidebarCollapsed: false,
};

const listeners = new Set<(s: CommandCanvasWorkspaceState) => void>();

export function getCanvasLayoutState(): CommandCanvasWorkspaceState { return STATE; }
export function setCanvasLayoutState(patch: Partial<CommandCanvasWorkspaceState>) {
  STATE = { ...STATE, ...patch };
  listeners.forEach((l) => l(STATE));
}
export function subscribeCanvasLayoutState(l: (s: CommandCanvasWorkspaceState) => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function pushRecentObject(id: string) {
  const rest = STATE.recentObjectIds.filter((x) => x !== id);
  setCanvasLayoutState({ recentObjectIds: [id, ...rest].slice(0, 20), currentObjectId: id });
}
export function pushRecentRun(id: string) {
  const rest = STATE.recentRunIds.filter((x) => x !== id);
  setCanvasLayoutState({ recentRunIds: [id, ...rest].slice(0, 30), currentRunId: id });
}
