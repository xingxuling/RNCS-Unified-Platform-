import { scanSystemCapabilities } from "./systemCapabilityScanner";

export interface UserUnderstandingGapResult {
  understandingGapScore: number;
  unclearTerms: string[];
  missingGlossaryEntries: string[];
  missingTutorials: string[];
  missingExamples: string[];
  confusingRoutes: string[];
  recommendedDocs: string[];
}

export function detectUserUnderstandingGaps(): UserUnderstandingGapResult {
  const cap = scanSystemCapabilities();
  const missingDocs = cap.capabilities.filter(c => c.documentationStatus !== "ACTIVE").map(c => c.moduleId);
  const score = Math.min(100, cap.totalCapabilities * 2 + missingDocs.length * 4);
  return {
    understandingGapScore: score,
    unclearTerms: [],
    missingGlossaryEntries: [],
    missingTutorials: missingDocs.map(m => `${m} 教程`),
    missingExamples: missingDocs.map(m => `${m} 使用示例`),
    confusingRoutes: [],
    recommendedDocs: missingDocs.map(m => `为 ${m} 补 Quick Start 与 Usage Example`),
  };
}
