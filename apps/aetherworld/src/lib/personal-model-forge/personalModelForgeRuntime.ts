// AetherSeed Personal Model Forge · 运行时入口
import type { PersonalModelForgeReport } from "./personalModelForgeTypes";
import { listToolchain } from "./toolchainRegistry";
import { buildLocalForgePlan } from "./localForgePlanner";
import { buildServerForgePlan } from "./serverForgePlanner";
import { buildBloodline } from "./modelBloodlinePlanner";
import {
  buildCivilizationSeedExplanation,
  listCorpusAssets,
  SOLO_TIME_MODEL_NOTES,
} from "./forgeDataFlowPlanner";
import { draftForgeRecord } from "./forgeRecordBridge";

export function runPersonalModelForge(): PersonalModelForgeReport {
  const toolchain = listToolchain();
  const bloodline = buildBloodline();
  const localExperiments = buildLocalForgePlan();
  const serverExperiments = buildServerForgePlan();
  const civilizationSeed = buildCivilizationSeedExplanation();
  const corpusAssets = listCorpusAssets();

  const nextSuggestions = [
    "今晚先跑 LF-TOK-01：训练 AetherSeed Tokenizer v0。",
    "Tokenizer 通过后立即排 LF-10M-01：跑通完整训练管线。",
    "用 Codex 生成训练脚本，用 Cursor 调试，用 WorkBuddy 整理语料。",
    "完成 LF-50M-01 后再考虑是否需要服务器。",
    "服务器训练前完成 SERVER_PREP_CHECKLIST。",
  ];

  const summary =
    "AetherSeed 个人模型铸造工坊：本机为慢速训练炉，服务器为爆发训练炉。" +
    `已登记 ${toolchain.length} 个工具、${bloodline.length} 级血统线、` +
    `${localExperiments.length} 项本机实验、${serverExperiments.length} 项服务器实验。`;

  const report: PersonalModelForgeReport = {
    generatedAt: new Date().toISOString(),
    toolchain,
    bloodline,
    localExperiments,
    serverExperiments,
    soloTimeModelNotes: SOLO_TIME_MODEL_NOTES,
    civilizationSeed,
    corpusAssets,
    nextSuggestions,
    summary,
  };

  draftForgeRecord("FORGE_PLAN_GENERATED", {
    localCount: localExperiments.length,
    serverCount: serverExperiments.length,
  });

  return report;
}
