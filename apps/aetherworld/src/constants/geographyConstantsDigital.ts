import type { RealityScienceConstant } from "./physicsConstantsDigital";

function c(id: string, name: string, cn: string, meaning: string, positive: string, risk: string, example: string, actions: string[]): RealityScienceConstant {
  return { id, name, userFriendlyName: cn, meaning, positiveUse: positive, risk, example, relatedActions: actions };
}

export const GEOGRAPHY_CONSTANTS_DIGITAL: RealityScienceConstant[] = [
  c("LOCATION_FIT","Location Fit","位置适配","对象是否在适合的位置。","找对场域。","错位无效。","技术产品发抖音。",["平台匹配"]),
  c("FIELD_DENSITY","Field Density","场域密度","目标场的密度。","选高密度场。","稀疏场无传播。","小众平台无量。",["选密度"]),
  c("ACCESSIBILITY","Accessibility","可达性","用户能否方便接触。","降低门槛。","入口埋深。","三级菜单后才能到。",["前置入口"]),
  c("FLOW","Flow","流动性","流是否顺畅。","保持流动。","卡顿。","注册-体验断裂。",["打通流"]),
  c("BOUNDARY","Boundary","边界","地理/制度/文化边界。","识别可越/不可越。","硬撞边界。","海外功能国内推。",["分版"]),
  c("RESOURCE_DISTRIBUTION","Resource Distribution","资源分布","集中或分散。","调动集中。","分散低效。","团队分 5 城。",["资源集中"]),
  c("TERRAIN_RESISTANCE","Terrain Resistance","地形阻力","环境自带阻碍。","顺地形。","硬开路。","对抗平台规则。",["顺规则"]),
  c("CITY_TEMPERAMENT","City Temperament","城市气质","地区文化与速度。","贴合气质。","气质冲突。","北京风格做上海消费。",["本地化"]),
  c("PLATFORM_FIELD","Platform Field","平台场域","平台特性。","按平台改语言。","跨平台同文案。","LinkedIn 用小红书语气。",["平台版本"]),
  c("MIGRATION_WINDOW","Migration Window","迁移窗口","是否适合迁场。","抓窗口。","错过窗口。","老平台衰退期才迁。",["窗口监测"]),
];
