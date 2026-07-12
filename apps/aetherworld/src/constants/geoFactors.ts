export interface GeoPreset {
  key: string;
  name: string;
  en: string;
  // 9 维 0-100：制度/资源/文化/市场/物理/人脉/成本(逆)/战略/适用阶段
  scores: {
    institution: number;
    resource: number;
    culture: number;
    market: number;
    physical: number;
    network: number;
    cost: number;    // 越低越好
    strategic: number;
    stageFit: number;
  };
  highlights: string[];
  resistance: string[];
}

export const GEO_PRESETS: GeoPreset[] = [
  {
    key: "hk", name: "香港", en: "Hong Kong",
    scores: { institution: 82, resource: 78, culture: 70, market: 55, physical: 60, network: 78, cost: 80, strategic: 88, stageFit: 75 },
    highlights: ["国际接口", "金融/法律制度清晰", "高校与企业网络密集"],
    resistance: ["市场规模有限", "用户教育成本高", "生活成本极高"],
  },
  {
    key: "sg", name: "新加坡", en: "Singapore",
    scores: { institution: 88, resource: 82, culture: 72, market: 60, physical: 75, network: 75, cost: 78, strategic: 85, stageFit: 78 },
    highlights: ["制度稳定", "亚洲资本枢纽", "英文环境利于全球化"],
    resistance: ["内需市场小", "本地文化保守", "落地成本高"],
  },
  {
    key: "sz", name: "深圳", en: "Shenzhen",
    scores: { institution: 70, resource: 85, culture: 75, market: 88, physical: 70, network: 82, cost: 60, strategic: 82, stageFit: 80 },
    highlights: ["产业链完整", "迭代速度极快", "硬件与AI密度高"],
    resistance: ["监管不确定", "竞争激烈", "用户付费教育曲线"],
  },
  {
    key: "gz", name: "广州", en: "Guangzhou",
    scores: { institution: 68, resource: 72, culture: 78, market: 82, physical: 72, network: 70, cost: 45, strategic: 70, stageFit: 75 },
    highlights: ["生活成本低", "商业氛围务实", "供应链完善"],
    resistance: ["国际化弱", "高端人才密度低于深圳"],
  },
  {
    key: "sh", name: "上海", en: "Shanghai",
    scores: { institution: 75, resource: 88, culture: 78, market: 90, physical: 65, network: 85, cost: 72, strategic: 88, stageFit: 82 },
    highlights: ["资本密度高", "消费市场成熟", "国际品牌密集"],
    resistance: ["落地成本高", "节奏快易内耗"],
  },
  {
    key: "bj", name: "北京", en: "Beijing",
    scores: { institution: 80, resource: 85, culture: 82, market: 85, physical: 50, network: 88, cost: 70, strategic: 90, stageFit: 78 },
    highlights: ["政策中心", "学术与AI/媒体密集", "顶层人脉"],
    resistance: ["空气与气候压力", "审批节奏慢"],
  },
  {
    key: "online", name: "全球线上", en: "Global Online",
    scores: { institution: 60, resource: 80, culture: 75, market: 95, physical: 90, network: 70, cost: 88, strategic: 80, stageFit: 88 },
    highlights: ["零地理摩擦", "可验证全球需求", "适合 SaaS / 工具型"],
    resistance: ["缺乏本地信任", "支付/合规分散"],
  },
];

export const GEO_FACTOR_LABELS: Record<keyof GeoPreset["scores"], string> = {
  institution: "制度场",
  resource:    "资源密度",
  culture:     "文化适配",
  market:      "市场开放度",
  physical:    "物理环境",
  network:     "人脉接入",
  cost:        "成本结构(越高越省)",
  strategic:   "战略位置",
  stageFit:    "阶段适配",
};
