export const DEVICE_PROFILES = {
  DESKTOP_WIDE: { id: "DESKTOP_WIDE", label: "宽屏桌面", minWidth: 1440 },
  DESKTOP_NORMAL: { id: "DESKTOP_NORMAL", label: "桌面", minWidth: 1024 },
  TABLET: { id: "TABLET", label: "平板", minWidth: 768 },
  MOBILE_LARGE: { id: "MOBILE_LARGE", label: "大屏手机", minWidth: 414 },
  MOBILE_SMALL: { id: "MOBILE_SMALL", label: "小屏手机", minWidth: 0 },
} as const;

export type DeviceProfileId = keyof typeof DEVICE_PROFILES;
