import { DESKTOP_NAV_ITEMS, MOBILE_BOTTOM_NAV_ITEMS } from "@/constants/multi-device/navigationPatterns";
import { isMobileProfile } from "./deviceProfileDetector";
import type { DeviceProfileId } from "@/constants/multi-device/deviceProfiles";

export function mapNavigationForDevice(profile: DeviceProfileId) {
  if (isMobileProfile(profile)) {
    return { pattern: "MOBILE_BOTTOM_NAV", items: MOBILE_BOTTOM_NAV_ITEMS };
  }
  return { pattern: "DESKTOP_SIDEBAR", items: DESKTOP_NAV_ITEMS };
}
