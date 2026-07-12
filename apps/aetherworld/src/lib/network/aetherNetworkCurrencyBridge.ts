// 联网 → Sequence Currency 桥接（预留）：联网读取消耗 + 资料价值计量
import type { NetworkSource } from "./aetherNetworkTypes";

export interface CurrencyMeterDraft {
  costUnit: "NETWORK_READ";
  cost: number;
  value: number;
  url: string;
  at: string;
}

export function meterNetworkRead(src: NetworkSource): CurrencyMeterDraft {
  const cost = 1; // 单次只读
  const value = Math.round(src.trustScore * 100) / 100;
  return { costUnit: "NETWORK_READ", cost, value, url: src.url, at: src.fetchedAt };
}
