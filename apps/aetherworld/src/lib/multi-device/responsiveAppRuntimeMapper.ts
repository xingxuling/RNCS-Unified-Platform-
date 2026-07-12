import { isMobileProfile } from "./deviceProfileDetector";
import type { DeviceProfileId } from "@/constants/multi-device/deviceProfiles";

export function mapAppRuntimeLayout(profile: DeviceProfileId) {
  if (isMobileProfile(profile)) {
    return { showFileTree: false, codeEditable: false, sections: ["应用名", "需求摘要", "预览", "代码检查", "导出", "QA"] };
  }
  return { showFileTree: true, codeEditable: true, sections: ["文件树", "代码", "预览", "QA"] };
}
