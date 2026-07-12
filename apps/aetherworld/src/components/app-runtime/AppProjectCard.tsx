import type { AppProjectObject } from "@/lib/app-runtime/appProjectObjectEngine";
import { APP_TYPE_LABELS } from "@/constants/app-runtime/appTypes";

export function AppProjectCard({ project, onOpen }: { project: AppProjectObject; onOpen?: () => void }) {
  return (
    <div className="border border-border/40 rounded p-3 space-y-1 hover:bg-muted/30 cursor-pointer" onClick={onOpen}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{project.projectName}</div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{APP_TYPE_LABELS[project.appType]?.en || project.appType}</span>
      </div>
      <div className="text-[11px] text-muted-foreground line-clamp-2">{project.intentSummary}</div>
      <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground pt-1">
        <span>files {project.codeFiles.length}</span>
        <span>mode {project.appRuntimeMode}</span>
        <span>status {project.status}</span>
        {project.qaResult && <span>qa {project.qaResult.status}</span>}
      </div>
    </div>
  );
}
