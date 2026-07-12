import { isMobileProfile } from "./deviceProfileDetector";
import type { DeviceProfileId } from "@/constants/multi-device/deviceProfiles";

export function mapWorldPageSections(profile: DeviceProfileId) {
  if (isMobileProfile(profile)) {
    return { primary: ["世界名", "状态摘要", "当前事件", "运行 1 tick", "生成事件"], hidden: ["规则", "实体", "区域", "时间线", "因果", "记忆", "QA"] };
  }
  return { primary: ["状态", "规则", "实体", "区域", "事件", "时间线", "因果", "记忆", "QA"], hidden: [] };
}
