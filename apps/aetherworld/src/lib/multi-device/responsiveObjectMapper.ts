import { isMobileProfile } from "./deviceProfileDetector";
import type { DeviceProfileId } from "@/constants/multi-device/deviceProfiles";

export function mapObjectCardFields(profile: DeviceProfileId) {
  if (isMobileProfile(profile)) {
    return ["name", "typeTag", "status", "primaryAction", "overflow"];
  }
  return ["name", "type", "summary", "status", "qa", "time", "relatedRun", "actions"];
}
