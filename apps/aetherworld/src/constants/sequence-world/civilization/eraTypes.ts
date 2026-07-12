export const ERA_TYPES = [
  "VOID_ERA","SEED_ERA","TRIBAL_ERA","CITY_STATE_ERA","GUILD_ERA",
  "RULED_CIVILIZATION_ERA","EXPANSION_ERA","FRACTURE_ERA","ARCHIVE_ERA",
  "STAR_RELIC_ERA","TERMINAL_ERA","RESEED_ERA",
] as const;
export type EraType = typeof ERA_TYPES[number];

export const ERA_LABELS: Record<EraType, string> = {
  VOID_ERA: "虚空时代", SEED_ERA: "种子时代", TRIBAL_ERA: "部落时代",
  CITY_STATE_ERA: "城邦时代", GUILD_ERA: "公会时代", RULED_CIVILIZATION_ERA: "规则文明时代",
  EXPANSION_ERA: "扩张时代", FRACTURE_ERA: "裂变时代", ARCHIVE_ERA: "归档时代",
  STAR_RELIC_ERA: "星海遗迹时代", TERMINAL_ERA: "终局时代", RESEED_ERA: "再种子时代",
};

export const DIGIT_TO_ERA: Record<string, EraType> = {
  "0": "ARCHIVE_ERA", "1": "SEED_ERA", "2": "TRIBAL_ERA", "3": "CITY_STATE_ERA",
  "4": "RULED_CIVILIZATION_ERA", "5": "FRACTURE_ERA", "6": "EXPANSION_ERA",
  "7": "ARCHIVE_ERA", "8": "EXPANSION_ERA", "9": "STAR_RELIC_ERA",
};
