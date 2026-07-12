import { useEffect, useState } from "react";
import { listTriggers, subscribe } from "@/lib/trigger-calendar/triggerStore";
import type { TriggerItem } from "@/lib/trigger-calendar/triggerTypes";

export function useTriggerItems(): TriggerItem[] {
  const [items, setItems] = useState<TriggerItem[]>(() => listTriggers());
  useEffect(() => {
    const unsub = subscribe(() => setItems(listTriggers()));
    return unsub;
  }, []);
  return items;
}
