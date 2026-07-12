import type { MultiWorldEvent, RegisteredWorld } from "./types";
import { shortId } from "./types";
import type { MultiWorldEventTypeId } from "@/constants/sequence-world/multiverse/multiWorldEventTypes";

export function generateMultiWorldEvent(
  worlds: RegisteredWorld[],
  eventType: MultiWorldEventTypeId = "PORTAL_OPENING",
): MultiWorldEvent | null {
  if (worlds.length < 2) return null;
  const [a, b] = worlds;
  return {
    eventId: shortId("evt"),
    title: `${a.worldName} ↔ ${b.worldName}：${eventType}`,
    eventType,
    involvedWorldIds: [a.worldId, b.worldId],
    triggerReason: "网络共振触发",
    consequences: ["相关门户稳定性变化", "正典需重新检查"],
    affectedPortals: [],
    affectedRelations: [],
    safetyNotes: [
      "多世界事件仅为虚拟结构事件，不代表现实事件。",
      eventType === "MULTI_WORLD_CONFLICT" ? "不构成现实冲突或暴力指导。" : "",
      eventType === "CROSS_WORLD_TRADE" ? "内部价值流动，不构成现实金融。" : "",
    ].filter(Boolean),
  };
}

export function limitEventsPerTick(events: MultiWorldEvent[]): MultiWorldEvent[] {
  // Hard limit 1 main multi-world event per tick.
  return events.slice(0, 1);
}
