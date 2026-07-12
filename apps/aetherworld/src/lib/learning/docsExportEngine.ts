import { listTutorials } from "./tutorialRegistry";
import { listModuleDocs } from "./moduleDocGenerator";
import { listFAQ } from "./faqGenerator";
import { listGlossary } from "./glossaryDocEngine";
import { buildTechnicalManual } from "./technicalManualEngine";
import { getCurrentDocsVersion } from "./docsVersioningEngine";
import { DOCS_SAFETY_FOOTER } from "@/constants/learning/docsSafetyRules";

export type DocsExportTarget =
  | "user_manual"
  | "beginner_tutorials"
  | "creator_guide"
  | "developer_manual"
  | "founder_manual"
  | "module_docs"
  | "faq"
  | "glossary"
  | "release_notes"
  | "full_documentation_pack";

export interface DocsExportPackage {
  filename: string;
  format: "md" | "json" | "bundle";
  content: string | object;
  metadata: {
    docsVersion: string;
    exportedAt: string;
    source: string;
    subjectMode: string;
    constitutionVersion: string;
    constantUniverseVersion: string;
    safetyNotes: string[];
  };
}

function buildMeta(subjectMode = "DEMO"): DocsExportPackage["metadata"] {
  return {
    docsVersion: getCurrentDocsVersion().version,
    exportedAt: new Date().toISOString(),
    source: "Aetherworld Learning Docs Engine",
    subjectMode,
    constitutionVersion: "0.2.0",
    constantUniverseVersion: "0.2.0",
    safetyNotes: [DOCS_SAFETY_FOOTER],
  };
}

function md(title: string, body: string): string {
  return `# ${title}\n\n${body}\n\n---\n${DOCS_SAFETY_FOOTER}\n`;
}

export function exportDocs(target: DocsExportTarget, subjectMode = "DEMO"): DocsExportPackage {
  const meta = buildMeta(subjectMode);
  switch (target) {
    case "user_manual": {
      const body = listTutorials().filter((t) => t.level === "BEGINNER" || t.level === "CREATOR").map((t) => `## ${t.chineseTitle}\n\n${t.steps.map((s, i) => `${i + 1}. ${s.title} — ${s.instruction}`).join("\n")}`).join("\n\n");
      return { filename: "user_manual.md", format: "md", content: md("Aetherworld 用户手册", body), metadata: meta };
    }
    case "beginner_tutorials": {
      const body = listTutorials().filter((t) => t.level === "BEGINNER").map((t) => `## ${t.chineseTitle}\n\n${t.steps.map((s) => `- ${s.title}：${s.instruction}`).join("\n")}`).join("\n\n");
      return { filename: "beginner_tutorials.md", format: "md", content: md("新手教程", body), metadata: meta };
    }
    case "creator_guide": {
      const body = listTutorials().filter((t) => t.level === "CREATOR").map((t) => `## ${t.chineseTitle}`).join("\n");
      return { filename: "creator_guide.md", format: "md", content: md("创作者指南", body), metadata: meta };
    }
    case "developer_manual": {
      const body = buildTechnicalManual().map((s) => `## ${s.title}\n\n${s.content}`).join("\n\n");
      return { filename: "developer_manual.md", format: "md", content: md("开发者手册", body), metadata: meta };
    }
    case "founder_manual": {
      const body = listTutorials().filter((t) => t.level === "FOUNDER").map((t) => `## ${t.chineseTitle}\n\n${t.steps.map((s, i) => `${i + 1}. ${s.instruction}`).join("\n")}`).join("\n\n");
      return { filename: "founder_manual.md", format: "md", content: md("Founder 手册", body), metadata: meta };
    }
    case "module_docs":
      return { filename: "module_docs.json", format: "json", content: { modules: listModuleDocs() }, metadata: meta };
    case "faq": {
      const body = listFAQ().map((f) => `### ${f.question}\n\n${f.answer}`).join("\n\n");
      return { filename: "faq.md", format: "md", content: md("常见问题", body), metadata: meta };
    }
    case "glossary": {
      const body = listGlossary().map((g) => `### ${g.term} / ${g.chineseTerm}\n\n${g.plainDefinition}`).join("\n\n");
      return { filename: "glossary.md", format: "md", content: md("术语表", body), metadata: meta };
    }
    case "release_notes":
      return { filename: "release_notes.md", format: "md", content: md("Release Notes", `当前 docs 版本：${meta.docsVersion}`), metadata: meta };
    case "full_documentation_pack":
    default:
      return {
        filename: "full_documentation_pack.json",
        format: "bundle",
        content: {
          tutorials: listTutorials(),
          modules: listModuleDocs(),
          faq: listFAQ(),
          glossary: listGlossary(),
          technicalManual: buildTechnicalManual(),
        },
        metadata: meta,
      };
  }
}
