// 常数系统文档数据
export interface NumberConstantDoc {
  n: number;
  meaning: string;
  desc: string;
}

export const NUMBER_CONSTANTS_DOC: NumberConstantDoc[] = [
  { n: 0, meaning: "空位 / 重置 / 未显 / 清空", desc: "结构归零、等待显化、清空旧周期。" },
  { n: 1, meaning: "主权 / 自我 / 启动", desc: "起势、立位、主动权确立。" },
  { n: 2, meaning: "关系 / 配对 / 合作", desc: "镜像、配对、协作、谈判。" },
  { n: 3, meaning: "表达 / 创作 / 传播", desc: "输出、放大、被看见、内容显化。" },
  { n: 4, meaning: "秩序 / 制度 / 规则", desc: "结构落地、规范建立、流程化。" },
  { n: 5, meaning: "变局 / 破局 / 转向", desc: "扰动、转折、临界跳跃。" },
  { n: 6, meaning: "责任 / 承载 / 供能", desc: "供养、承担、稳定回路。" },
  { n: 7, meaning: "隐性判断 / 深层读取", desc: "内观、洞察、未明信号解码。" },
  { n: 8, meaning: "资源 / 金钱 / 权力", desc: "实利、势能、规模化能量。" },
  { n: 9, meaning: "终局 / 高位 / 文明感", desc: "封顶、收束、世代级结构完成。" },
];

export interface PhaseDoc {
  key: string;
  cn: string;
  en: string;
  status: "Implemented" | "Reserved" | "Planned";
  items: string[];
}

export const CONSTANT_PHASES: PhaseDoc[] = [
  {
    key: "A", cn: "Phase A · 基础数字常数", en: "Numeric Constants",
    status: "Implemented",
    items: ["0–9 数字常数", "乘除 1–10 算子", "十二长生相位", "日期数字根"],
  },
  {
    key: "B", cn: "Phase B · 结构常数", en: "Structural Constants",
    status: "Reserved",
    items: ["河图洛书", "五行生克", "干支组合", "十神映射", "九宫八卦", "阴阳极性"],
  },
  {
    key: "C", cn: "Phase C · 物理现实常数", en: "Physical-Reality Constants",
    status: "Reserved",
    items: ["太阳活动", "月相周期", "生理节律", "共振耦合", "熵增", "临界阈值", "反馈延迟"],
  },
];
