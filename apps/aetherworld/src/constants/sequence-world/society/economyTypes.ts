export const ECONOMY_RESOURCE_TYPES = [
  "GRAIN","ORE","CRYSTAL","KNOWLEDGE","ARTIFACT","RELIC",
  "ENERGY","TEXTILE","BLACK_MARKET_GOOD","HERITAGE_ASSET",
] as const;
export type EconomyResourceType = typeof ECONOMY_RESOURCE_TYPES[number];

export const ECONOMY_DISCLAIMER =
  "世界经济是虚拟世界内部系统，不是现实金融系统，不可提现、不可投资、不可承诺升值。";
