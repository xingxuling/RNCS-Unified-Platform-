// 联网 → Scheduler 桥接（预留）：用户确认后创建联网复查任务草案
import type { NetworkSource } from "./aetherNetworkTypes";

export interface NetworkRecheckTaskDraft {
  taskType: "NETWORK_RECHECK";
  title: string;
  url: string;
  intervalDays: number;
  state: "WAITING_CONFIRMATION";
}

export function buildRecheckTask(src: NetworkSource, intervalDays = 7): NetworkRecheckTaskDraft {
  return {
    taskType: "NETWORK_RECHECK",
    title: `复查：${src.title ?? src.url}`,
    url: src.url,
    intervalDays,
    state: "WAITING_CONFIRMATION",
  };
}
