// AetherSeed Unattended Training Factory · 电源与息屏检测
import type { PowerStatusReport } from "./unattendedTypes";

export async function detectPowerStatus(): Promise<PowerStatusReport> {
  let pluggedIn: boolean | "UNKNOWN" = "UNKNOWN";
  let method: PowerStatusReport["detectionMethod"] = "UNKNOWN";

  if (typeof navigator !== "undefined" && "getBattery" in navigator) {
    try {
      const nav = navigator as Navigator & {
        getBattery?: () => Promise<{ charging: boolean }>;
      };
      const battery = await nav.getBattery?.();
      if (battery) {
        pluggedIn = battery.charging;
        method = "BROWSER_API";
      }
    } catch {
      /* ignore */
    }
  }

  return {
    pluggedIn,
    systemSleepDisabled: "UNKNOWN",
    screenSleepAllowed: "UNKNOWN",
    detectionMethod: method,
    recommendation:
      "训练期间建议：屏幕可以关闭（节能），但系统睡眠必须关闭，否则训练进程会被挂起。",
    manualWindowsHints: [
      "设置 → 系统 → 电源和电池",
      "屏幕关闭时间：可设置较短（如 10 分钟）",
      "睡眠：训练期间设为「从不」",
      "接通电源时睡眠：从不",
    ],
    manualCommandHints: [
      "powercfg /change standby-timeout-ac 0   # 接通电源时永不系统睡眠",
      "powercfg /change monitor-timeout-ac 10  # 接通电源时 10 分钟关闭屏幕",
      "# 训练完成后可恢复：powercfg /change standby-timeout-ac 30",
    ],
  };
}
