import type { WebCmRoute } from "../webKnowledgeTrinityTypes";
export interface ExecutionPlan {
  routeId: string;
  totalSteps: number;
  estimatedMillis: number;
  notes: string[];
}
export function planExecution(route: WebCmRoute): ExecutionPlan {
  return {
    routeId: route.routeId,
    totalSteps: route.executionSteps.length,
    estimatedMillis: route.executionSteps.length * 120,
    notes: route.qaRequired ? ["执行后必须经 QA"] : [],
  };
}
