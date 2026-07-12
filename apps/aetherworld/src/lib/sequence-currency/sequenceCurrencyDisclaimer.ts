// 复用既有数列货币系统的非现实货币声明（避免重复定义）。
export { REAL_CURRENCY_DISCLAIMER } from "@/lib/currency/currencySafetyGuard";

export const SEQUENCE_CURRENCY_BOUNDARY_NOTES = [
  "数列货币是 Aetherworld 内部价值计量系统。",
  "不等于法币 / 证券 / 代币。",
  "不承诺收益，不支持提现，不支持真实交易、不支持法币兑换、不做上链。",
];
