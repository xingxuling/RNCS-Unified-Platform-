import { getCanvasLayoutState, setCanvasLayoutState } from "./canvasLayoutState";

export function enterFocusMode() {
  const prev = getCanvasLayoutState().uiMode;
  setCanvasLayoutState({
    uiMode: "FOCUS_MODE",
    sidebarCollapsed: true,
    runsPanelOpen: false,
    inspectorOpen: false,
  });
  return prev;
}

export function exitFocusMode() {
  setCanvasLayoutState({
    uiMode: "COMMAND_MODE",
    sidebarCollapsed: false,
    runsPanelOpen: true,
    inspectorOpen: true,
  });
}

export function toggleFocusMode() {
  const s = getCanvasLayoutState();
  if (s.uiMode === "FOCUS_MODE") exitFocusMode();
  else enterFocusMode();
}
