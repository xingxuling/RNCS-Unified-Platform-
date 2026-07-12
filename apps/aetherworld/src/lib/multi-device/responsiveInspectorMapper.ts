import { isMobileProfile, isTabletProfile } from "./deviceProfileDetector";
import type { DeviceProfileId } from "@/constants/multi-device/deviceProfiles";

export function mapInspectorPresentation(profile: DeviceProfileId) {
  if (isMobileProfile(profile)) return "bottom-sheet" as const;
  if (isTabletProfile(profile)) return "drawer" as const;
  return "right-panel" as const;
}

export const INSPECTOR_MOBILE_TABS = ["概览", "检查", "追踪", "版本", "导出"] as const;
