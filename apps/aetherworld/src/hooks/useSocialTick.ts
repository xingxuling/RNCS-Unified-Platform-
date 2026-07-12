import { useEffect, useState } from "react";
import { socialStorage } from "@/lib/social/socialStorage";

export function useSocialTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => socialStorage.subscribe(() => setTick((t) => t + 1)), []);
  return tick;
}
