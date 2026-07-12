export interface MissingAbstractionResult {
  missingAbstractionId: string;
  detected: boolean;
  sourceProblem: string;
  affectedModules: string[];
  suggestedLayer: string;
  reason: string;
  systemMultiplierScore: number;
  shouldCreateNewModule: boolean;
  shouldReuseExistingModule: boolean;
  shouldImproveExistingModule: boolean;
}

export function detectMissingAbstraction(sourceProblem: string, affectedModules: string[]): MissingAbstractionResult {
  const n = affectedModules.length;
  let suggestedLayer = "UI";
  let reason = "影响范围较小，优先修单模块";
  let shouldCreateNewModule = false;
  let shouldImproveExistingModule = true;
  let shouldReuseExistingModule = false;
  let systemMultiplierScore = 20;

  if (n >= 4) {
    suggestedLayer = "CALCULUS / NEW_LAYER";
    reason = "影响 4+ 模块，建议抽象成新层";
    shouldCreateNewModule = true;
    shouldImproveExistingModule = false;
    systemMultiplierScore = 85;
  } else if (n >= 2) {
    suggestedLayer = "CROSS_FUNCTIONAL / WORKSPACE / QA";
    reason = "影响 2-3 模块，优先桥接或共享治理";
    shouldReuseExistingModule = true;
    systemMultiplierScore = 55;
  }

  if (/对象|object|复用|reuse/i.test(sourceProblem)) suggestedLayer = "OBJECT_LAYER";
  if (/执行|runtime|流程断/i.test(sourceProblem)) suggestedLayer = "RUNTIME_LAYER";
  if (/看不懂|术语|概念/i.test(sourceProblem)) suggestedLayer = "DOCUMENTATION_LAYER";
  if (/扩张|过多|失控/i.test(sourceProblem)) suggestedLayer = "LIFECYCLE_LAYER";

  return {
    missingAbstractionId: `abs-${Date.now()}`,
    detected: n > 0,
    sourceProblem,
    affectedModules,
    suggestedLayer,
    reason,
    systemMultiplierScore,
    shouldCreateNewModule,
    shouldReuseExistingModule,
    shouldImproveExistingModule,
  };
}
