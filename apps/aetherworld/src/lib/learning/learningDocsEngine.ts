import { listTutorials, searchTutorials } from "./tutorialRegistry";
import { listModuleDocs, searchModuleDocs } from "./moduleDocGenerator";
import { listFAQ, searchFAQ } from "./faqGenerator";
import { listGlossary, searchGlossary } from "./glossaryDocEngine";
import { listPaths, recommendPaths } from "./tutorialPathEngine";
import { runDocsAudit } from "./docsAuditEngine";
import { getCurrentDocsVersion, getStaleReasons } from "./docsVersioningEngine";
import type { UserLearningLevel } from "@/constants/learning/userLearningLevels";

export function getLearningSummary() {
  const audit = runDocsAudit();
  return {
    docsVersion: getCurrentDocsVersion().version,
    totalTutorials: listTutorials().length,
    totalModuleDocs: listModuleDocs().length,
    totalFAQ: listFAQ().length,
    totalGlossary: listGlossary().length,
    totalPaths: listPaths().length,
    auditStatus: audit.status,
    missingDocsCount: audit.missingDocs.length,
    staleDocsCount: audit.staleDocs.length,
    issuesCount: audit.issues.length,
    staleReasons: getStaleReasons(),
  };
}

export function learningDocsMeta() {
  return {
    source: "Aetherworld Learning Docs Engine",
    docsVersion: getCurrentDocsVersion().version,
    generatedAt: new Date().toISOString(),
  };
}

export function recommendForUser(level: UserLearningLevel) {
  return {
    paths: recommendPaths(level),
    tutorials: listTutorials().filter((t) => t.level === level).slice(0, 5),
  };
}

export function searchAll(query: string) {
  return {
    tutorials: searchTutorials(query),
    modules: searchModuleDocs(query),
    faq: searchFAQ(query),
    glossary: searchGlossary(query),
  };
}
