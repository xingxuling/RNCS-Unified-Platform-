// Symbolic Memory Domains · 符号领域
export interface SymbolicMemoryDomain {
  id: string;
  name: string;
  userFriendlyName: string;
  symbols: string[];
  description: string;
}

export const SYMBOLIC_MEMORY_DOMAINS: SymbolicMemoryDomain[] = [
  { id: "ELEMENT", name: "Element", userFriendlyName: "元素",
    symbols: ["风", "火", "水", "土", "雷", "光", "暗"], description: "基础能量与气候层。" },
  { id: "SKY", name: "Sky", userFriendlyName: "天空",
    symbols: ["星辰", "月", "太阳", "云"], description: "时间、命运、远景。" },
  { id: "SEA", name: "Sea", userFriendlyName: "海洋",
    symbols: ["海", "湖", "河", "潮汐"], description: "情绪与潜意识。" },
  { id: "CITY", name: "City", userFriendlyName: "城市",
    symbols: ["城", "宫殿", "塔", "门", "桥"], description: "秩序与文明聚合。" },
  { id: "WEAPON", name: "Weapon", userFriendlyName: "武器",
    symbols: ["剑", "枪", "弓", "权杖", "刀"], description: "意志与裁决。" },
  { id: "CLOTHING", name: "Clothing", userFriendlyName: "服饰",
    symbols: ["袍", "甲", "冠", "面具"], description: "身份与角色。" },
  { id: "LANGUAGE", name: "Language", userFriendlyName: "语言",
    symbols: ["文字", "咒语", "符号", "未知语言"], description: "意义与传承。" },
  { id: "ANIMAL", name: "Animal", userFriendlyName: "动物",
    symbols: ["龙", "鸟", "狼", "鹿", "蛇", "马"], description: "本能与守护。" },
  { id: "RITUAL", name: "Ritual", userFriendlyName: "祭仪",
    symbols: ["祭典", "誓言", "审判", "加冕"], description: "高位事件结构。" },
  { id: "WAR", name: "War", userFriendlyName: "战争",
    symbols: ["军队", "城墙", "旗帜"], description: "冲突与边界。" },
  { id: "TRAVEL", name: "Travel", userFriendlyName: "迁移",
    symbols: ["船", "路", "边境", "异界门"], description: "跨界与转化。" },
  { id: "DEATH_REBIRTH", name: "Death & Rebirth", userFriendlyName: "死亡与重生",
    symbols: ["墓", "归档", "重生"], description: "终结与新起。" },
  { id: "MEMORY_ARCHIVE", name: "Memory Archive", userFriendlyName: "记忆档案",
    symbols: ["图书馆", "档案馆", "碑文"], description: "信息与传承。" },
  { id: "DIVINE_CONTACT", name: "Divine Contact", userFriendlyName: "神圣接触",
    symbols: ["神明", "使者", "圣域"], description: "高位意义触发。" },
  { id: "TECHNOLOGY", name: "Technology", userFriendlyName: "技术",
    symbols: ["机械", "光路", "飞船", "系统"], description: "工具与系统层。" },
];

export function findDomainBySymbol(sym: string): SymbolicMemoryDomain | undefined {
  return SYMBOLIC_MEMORY_DOMAINS.find(d => d.symbols.some(s => sym.includes(s)));
}
