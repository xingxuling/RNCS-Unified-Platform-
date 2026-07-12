import { isMobileProfile } from "./deviceProfileDetector";
import type { DeviceProfileId } from "@/constants/multi-device/deviceProfiles";

export function mapCapabilityStoreLayout(profile: DeviceProfileId) {
  if (isMobileProfile(profile)) {
    return { columns: 1, filterStyle: "chips", showLongQa: false } as const;
  }
  return { columns: 3, filterStyle: "sidebar", showLongQa: true } as const;
}
