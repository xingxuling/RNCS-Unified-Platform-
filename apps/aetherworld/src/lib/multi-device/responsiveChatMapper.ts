import { isMobileProfile } from "./deviceProfileDetector";
import type { DeviceProfileId } from "@/constants/multi-device/deviceProfiles";

export function mapChatLayout(profile: DeviceProfileId) {
  if (isMobileProfile(profile)) {
    return { layout: "single-column", inputPlacement: "fixed-bottom", inspector: "bottom-sheet" } as const;
  }
  return { layout: "three-column", inputPlacement: "bottom-center", inspector: "right-drawer" } as const;
}
