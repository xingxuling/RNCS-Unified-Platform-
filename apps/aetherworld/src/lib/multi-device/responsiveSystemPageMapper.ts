import { isMobileProfile } from "./deviceProfileDetector";
import type { DeviceProfileId } from "@/constants/multi-device/deviceProfiles";

export function mapSystemPageEntries(profile: DeviceProfileId) {
  const entries = [
    { id: "qa", label: "质量检查", to: "/qa" },
    { id: "version", label: "版本跃迁", to: "/version" },
    { id: "recalc", label: "重新计算", to: "/recalculation" },
    { id: "constitution", label: "系统宪法", to: "/constitution" },
    { id: "audit", label: "审计记录", to: "/audit" },
    { id: "settings", label: "设置", to: "/founder" },
  ];
  return { entries, showLogs: !isMobileProfile(profile) };
}
