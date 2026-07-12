import { useEffect, useState } from "react";
import { RESPONSIVE_BREAKPOINTS } from "@/constants/multi-device/responsiveBreakpoints";
import type { DeviceProfileId } from "@/constants/multi-device/deviceProfiles";

export function detectDeviceProfile(width: number): DeviceProfileId {
  if (width >= RESPONSIVE_BREAKPOINTS.DESKTOP_WIDE) return "DESKTOP_WIDE";
  if (width >= RESPONSIVE_BREAKPOINTS.DESKTOP_NORMAL) return "DESKTOP_NORMAL";
  if (width >= RESPONSIVE_BREAKPOINTS.TABLET) return "TABLET";
  if (width >= RESPONSIVE_BREAKPOINTS.MOBILE_LARGE) return "MOBILE_LARGE";
  return "MOBILE_SMALL";
}

export function isMobileProfile(p: DeviceProfileId) {
  return p === "MOBILE_LARGE" || p === "MOBILE_SMALL";
}
export function isTabletProfile(p: DeviceProfileId) {
  return p === "TABLET";
}
export function isDesktopProfile(p: DeviceProfileId) {
  return p === "DESKTOP_NORMAL" || p === "DESKTOP_WIDE";
}

export function useDeviceProfile(): DeviceProfileId {
  const [profile, setProfile] = useState<DeviceProfileId>(() =>
    typeof window === "undefined" ? "DESKTOP_NORMAL" : detectDeviceProfile(window.innerWidth)
  );
  useEffect(() => {
    const onResize = () => setProfile(detectDeviceProfile(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return profile;
}
