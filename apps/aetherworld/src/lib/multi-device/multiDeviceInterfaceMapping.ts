import { detectDeviceProfile, isDesktopProfile, isMobileProfile, isTabletProfile } from "./deviceProfileDetector";
import type { DeviceProfileId } from "@/constants/multi-device/deviceProfiles";

export interface MultiDeviceUiState {
  currentDeviceProfile: DeviceProfileId;
  currentWorkspaceId?: string;
  currentSessionId?: string;
  currentObjectId?: string;
  currentRunId?: string;
  lastActiveRoute: string;
  sidebarCollapsed: boolean;
  mobileBottomNavActive: string;
  inputDraft: string;
  updatedAt: string;
}

const KEY = "aether.multi-device.ui-state";

export function loadMultiDeviceUiState(): MultiDeviceUiState {
  try {
    if (typeof window === "undefined") throw new Error("ssr");
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    currentDeviceProfile: typeof window !== "undefined" ? detectDeviceProfile(window.innerWidth) : "DESKTOP_NORMAL",
    lastActiveRoute: "/",
    sidebarCollapsed: false,
    mobileBottomNavActive: "/chat",
    inputDraft: "",
    updatedAt: new Date().toISOString(),
  };
}

export function saveMultiDeviceUiState(s: Partial<MultiDeviceUiState>) {
  if (typeof window === "undefined") return;
  const current = loadMultiDeviceUiState();
  const next = { ...current, ...s, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export { isDesktopProfile, isMobileProfile, isTabletProfile };
