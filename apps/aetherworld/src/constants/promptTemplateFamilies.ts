// 模板族库 · Prompt Template Families
// 50 domains × 6 families = 300 template families (按需扩展)
// 此文件预置 60+ 核心模板骨架，并自动为剩余 domain×family 生成默认骨架。
import { PROMPT_DOMAINS } from "./promptDomains";
import { TEMPLATE_FAMILY_LIST, TEMPLATE_FAMILY_META, type TemplateFamilyType } from "./promptTemplateTypes";
import { rulesFor } from "./promptSafetyRules";

export interface PromptTemplateFamily {
  id: string;                    // `${domainId}.${familyType}`
  domainId: string;
  familyType: TemplateFamilyType;
  name: string;                  // 中文
  en: string;
  description: string;
  requiredInputs: string[];
  optionalInputs: string[];
  outputFormat: string;
  safetyRules: string[];
  defaultPromptSkeleton: string;
  examples: string[];
  curated?: boolean;             // 是否核心预置
  effectivenessScore?: number;   // 0-100，运行时回验
}

// 预置 60 条核心模板 —— 与提示词中第 5 节一一对应
type Curated = {
  domainId: string;
  familyType: TemplateFamilyType;
  name: string;
  en: string;
  description: string;
  skeleton: string;
  examples?: string[];
  outputFormat?: string;
};

