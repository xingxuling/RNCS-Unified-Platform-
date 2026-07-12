// 真实 WebLLM Runtime 外观层
export {
  loadRealWebLlmModel,
  resetEngine as resetRealWebLlmEngine,
  getRuntimeState as getRealWebLlmRuntimeState,
  subscribeRuntime as subscribeRealWebLlmRuntime,
  setRuntimePartial as setRealWebLlmRuntimePartial,
} from "./realWebLlmEngineManager";
export { detectRealWebLlmAvailability } from "./realWebLlmAvailabilityDetector";
export { requestStop as stopRealWebLlmGeneration } from "./realWebLlmAbortController";
export { runRealWebLlmChat } from "./realWebLlmChatService";
export {
  REAL_WEBLLM_MODELS,
  defaultModelId as defaultRealWebLlmModelId,
  findModel as findRealWebLlmModel,
  modelsByGroup as realWebLlmModelsByGroup,
  GROUP_LABELS as REAL_WEBLLM_GROUP_LABELS,
} from "./realWebLlmModelRegistry";
export {
  listRealWebLlmRuns,
  clearRealWebLlmRuns,
} from "./realWebLlmWorkspaceBridge";
