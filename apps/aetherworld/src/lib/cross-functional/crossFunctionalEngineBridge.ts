import { CROSS_FUNCTIONAL_ENGINE_PAIRS, type EnginePairDef } from "@/constants/cross-functional/crossFunctionalEnginePairs";

export interface CrossFunctionalEngineBridge {
  bridgeId: string;
  sourceEngine: string;
  targetEngine: string;
  bridgeType: string;
  inputAdapter: string;
  outputAdapter: string;
  requiredVariables: string[];
  optionalVariables: string[];
  safetyRules: string[];
}

const BRIDGE_DETAILS: Record<string, Partial<CrossFunctionalEngineBridge>> = {
  "narr-to-vocal": { inputAdapter:"narrative.scene → vocal.theme", outputAdapter:"vocal.aiPrompt", requiredVariables:["storySummary","emotionalTone","characters"], optionalVariables:["worldContext"], safetyRules:["不把虚构剧情写成现实","保留人物边界"] },
  "vocal-to-translation": { inputAdapter:"vocal.lyrics", outputAdapter:"translation.lyricTranslation", requiredVariables:["lyrics","sourceLanguage","targetLanguage"], optionalVariables:["emotionCurve"], safetyRules:["保留原始语气","不翻错专有词"] },
  "vocal-to-prompt": { inputAdapter:"vocal.profile+style", outputAdapter:"promptForge.musicPrompt", requiredVariables:["genre","emotion","vocalStyle"], optionalVariables:["language"], safetyRules:["平台合规","不混淆 Demo / Real"] },
  "world-to-narr": { inputAdapter:"world.context → narrative.input", outputAdapter:"narrative.scene", requiredVariables:["worldName","conflictStructure"], optionalVariables:["aestheticStyle"], safetyRules:["不把虚拟世界写成现实预测"] },
  "world-to-vocal": { inputAdapter:"world.aesthetic → vocal.style", outputAdapter:"vocal.themeSong", requiredVariables:["worldName","aestheticStyle"], optionalVariables:["civilizationPhase"], safetyRules:["音乐氛围与世界正典一致"] },
  "world-to-model": { inputAdapter:"world.entities → model.prompt", outputAdapter:"model.characterModel|sceneModel", requiredVariables:["worldName","entityList"], optionalVariables:[], safetyRules:["不外泄 Founder-only 设定"] },
  "model-to-code": { inputAdapter:"model.structure → code.task", outputAdapter:"code.modules", requiredVariables:["modelName","inputs","outputs"], optionalVariables:["dependencies"], safetyRules:["不删除现有功能"] },
  "product-to-docs": { inputAdapter:"product.entry → docs.template", outputAdapter:"learningDocs.tutorial", requiredVariables:["productName","userType","painPoint"], optionalVariables:["valueProposition"], safetyRules:["不夸大功能","不承诺确定收益"] },
  "vocab-to-docs": { inputAdapter:"vocab.entry → docs.beginner", outputAdapter:"learningDocs.glossaryDoc", requiredVariables:["term","definition"], optionalVariables:["relations"], safetyRules:["不把虚构词写成现实事实"] },
  "ai-to-cross": { inputAdapter:"sequenceAI.intent → cross.workflow", outputAdapter:"cross.plan", requiredVariables:["userText"], optionalVariables:[], safetyRules:["遵守宪法","保留主体边界"] },
  "terminal-to-cross": { inputAdapter:"terminal.command → cross.run", outputAdapter:"cross.output", requiredVariables:["command"], optionalVariables:["flags"], safetyRules:["权限分级"] },
  "reality-to-decision": { inputAdapter:"realityData.calibrated → decision.input", outputAdapter:"decision.analysis", requiredVariables:["source","content","credibility"], optionalVariables:[], safetyRules:["不把外部数据当主体数列","不绝对化"] },
  "calculus-to-usage": { inputAdapter:"calculus.entry → usageExamples.template", outputAdapter:"usageExamples.examples", requiredVariables:["calculusName","inputs","outputs"], optionalVariables:[], safetyRules:["示例不暗示现实保证"] },
  "workspace-to-any": { inputAdapter:"workspace.object → any.input", outputAdapter:"any.output", requiredVariables:["objectId"], optionalVariables:[], safetyRules:["保留 privacyLevel","Founder-only 不外泄"] },
};

export function listEngineBridges(): CrossFunctionalEngineBridge[] {
  return CROSS_FUNCTIONAL_ENGINE_PAIRS.map((p) => buildBridge(p));
}

function buildBridge(p: EnginePairDef): CrossFunctionalEngineBridge {
  const d = BRIDGE_DETAILS[p.id] ?? {};
  return {
    bridgeId: p.id,
    sourceEngine: p.sourceEngine,
    targetEngine: p.targetEngine,
    bridgeType: p.bridgeType,
    inputAdapter: d.inputAdapter ?? `${p.sourceEngine}.output → ${p.targetEngine}.input`,
    outputAdapter: d.outputAdapter ?? `${p.targetEngine}.result`,
    requiredVariables: d.requiredVariables ?? [],
    optionalVariables: d.optionalVariables ?? [],
    safetyRules: d.safetyRules ?? [],
  };
}

export function findBridges(source: string, target?: string): CrossFunctionalEngineBridge[] {
  return listEngineBridges().filter(
    (b) => b.sourceEngine === source && (!target || b.targetEngine === target || b.targetEngine === "*"),
  );
}
