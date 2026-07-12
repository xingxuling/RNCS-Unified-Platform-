export { lexReality } from './lexer.mjs';
export { parseReality } from './parser.mjs';
export { checkReality } from './type-system.mjs';
export { compileReality, tryCompileReality, RCL_LANGUAGE_VERSION } from './compiler.mjs';
export { runReality } from './runtime.mjs';
export { RCLError, RCLSyntaxError, RCLCompileError, RCLRuntimeError } from './errors.mjs';
export { toRncsProposalInput } from './rncs-bridge.mjs';
export {
  quantity,
  measurement,
  isQuantity,
  isMeasurement,
  runtimeType,
  lowerBound,
  upperBound,
  QUANTITY_TYPES,
} from './quantity.mjs';
export { REALITY_DOMAINS, CROSS_DOMAIN_AXES, COMPOSITE_REALITY_PLANES, META_REALITY_PLANES, foundationSummary } from './foundation.mjs';
export { knowledgeType, isKnowledgeType, knowledgeBaseType, knowledgeClaim, isKnowledge, reviseKnowledge, decayKnowledge } from './knowledge.mjs';
export { buildInnerReality, buildExecutionReality, buildNaturalLanguageReality, buildUnderstandingReality, buildCreativeReality } from './planes.mjs';
export {
  utterance, isUtterance, intent, isIntent,
  understandingType, isUnderstandingType, understandingBaseType, understanding, isUnderstanding,
  creationType, isCreationType, creationBaseType, creationCandidate, selectCreation, isCreation,
  evidenceConfidence,
} from './cognition.mjs';

export { spacetimePoint, isSpacetimePoint, spacetimeDistance, buildSpacetimeReality, buildAccelerationReality, buildCompressionReality } from './meta-planes.mjs';
export {
  FINAL_FOUNDATION_TYPES,
  scienceType, isScienceType, scienceBaseType,
  elementEntity, isElementEntity,
  scientificClaim, isScientificClaim,
  experimentResult, isExperimentResult,
  bodyState, isBodyState,
  spiritState, isSpiritState,
} from './final-foundation.mjs';

export {
  RCL_BYTECODE_VERSION, RCL_BYTECODE_MAGIC, OPCODES, BUILTINS,
  compileRealityToBytecode, tryCompileRealityToBytecode, decodeBytecode, assembleLiteralProgram, assembleAstProgram, assembleIrProgram,
} from './bytecode.mjs';
export { DEFAULT_NATIVE_VM_PATH, RCLNativeVMError, runNativeBytecode, runRealityNative, verifyNativeParity } from './native-vm.mjs';
export { DEFAULT_COMPILER_SEED_PATH, DEFAULT_COMPILER_STAGE2_PATH, DEFAULT_COMPILER_STAGE3_PATH, DEFAULT_COMPILER_STAGE4_PATH, DEFAULT_COMPILER_STAGE5_PATH, bootstrapCompilerSeed, bootstrapCompilerStage2, bootstrapCompilerStage3, bootstrapCompilerStage4, bootstrapCompilerStage5 } from './bootstrap.mjs';
export { span, token, facetAst, parseState, symbolValue, semanticFacet, irStore, isSpan, isToken, isAstNode, isParseState, isSymbolValue, isSemanticNode, isIrNode } from './compiler-primitives.mjs';

export { EmbeddedNativeVm, DEFAULT_NATIVE_DAEMON_PATH } from './embedded-vm.mjs';
