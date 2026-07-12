import { isMobileProfile } from "./deviceProfileDetector";
import type { DeviceProfileId } from "@/constants/multi-device/deviceProfiles";

export interface ActionItem { id: string; label: string; primary?: boolean; }

export function mapActionsForDevice(profile: DeviceProfileId, actions: ActionItem[]) {
  if (!isMobileProfile(profile)) return { primary: actions, overflow: [] as ActionItem[] };
  const primary = actions.find((a) => a.primary) ?? actions[0];
  const overflow = actions.filter((a) => a.id !== primary?.id);
  return { primary: primary ? [primary] : [], overflow };
}
