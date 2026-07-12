import type { AppFileTreeObject, AppArchitectureObject, AppFileNode } from "./appProjectObjectEngine";
import { APP_FILE_TEMPLATES } from "@/constants/app-runtime/appFileTemplates";

export function generateAppFileTree(projectId: string, arch: AppArchitectureObject, includeHandoff = true): AppFileTreeObject {
  const baseTemplate = APP_FILE_TEMPLATES[arch.frameworkTarget] || [];
  const handoffTemplate = includeHandoff ? APP_FILE_TEMPLATES.HANDOFF_ONLY : [];
  const files: AppFileNode[] = [...baseTemplate, ...handoffTemplate].map(t => ({ ...t }));
  return {
    fileTreeId: `tree-${projectId}`,
    projectId,
    frameworkTarget: arch.frameworkTarget,
    files,
  };
}
