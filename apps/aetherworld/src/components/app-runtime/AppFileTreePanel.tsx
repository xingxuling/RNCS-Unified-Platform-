import type { AppFileTreeObject, AppCodeFile } from "@/lib/app-runtime/appProjectObjectEngine";

interface Props {
  tree: AppFileTreeObject;
  codeFiles: AppCodeFile[];
  activePath?: string;
  onSelect?: (path: string) => void;
}

export function AppFileTreePanel({ tree, codeFiles, activePath, onSelect }: Props) {
  return (
    <div className="border border-border/40 rounded p-2 space-y-1 text-sm">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground px-1">File Tree · {tree.frameworkTarget}</div>
      <ul>
        {tree.files.map(f => {
          const exists = codeFiles.some(c => c.path === f.path);
          const active = activePath === f.path;
          return (
            <li key={f.path}>
              <button
                onClick={() => onSelect?.(f.path)}
                className={`w-full text-left px-2 py-1 rounded text-[12px] font-mono flex justify-between gap-2 ${active ? "bg-primary/20 text-primary" : "hover:bg-muted/40"}`}
              >
                <span className="truncate">{f.path}</span>
                <span className="text-[10px] text-muted-foreground">{exists ? f.fileType : "—"}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
