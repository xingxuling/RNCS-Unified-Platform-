// 产品文档 · 维护节奏（Maintenance Cadence）
// 每个章节的更新频率、触发条件、责任面与冻结策略
export type Cadence = "ON_CHANGE" | "WEEKLY" | "BI_WEEKLY" | "PER_RELEASE" | "QUARTERLY" | "FROZEN";

export interface DocMaintenanceRule {
  section: string;
  cadence: Cadence;
  triggers: string[];      // 触发更新的事件
  owner: string;           // 责任面
  freezeRule?: string;     // 冻结条件（防止 PROFESSIONAL → USER_FRIENDLY 文案被反复推翻）
}

export const CADENCE_LABEL: Record<Cadence, { cn: string; en: string }> = {
  ON_CHANGE:   { cn: "随代码变更",   en: "On Change" },
  WEEKLY:      { cn: "每周",         en: "Weekly" },
  BI_WEEKLY:   { cn: "双周",         en: "Bi-Weekly" },
  PER_RELEASE: { cn: "每次发版",     en: "Per Release" },
  QUARTERLY:   { cn: "每季",         en: "Quarterly" },
  FROZEN:      { cn: "冻结 / 仅大版本", en: "Frozen" },
};

export const DOC_MAINTENANCE: DocMaintenanceRule[] = [
  { section: "overview",          cadence: "PER_RELEASE", triggers: ["新增主模块", "版本号变更"], owner: "Product" },
  { section: "whitepaper",        cadence: "QUARTERLY",   triggers: ["底层理论修订", "新增计算法族"], owner: "Theory",
    freezeRule: "理论术语锁定，除非整套迁移到新版本，否则不改写。" },
  { section: "manual",            cadence: "BI_WEEKLY",   triggers: ["主流程页面改动", "入门流程简化", "用户反馈聚集"], owner: "UX" },
  { section: "manualCalc",        cadence: "ON_CHANGE",   triggers: ["manualCalculus.ts 更新"], owner: "Engineering" },
  { section: "isolation",         cadence: "FROZEN",      triggers: ["新增主体模式", "隐私策略调整"], owner: "Safety",
    freezeRule: "隔离规范为安全底线，非紧急不改。" },
  { section: "feedbackEntry",     cadence: "PER_RELEASE", triggers: ["新增有预测输出的页面"], owner: "Product" },
  { section: "softwareQA",        cadence: "WEEKLY",      triggers: ["新增 QA 类别", "QA 健康分跌出阈值"], owner: "QA" },
  { section: "accuracy",          cadence: "WEEKLY",      triggers: ["回验数据累计", "指标定义调整"], owner: "Data" },
  { section: "recalculation",     cadence: "ON_CHANGE",   triggers: ["新增重算触发器", "依赖图变更"], owner: "Engineering" },
  { section: "uiFit",             cadence: "PER_RELEASE", triggers: ["新增设备 / 客户端模式"], owner: "UX" },
  { section: "dimensionEvent",    cadence: "BI_WEEKLY",   triggers: ["事件库变更", "维度扩展"], owner: "Engineering" },
  { section: "languageFit",       cadence: "ON_CHANGE",   triggers: ["新增用户语言层级", "术语替换规则更新"], owner: "UX",
    freezeRule: "已上线的用户语言改写文案 7 天冷却期，避免反复横跳。" },
  { section: "abstractPromptForge", cadence: "BI_WEEKLY", triggers: ["新增模板族 / 领域", "迁移模式调整"], owner: "Engineering" },
  { section: "eventLibraryAudit", cadence: "ON_CHANGE",   triggers: ["事件 ID 合并", "去重阈值调整"], owner: "Engineering" },
  { section: "calculus",          cadence: "ON_CHANGE",   triggers: ["任一计算法的输入 / 输出契约变更"], owner: "Engineering" },
  { section: "constants",         cadence: "FROZEN",      triggers: ["Phase B / C 实装"], owner: "Theory",
    freezeRule: "常数语义为系统底层，非整体补完不改。" },
  { section: "determinant",       cadence: "PER_RELEASE", triggers: ["定数状态扩展", "阈值调整"], owner: "Product" },
  { section: "feedback",          cadence: "BI_WEEKLY",   triggers: ["回验表单改动", "权重系统升级"], owner: "Product" },
  { section: "value",             cadence: "QUARTERLY",   triggers: ["商业模型变更"], owner: "Product" },
  { section: "roadmap",           cadence: "PER_RELEASE", triggers: ["发版完成", "里程碑调整"], owner: "Product" },
  { section: "safety",            cadence: "FROZEN",      triggers: ["法务 / 合规变更", "事故复盘"], owner: "Safety",
    freezeRule: "安全边界八条原则为产品底线，仅在合规变化时改写。" },
];
