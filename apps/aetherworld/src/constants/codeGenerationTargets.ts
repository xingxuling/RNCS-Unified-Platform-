// 代码生成目标 Code Generation Targets
export interface CodeTarget {
  id: string;
  name: string;
  typicalFiles: string[];
  requiredImports: string[];
  commonRisks: string[];
  requiredAcceptanceCriteria: string[];
}

export const CODE_TARGETS: CodeTarget[] = [
  { id: "route", name: "路由页面", typicalFiles: ["src/routes/*.tsx"],
    requiredImports: ["@tanstack/react-router"],
    commonRisks: ["与现有路由冲突", "未设置 head meta"],
    requiredAcceptanceCriteria: ["新路由可访问", "侧边栏可见", "head meta 完整"] },
  { id: "component", name: "组件", typicalFiles: ["src/components/*.tsx"],
    requiredImports: ["react"],
    commonRisks: ["未使用 design tokens", "破坏已有 props 接口"],
    requiredAcceptanceCriteria: ["组件可复用", "样式遵循设计系统"] },
  { id: "lib", name: "计算/工具库", typicalFiles: ["src/lib/*.ts"],
    requiredImports: [],
    commonRisks: ["重复实现", "未与现有引擎接入"],
    requiredAcceptanceCriteria: ["函数有类型签名", "可被其他模块导入"] },
  { id: "constants", name: "常数表", typicalFiles: ["src/constants/*.ts"],
    requiredImports: [],
    commonRisks: ["与 Constant Universe 重复定义"],
    requiredAcceptanceCriteria: ["常数已注册到 Constant Universe（如适用）"] },
  { id: "docs", name: "产品文档", typicalFiles: ["src/routes/docs.tsx"],
    requiredImports: [],
    commonRisks: ["与百科条目不同步"],
    requiredAcceptanceCriteria: ["文档章节与功能匹配"] },
  { id: "encyclopedia", name: "百科条目", typicalFiles: ["src/constants/encyclopediaSeedEntries.ts"],
    requiredImports: [],
    commonRisks: ["与已有条目语义重复"],
    requiredAcceptanceCriteria: ["三层解释完整", "包含安全边界"] },
  { id: "qa", name: "QA 检查", typicalFiles: ["src/routes/software-qa.tsx"],
    requiredImports: [],
    commonRisks: ["误报", "未设置 severity"],
    requiredAcceptanceCriteria: ["检查项有 severity 与修复建议"] },
  { id: "recalculation", name: "重算同步", typicalFiles: ["src/routes/recalculation.tsx"],
    requiredImports: [],
    commonRisks: ["未触发依赖模块标记 stale"],
    requiredAcceptanceCriteria: ["新变更能被 Recalculation 识别"] },
  { id: "promptForge", name: "Prompt Forge 模板", typicalFiles: ["src/routes/prompt-forge.tsx"],
    requiredImports: [],
    commonRisks: ["模板缺少变量提示"],
    requiredAcceptanceCriteria: ["模板可一键复制"] },
  { id: "founder", name: "Founder 保护模块", typicalFiles: ["src/components/FounderGate.tsx"],
    requiredImports: [],
    commonRisks: ["权限检查缺失", "普通用户可见"],
    requiredAcceptanceCriteria: ["仅 Founder 可见", "高风险操作有二次确认"] },
  { id: "safety", name: "Safety Boundary", typicalFiles: ["src/constants/*SafetyRules.ts"],
    requiredImports: [],
    commonRisks: ["安全边界文案缺失"],
    requiredAcceptanceCriteria: ["用户可见的 Safety Note", "禁止用语过滤"] },
  { id: "storage", name: "本地存储", typicalFiles: ["src/lib/store.ts"],
    requiredImports: [],
    commonRisks: ["破坏 Demo/Real 隔离", "覆盖已有 key"],
    requiredAcceptanceCriteria: ["按 subjectId 分区", "提供清理函数"] },
  { id: "export", name: "导出功能", typicalFiles: ["src/components/*Export*.tsx"],
    requiredImports: [],
    commonRisks: ["导出缺少安全说明"],
    requiredAcceptanceCriteria: ["支持 Markdown / JSON", "包含安全边界文本"] },
  { id: "ui", name: "UI 重构", typicalFiles: ["src/components/*", "src/styles.css"],
    requiredImports: [],
    commonRisks: ["破坏现有交互", "颜色脱离 token"],
    requiredAcceptanceCriteria: ["设计 tokens", "多端兼容"] },
  { id: "test", name: "测试清单", typicalFiles: ["src/routes/software-qa.tsx"],
    requiredImports: [],
    commonRisks: ["测试覆盖不足"],
    requiredAcceptanceCriteria: ["主流程覆盖", "异常路径覆盖"] },
];

export function getCodeTarget(id: string): CodeTarget | undefined {
  return CODE_TARGETS.find(t => t.id === id);
}