const CURATED: Curated[] = [
  // Product Design 1-6
  { domainId: "product_design", familyType: "FOUNDATION", name: "产品底层架构", en: "Product Foundation", description: "搭建产品最小骨架。", skeleton: "# 目标产品：{productName}\n# 目标用户：{targetUser}\n# 当前阶段：{currentVersion}\n\n请基于以下约束 {constraints}，输出最小可成立的模块清单、路由与数据结构。\n禁止破坏：{doNotBreak}\n验收：{acceptanceCriteria}" },
  { domainId: "product_design", familyType: "EXPANSION", name: "产品功能扩展", en: "Product Feature Expansion", description: "在现有产品上扩展。", skeleton: "请在 {productName} v{currentVersion} 现有模块（{existingModules}）基础上新增：{goal}\n保留：{doNotBreak}\n输出：新增 / 修改文件清单 + 关键决策。" },
  { domainId: "product_design", familyType: "DEBUG_REPAIR", name: "产品 Bug 修复", en: "Product Bug Repair", description: "修复产品问题。", skeleton: "问题：{problem}\n范围限定：仅修复该问题相关模块；不要重写无关页面。\n保留：{doNotBreak}\n输出：根因 + 最小修复 diff + 回归点。" },
  { domainId: "product_design", familyType: "UX_USER_FACING", name: "产品 UX 简化", en: "Product UX Simplification", description: "降低主路径认知负载。", skeleton: "目标：让 {targetUser} 在 {productName} 主路径上 30 秒内理解。\n用户语言层级：{languageLevel}\n请重写主路径文案与信息层级，不动业务逻辑。" },
  { domainId: "product_design", familyType: "STRATEGY", name: "产品战略", en: "Product Strategy", description: "产品定位与路径判断。", skeleton: "请为 {productName} 给出未来 90 天定位与三条候选路径，每条路径包含：假设 / 资源 / 回验指标。" },
  { domainId: "product_design", familyType: "VALIDATION_FEEDBACK", name: "产品回验", en: "Product Validation", description: "验证产品假设。", skeleton: "请为 {productName} 设计回验方案：核心假设 / 指标 / 周期 / 不可接受阈值。" },

  // UX/UI 7-12
  { domainId: "ux_ui", familyType: "FOUNDATION", name: "UX 底层架构", en: "UX Foundation", description: "搭建信息架构。", skeleton: "请为 {productName} 设计信息架构：顶导 / 侧导 / 主区 / 辅助区，并标注 {targetUser} 的主路径。" },
  { domainId: "ux_ui", familyType: "EXPANSION", name: "UX 流程扩展", en: "UX Flow Expansion", description: "在已有流程上扩展。", skeleton: "在现有流程上加入 {goal}，要求不打断已有主路径；输出：新增页面 + 跳转图。" },
  { domainId: "ux_ui", familyType: "DEBUG_REPAIR", name: "UI Bug 修复", en: "UI Bug Repair", description: "修复界面错位 / 漂移。", skeleton: "问题：{problem}\n仅在受影响组件层修复；不改业务逻辑；输出：组件 diff + 回归点。" },
  { domainId: "ux_ui", familyType: "UX_USER_FACING", name: "用户语言简化", en: "User Language Simplification", description: "把术语改为用户语言。", skeleton: "请将以下页面中的高阶术语降级为 {languageLevel}：{existingModules}\n禁用：分支塌缩 / 风域奇点；保留：安全边界 / 回验入口 / 隐私提示。" },
  { domainId: "ux_ui", familyType: "STRATEGY", name: "多端 UI 策略", en: "Multi-Client UI Strategy", description: "桌面 / 移动 / 企业策略。", skeleton: "为 {productName} 给出桌面 / 移动 / 企业 / Demo 四端 UI 暴露策略：哪些模块显示 / 隐藏 / 降级。" },
  { domainId: "ux_ui", familyType: "VALIDATION_FEEDBACK", name: "UX 反馈回验", en: "UX Feedback Validation", description: "回收并归类反馈。", skeleton: "请把以下反馈归类为：可读性 / 路径 / 文案 / 性能 / 安全，并给出修复优先级。" },

  // Software Development 13-18
  { domainId: "software_dev", familyType: "FOUNDATION", name: "架构底层", en: "Architecture Foundation", description: "确立服务边界与目录结构。", skeleton: "为 {productName} 输出最小可维护架构：目录结构 / 模块边界 / 数据流。" },
  { domainId: "software_dev", familyType: "EXPANSION", name: "模块扩展", en: "Module Expansion", description: "新增模块接入现有架构。", skeleton: "在现有架构上新增 {goal}，给出：新文件清单 + 接口契约 + 不破坏点。" },
  { domainId: "software_dev", familyType: "DEBUG_REPAIR", name: "Bug 修复", en: "Bug Fix", description: "最小化修 bug。", skeleton: "问题：{problem}\n请给出根因 / 最小 diff / 验证步骤；范围禁止扩大。" },
  { domainId: "software_dev", familyType: "UX_USER_FACING", name: "重构 UX", en: "Refactor UX", description: "保留行为重构结构。", skeleton: "对模块 {existingModules} 做无行为变化重构：命名 / 拆分 / 边界；列出迁移点。" },
  { domainId: "software_dev", familyType: "STRATEGY", name: "发布策略", en: "Release Strategy", description: "发布节奏与门槛。", skeleton: "为 {productName} v{currentVersion} 给出发布门槛、回滚方案、灰度策略。" },
  { domainId: "software_dev", familyType: "VALIDATION_FEEDBACK", name: "回归测试", en: "Regression Test", description: "构建回归矩阵。", skeleton: "针对 {existingModules} 给出最小回归集，并标注每条用例的目标 / 数据 / 预期。" },

  // QA 19-24
  { domainId: "qa_testing", familyType: "FOUNDATION", name: "QA 系统底层", en: "QA System Foundation", description: "建立 QA 框架。", skeleton: "为 {productName} 建立 QA 体系：模块清单 / 测试类别 / 严重度分级 / 修复优先级矩阵。" },
  { domainId: "qa_testing", familyType: "EXPANSION", name: "缺失模块扫描", en: "Missing Module Scan", description: "扫描期望存在但缺失的模块。", skeleton: "请基于 {existingModules} 与期望模块列表，输出缺失项与补齐建议。" },
  { domainId: "qa_testing", familyType: "DEBUG_REPAIR", name: "Bug 优先级", en: "Bug Prioritization", description: "给出修复优先级。", skeleton: "请按影响面 / 概率 / 安全性给以下问题排序：{problem}" },
  { domainId: "qa_testing", familyType: "UX_USER_FACING", name: "测试 UI 设计", en: "Test UI Design", description: "为 QA 设计可视化界面。", skeleton: "请为 QA 控制台设计页面：扫描器 / 健康面板 / 修复优先级 / 隔离审计。" },
  { domainId: "qa_testing", familyType: "STRATEGY", name: "QA 战略", en: "QA Strategy", description: "QA 策略与覆盖率。", skeleton: "请为 {productName} 给出 QA 覆盖目标 / 节奏 / 责任分工。" },
  { domainId: "qa_testing", familyType: "VALIDATION_FEEDBACK", name: "回归清单", en: "Regression Checklist", description: "构建回归 checklist。", skeleton: "请输出 {existingModules} 的回归 checklist，并按风险排序。" },

  // Prompt Engineering 25-30
  { domainId: "prompt_engineering", familyType: "FOUNDATION", name: "提示词底层", en: "Prompt Foundation", description: "搭建提示词系统骨架。", skeleton: "请为 {productName} 设计提示词系统骨架：类型 / 变量 / 安全 / 回验。" },
  { domainId: "prompt_engineering", familyType: "EXPANSION", name: "提示词扩展", en: "Prompt Expansion", description: "在已有提示词上扩展。", skeleton: "在现有提示词体系上新增 {goal}：模板族 / 变量 / 输出格式。" },
  { domainId: "prompt_engineering", familyType: "DEBUG_REPAIR", name: "提示词修复", en: "Prompt Repair", description: "修复范围漂移与歧义。", skeleton: "以下提示词出现 {problem}，请最小修复并标注禁止项。" },
  { domainId: "prompt_engineering", familyType: "UX_USER_FACING", name: "提示词用户化", en: "Prompt UX Rewrite", description: "改写为用户语言。", skeleton: "请把提示词改写为 {languageLevel}，保留安全边界与回验入口。" },
  { domainId: "prompt_engineering", familyType: "STRATEGY", name: "提示词战略", en: "Prompt Strategy", description: "提示词长期策略。", skeleton: "请给出 {productName} 提示词体系 90 天演进路径与回验机制。" },
  { domainId: "prompt_engineering", familyType: "VALIDATION_FEEDBACK", name: "提示词回验", en: "Prompt Effectiveness Feedback", description: "回验模板有效性。", skeleton: "请基于使用记录，输出每个模板的有效性 / 漂移 / 推荐权重。" },

  // Business Strategy 31-36
  { domainId: "business_strategy", familyType: "FOUNDATION", name: "商业模型底层", en: "Business Model Foundation", description: "确立商业模型。", skeleton: "请为 {productName} 给出商业模型画布：价值主张 / 客群 / 渠道 / 收入。" },
  { domainId: "business_strategy", familyType: "EXPANSION", name: "增长扩展", en: "Growth Expansion", description: "扩展增长路径。", skeleton: "在现有商业模型上新增三条增长路径，每条带假设 / 资源 / 回验指标。" },
  { domainId: "business_strategy", familyType: "DEBUG_REPAIR", name: "战略风险修复", en: "Strategy Risk Repair", description: "修复战略风险。", skeleton: "请识别 {productName} 当前最大三类战略风险并给出止损方案。" },
  { domainId: "business_strategy", familyType: "UX_USER_FACING", name: "Pitch UX", en: "Pitch UX", description: "对外叙事。", skeleton: "请把 {productName} 改写为面向投资人 / 用户 / 媒体三套叙事，每套 200 字。" },
  { domainId: "business_strategy", familyType: "STRATEGY", name: "市场战略", en: "Market Strategy", description: "市场进入策略。", skeleton: "请为 {productName} 在 {region} 制定 90 天市场进入策略：定位 / 节奏 / 渠道 / 风险。" },
  { domainId: "business_strategy", familyType: "VALIDATION_FEEDBACK", name: "战略回验", en: "Strategy Validation", description: "战略假设回验。", skeleton: "请把战略拆为可证伪假设，并给出每个假设的回验指标与阈值。" },

  // Fiction / Worldbuilding 37-42
  { domainId: "worldbuilding", familyType: "FOUNDATION", name: "世界观底层", en: "Worldview Foundation", description: "建立世界基本规则。", skeleton: "请为 {productName} 世界设计：物理规则 / 社会结构 / 历史脉络 / 派系。" },
  { domainId: "character_design", familyType: "EXPANSION", name: "角色扩展", en: "Character Expansion", description: "新增角色。", skeleton: "请在现有角色组上新增三位角色，每位：动机 / 关系 / 弧线 / 矛盾。" },
  { domainId: "fiction_writing", familyType: "DEBUG_REPAIR", name: "剧情修复", en: "Plot Repair", description: "修复剧情逻辑。", skeleton: "以下章节存在 {problem}，请仅在受影响章节内修复，不破坏主线。" },
  { domainId: "fiction_writing", familyType: "UX_USER_FACING", name: "读者 UX 改写", en: "Reader UX Rewrite", description: "面向读者改写节奏。", skeleton: "请将章节改写为更易读节奏：信息密度 / 段落长度 / 钩子。" },
  { domainId: "fiction_writing", familyType: "STRATEGY", name: "连载战略", en: "Serialization Strategy", description: "连载节奏与钩子。", skeleton: "请为连载给出 12 周节奏：每周钩子 / 高潮 / 留白。" },
  { domainId: "fiction_writing", familyType: "VALIDATION_FEEDBACK", name: "读者反馈回验", en: "Reader Feedback Validation", description: "把读者反馈归类。", skeleton: "请将以下读者反馈归类为：节奏 / 人物 / 世界观 / 文笔，并给出修订优先级。" },

  // Education / Application 43-48
  { domainId: "study_application", familyType: "FOUNDATION", name: "申请计划底层", en: "Application Plan Foundation", description: "建立申请计划。", skeleton: "请为 {targetUser} 申请 {goal} 给出整体计划：定位 / 材料 / 时间表 / 风险。" },
  { domainId: "study_application", familyType: "EXPANSION", name: "材料扩展", en: "Materials Expansion", description: "扩展申请材料。", skeleton: "请在现有材料基础上补齐：PS / 推荐信 / 作品集 / 经历表。" },
  { domainId: "study_application", familyType: "DEBUG_REPAIR", name: "弱项修复", en: "Weakness Repair", description: "修复申请弱项。", skeleton: "请识别申请材料中三类弱项并给出最小化修复方案。" },
  { domainId: "study_application", familyType: "UX_USER_FACING", name: "招生官 UX 改写", en: "Admissions UX Rewrite", description: "面向招生官改写。", skeleton: "请把 PS 改写为招生官 3 分钟可读版本：钩子 / 主线 / 证据 / 收尾。" },
  { domainId: "study_application", familyType: "STRATEGY", name: "院校战略", en: "School Strategy", description: "选校与排序。", skeleton: "请按风险 / 匹配 / 资源给出选校梯度与申请顺序。" },
  { domainId: "study_application", familyType: "VALIDATION_FEEDBACK", name: "结果回验", en: "Outcome Feedback", description: "申请结果回验。", skeleton: "请基于结果回验申请假设，并给出下一轮优化建议。" },

  // Cognitive Recovery 49-54
  { domainId: "cognitive_recovery", familyType: "FOUNDATION", name: "恢复模型底层", en: "Recovery Model Foundation", description: "搭建恢复模型。", skeleton: "请为 {targetUser} 建立认知恢复模型：睡眠 / 净化 / 节律 / 边界。注意：不给医疗建议。" },
  { domainId: "cognitive_recovery", familyType: "EXPANSION", name: "恢复节律扩展", en: "Recovery Routine Expansion", description: "扩展日常节律。", skeleton: "请在现有节律上新增三条恢复节律，每条带触发条件 / 时长 / 退出条件。" },
  { domainId: "cognitive_recovery", familyType: "DEBUG_REPAIR", name: "耗竭风险修复", en: "Burnout Risk Repair", description: "处理耗竭风险。", skeleton: "请识别当前 {problem} 中的耗竭信号，给出停 / 缓 / 转的具体动作。" },
  { domainId: "cognitive_recovery", familyType: "UX_USER_FACING", name: "用户化恢复指南", en: "User-Friendly Recovery Guide", description: "面向用户的指南。", skeleton: "请将恢复方案改写为 {languageLevel}：步骤 / 注意 / 何时求助。" },
  { domainId: "cognitive_recovery", familyType: "STRATEGY", name: "高强度认知策略", en: "High-Power Cognition Strategy", description: "高强度时的策略。", skeleton: "请给出高强度认知期的节奏：冲刺 / 恢复 / 边界 / 中断条件。" },
  { domainId: "cognitive_recovery", familyType: "VALIDATION_FEEDBACK", name: "恢复回验", en: "Recovery Feedback", description: "恢复效果回验。", skeleton: "请基于回验记录，识别哪些恢复动作有效，哪些需要替换。" },

  // Documentation 55-60
  { domainId: "documentation", familyType: "FOUNDATION", name: "产品文档底层", en: "Product Docs Foundation", description: "建立文档系统。", skeleton: "请为 {productName} 建立产品文档系统：章节树 / 术语表 / 回链 / 维护节奏。" },
  { domainId: "documentation", familyType: "EXPANSION", name: "文档扩展", en: "Docs Expansion", description: "新增章节。", skeleton: "请在现有文档上新增章节：{goal}，并标注与已有章节的回链。" },
  { domainId: "documentation", familyType: "DEBUG_REPAIR", name: "文档修复", en: "Docs Repair", description: "修复过期或错误。", skeleton: "请识别文档中与 v{currentVersion} 不一致的章节并最小修复。" },
  { domainId: "documentation", familyType: "UX_USER_FACING", name: "文档用户化", en: "Docs User Language Rewrite", description: "改写为用户语言。", skeleton: "请将以下章节改写为 {languageLevel}：保留安全边界，禁用：分支塌缩 / 风域奇点。" },
  { domainId: "documentation", familyType: "STRATEGY", name: "文档战略", en: "Docs Strategy", description: "文档长期战略。", skeleton: "请给出文档 90 天维护战略：所有权 / 节奏 / 自动化 / 回验。" },
  { domainId: "documentation", familyType: "VALIDATION_FEEDBACK", name: "文档回验", en: "Docs Validation", description: "回验文档可用性。", skeleton: "请基于读者行为数据回验文档可用性，并给出修订优先级。" },
];

