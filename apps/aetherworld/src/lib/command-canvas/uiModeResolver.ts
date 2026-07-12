import { AETHER_UI_MODES, DEFAULT_UI_MODE, type AetherUiModeId } from "@/constants/command-canvas/aetherUiModes";

export function listUiModes() { return AETHER_UI_MODES; }
export function defaultUiMode(): AetherUiModeId { return DEFAULT_UI_MODE; }
export function isFocusMode(m: AetherUiModeId) { return m === "FOCUS_MODE"; }
export function isFounderMode(m: AetherUiModeId) { return m === "FOUNDER_MODE"; }
