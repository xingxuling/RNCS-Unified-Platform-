import type { AppCodeFile } from "@/lib/app-runtime/appProjectObjectEngine";

export function AppCodeViewer({ file }: { file?: AppCodeFile }) {
  if (!file) return <div className="border border-border/40 rounded p-3 text-sm text-muted-foreground">请选择左侧文件查看代码</div>;
  return (
    <div className="border border-border/40 rounded overflow-hidden">
      <div className="px-3 py-1.5 bg-muted/30 text-[11px] font-mono flex justify-between">
        <span>{file.path}</span>
        <span className="text-muted-foreground">{file.language}</span>
      </div>
      <pre className="text-[11px] font-mono p-3 overflow-auto max-h-[480px] whitespace-pre-wrap">{file.content}</pre>
    </div>
  );
}