function buildSkeleton(domainId: string, family: TemplateFamilyType): string {
  const f = TEMPLATE_FAMILY_META[family];
  return [
    `# 领域：${domainId} · 模板族：${f.cn}（${f.en}）`,
    `# 意图：${f.intent}`,
    ``,
    `## 上下文`,
    `产品 / 对象：{productName}`,
    `目标用户：{targetUser}`,
    `当前阶段：{currentVersion}`,
    `当前模块：{existingModules}`,
    `当前问题：{problem}`,
    `目标：{goal}`,
    `约束：{constraints}`,
    `地区：{region} · 用户语言层级：{languageLevel}`,
    ``,
    `## 任务`,
    `请围绕「{goal}」执行 ${f.cn} 工作，输出 {desiredOutput}。`,
    ``,
    `## 不可破坏`,
    `{doNotBreak}`,
    ``,
    `## 验收`,
    `{acceptanceCriteria}`,
  ].join("\n");
}

function buildAll(): PromptTemplateFamily[] {
  const out: PromptTemplateFamily[] = [];
  const curatedMap = new Map<string, Curated>();
  CURATED.forEach((c) => curatedMap.set(`${c.domainId}.${c.familyType}`, c));

  for (const d of PROMPT_DOMAINS) {
    for (const f of TEMPLATE_FAMILY_LIST) {
      const id = `${d.id}.${f}`;
      const c = curatedMap.get(id);
      const meta = TEMPLATE_FAMILY_META[f];
      const safety = rulesFor(d.id).map((r) => r.cn);
      if (c) {
        out.push({
          id,
          domainId: d.id,
          familyType: f,
          name: c.name,
          en: c.en,
          description: c.description,
          requiredInputs: ["productName","goal","desiredOutput","doNotBreak"],
          optionalInputs: ["targetUser","currentVersion","existingModules","problem","constraints","region","languageLevel","riskBoundary","acceptanceCriteria"],
          outputFormat: c.outputFormat ?? "EXEC_PROMPT",
          safetyRules: safety,
          defaultPromptSkeleton: c.skeleton,
          examples: c.examples ?? [],
          curated: true,
        });
      } else {
        out.push({
          id,
          domainId: d.id,
          familyType: f,
          name: `${d.name} · ${meta.cn}`,
          en: `${d.en} · ${meta.en}`,
          description: `${d.en} ${meta.en} template — ${meta.desc}`,
          requiredInputs: ["productName","goal","desiredOutput","doNotBreak"],
          optionalInputs: ["targetUser","currentVersion","existingModules","problem","constraints","region","languageLevel","riskBoundary","acceptanceCriteria"],
          outputFormat: "EXEC_PROMPT",
          safetyRules: safety,
          defaultPromptSkeleton: buildSkeleton(d.id, f),
          examples: [],
          curated: false,
        });
      }
    }
  }
  return out;
}

export const PROMPT_TEMPLATE_FAMILIES: PromptTemplateFamily[] = buildAll();
export const CURATED_TEMPLATE_COUNT = PROMPT_TEMPLATE_FAMILIES.filter((t) => t.curated).length;
export const TOTAL_TEMPLATE_FAMILY_COUNT = PROMPT_TEMPLATE_FAMILIES.length; // 50*6 = 300

export function findTemplate(id: string) {
  return PROMPT_TEMPLATE_FAMILIES.find((t) => t.id === id);
}

export function templatesByDomain(domainId: string) {
  return PROMPT_TEMPLATE_FAMILIES.filter((t) => t.domainId === domainId);
}

export function templatesByFamily(family: TemplateFamilyType) {
  return PROMPT_TEMPLATE_FAMILIES.filter((t) => t.familyType === family);
}
