// 常数宇宙 v1.0 · 物理现实常数（Phase C 接口）
// 说明：这些是现实变量接口，不是已验证的物理预测模型。
export type PhysicalCategory =
  | "ASTRONOMY" | "GEOGRAPHY" | "GRAVITY" | "ATMOSPHERE"
  | "BIOLOGY"   | "PHYSICS"   | "CHEMISTRY";

export type PhysicalStatus = "PLACEHOLDER" | "ACTIVE" | "EXPERIMENTAL";

export interface PhysicalRealityConstant {
  id: string;
  category: PhysicalCategory;
  name: string;
  description: string;
  status: PhysicalStatus;
  unit?: string;
  defaultValue?: number;
}

export const PHYSICAL_REALITY_CONSTANTS: PhysicalRealityConstant[] = [
  { id: "SOLAR_CYCLE",      category: "ASTRONOMY", name: "太阳周期",  description: "约 11 年周期，对全球节律隐喻输入。", status: "EXPERIMENTAL", unit: "year", defaultValue: 11 },
  { id: "LUNAR_PHASE",      category: "ASTRONOMY", name: "月相",      description: "新月/满月对节律的隐喻输入。",        status: "EXPERIMENTAL" },
  { id: "DAY_NIGHT_RATIO",  category: "ASTRONOMY", name: "昼夜比",    description: "影响个人节律。",                      status: "ACTIVE" },
  { id: "SEASON",           category: "ASTRONOMY", name: "季节",      description: "四季节奏与场域开放度。",              status: "ACTIVE" },
  { id: "CITY_DENSITY",     category: "GEOGRAPHY", name: "城市密度",  description: "场域承载度参数。",                    status: "PLACEHOLDER" },
  { id: "REGION_RESOURCE",  category: "GEOGRAPHY", name: "地区资源",  description: "区域资源开放度。",                    status: "PLACEHOLDER" },
  { id: "STABILITY_GRAV",   category: "GRAVITY",   name: "稳定性",    description: "结构沉降隐喻参数。",                  status: "PLACEHOLDER" },
  { id: "ATTRACTION",       category: "GRAVITY",   name: "吸引力",    description: "吸引/排斥隐喻参数。",                  status: "PLACEHOLDER" },
  { id: "WEATHER",          category: "ATMOSPHERE",name: "天气",      description: "天气对当日体感与判断的影响。",        status: "EXPERIMENTAL" },
  { id: "HUMIDITY",         category: "ATMOSPHERE",name: "湿度",      description: "环境舒适度。",                        status: "PLACEHOLDER" },
  { id: "PRESSURE",         category: "ATMOSPHERE",name: "气压",      description: "气压敏感人群。",                      status: "PLACEHOLDER" },
  { id: "SLEEP",            category: "BIOLOGY",   name: "睡眠",      description: "睡眠质量对判断力。",                  status: "ACTIVE" },
  { id: "EXERCISE",         category: "BIOLOGY",   name: "运动",      description: "运动量对能量。",                      status: "ACTIVE" },
  { id: "NUTRITION",        category: "BIOLOGY",   name: "营养",      description: "营养摄入对恢复。",                    status: "EXPERIMENTAL" },
  { id: "NEURAL_RECOVERY",  category: "BIOLOGY",   name: "神经恢复",  description: "神经系统恢复度。",                    status: "EXPERIMENTAL" },
  { id: "INERTIA",          category: "PHYSICS",   name: "惯性",      description: "结构惯性隐喻参数。",                  status: "PLACEHOLDER" },
  { id: "THRESHOLD",        category: "PHYSICS",   name: "阈值",      description: "触发阈值。",                          status: "ACTIVE" },
  { id: "ENTROPY",          category: "PHYSICS",   name: "熵增",      description: "系统失序倾向。",                      status: "EXPERIMENTAL" },
  { id: "FEEDBACK_DELAY",   category: "PHYSICS",   name: "反馈延迟",  description: "回验延迟。",                          status: "ACTIVE" },
  { id: "NONLINEAR_JUMP",   category: "PHYSICS",   name: "非线性跃迁",description: "突变窗口。",                          status: "EXPERIMENTAL" },
  { id: "DOPAMINE",         category: "CHEMISTRY", name: "多巴胺",    description: "奖励感与动机。",                      status: "EXPERIMENTAL" },
  { id: "ENERGY_CHEM",      category: "CHEMISTRY", name: "能量化学",  description: "体能化学层。",                        status: "PLACEHOLDER" },
  { id: "MOOD_CHEM",        category: "CHEMISTRY", name: "情绪化学",  description: "情绪化学波动。",                      status: "PLACEHOLDER" },
  { id: "SUPPLEMENT",       category: "CHEMISTRY", name: "补剂支持",  description: "补剂对状态。",                        status: "PLACEHOLDER" },
];

export const groupPhysicalByCategory = () => {
  const map: Record<PhysicalCategory, PhysicalRealityConstant[]> = {
    ASTRONOMY: [], GEOGRAPHY: [], GRAVITY: [], ATMOSPHERE: [],
    BIOLOGY: [],   PHYSICS: [],   CHEMISTRY: [],
  };
  for (const c of PHYSICAL_REALITY_CONSTANTS) map[c.category].push(c);
  return map;
};
