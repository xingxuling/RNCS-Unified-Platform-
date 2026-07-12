import { listModuleDocs } from "./moduleDocGenerator";

export interface TechnicalManualSection {
  id: string;
  title: string;
  content: string;
}

export function buildTechnicalManual(): TechnicalManualSection[] {
  const modules = listModuleDocs();
  return [
    { id: "tm_arch", title: "系统架构", content: "Aetherworld = Subject Mode + MSL + Sequence AI + World Engine + Knowledge + Currency + Compression + UI Update + Constitution + Constants Universe + QA + Recalculation。" },
    { id: "tm_deps", title: "模块依赖", content: `共 ${modules.length} 个核心模块，按 Free Input → Sequence AI → World Engine → Presentation 主链路；治理链路：Constitution → Constants → QA → Recalculation。` },
    { id: "tm_routes", title: "路由表", content: modules.filter((m) => m.route).map((m) => `${m.chineseTitle}：${m.route}`).join("\n") },
    { id: "tm_metadata", title: "metadata 规范", content: "所有导出必须包含 subjectMode / constantUniverseVersion / constitutionVersion / safetyNotes / exportedAt / source。" },
    { id: "tm_subject", title: "subjectMode 规范", content: "DEMO | LIGHT20 | FULL60 | FOUNDER；Full60 默认本地。" },
    { id: "tm_constants", title: "constantUniverseVersion 规范", content: "常数版本号随注册中心变更递增。" },
    { id: "tm_export", title: "Export Package 规范", content: "ZIP 或 JSON bundle；带 metadata 与 safetyNotes。" },
    { id: "tm_qa", title: "QA / Recalculation 规范", content: "上游变化标记下游 stale；运行 recalc.all。" },
    { id: "tm_render", title: "Godot / Unity / Three.js 字段", content: "world.export --target godot | unity | three。" },
    { id: "tm_founder", title: "Founder 权限", content: "Founder 拥有宪法修订、常数锁定、全系统审计权限。" },
    { id: "tm_compliance", title: "宪法合规", content: "所有引擎调用前后通过 constitutionalComplianceEngine 检查。" },
    { id: "tm_constant_version", title: "常数版本", content: "见 Constant Universe v0.2。" },
  ];
}
