export interface DigitalRoleWebLlmTask {
  roleId: string;
  taskType: "PRD" | "ARCHITECTURE" | "CODE_DRAFT" | "ERROR_EXPLAIN" | "DOC" | "LYRICS" | "NARRATIVE" | "GENERIC";
  prompt: string;
  outputContract: string[];
  requiresHumanReview: boolean;
}

export function buildDigitalRoleWebLlmTask(roleId: string, taskType: DigitalRoleWebLlmTask["taskType"], prompt: string): DigitalRoleWebLlmTask {
  const high = taskType === "CODE_DRAFT" || taskType === "ERROR_EXPLAIN";
  return {
    roleId,
    taskType,
    prompt,
    outputContract: contractFor(taskType),
    requiresHumanReview: high,
  };
}

function contractFor(t: DigitalRoleWebLlmTask["taskType"]): string[] {
  switch (t) {
    case "PRD": return ["markdown", "structured"];
    case "ARCHITECTURE": return ["markdown", "diagram-text"];
    case "CODE_DRAFT": return ["files"];
    case "ERROR_EXPLAIN": return ["plain", "structured"];
    case "DOC": return ["markdown"];
    case "LYRICS": return ["lyrics"];
    case "NARRATIVE": return ["paragraphs"];
    default: return ["plain"];
  }
}
