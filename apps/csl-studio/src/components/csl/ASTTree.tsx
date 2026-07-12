import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface Props {
  data: unknown;
  name?: string;
  defaultOpen?: boolean;
  depth?: number;
}

const TYPE_COLOR: Record<string, string> = {
  Program: 'text-primary',
  ConceptDecl: 'text-token-keyword',
  EntityDecl: 'text-token-string',
  AttributeDecl: 'text-token-identifier',
  RuleDecl: 'text-status-warning',
  FunctionDecl: 'text-accent-foreground',
  IfExpr: 'text-token-operator',
  TemplateDecl: 'text-token-number',
};

export const ASTTree = ({ data, name, defaultOpen = true, depth = 0 }: Props) => {
  const [open, setOpen] = useState(defaultOpen || depth < 2);

  if (data === null || data === undefined) {
    return (
      <div className="font-mono text-xs">
        {name && <span className="text-muted-foreground">{name}: </span>}
        <span className="text-muted-foreground">null</span>
      </div>
    );
  }

  if (typeof data !== 'object') {
    return (
      <div className="font-mono text-xs">
        {name && <span className="text-muted-foreground">{name}: </span>}
        <span className={typeof data === 'string' ? 'text-token-string' : 'text-token-number'}>
          {typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
      </div>
    );
  }

  const isArray = Array.isArray(data);
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(data as Record<string, unknown>);

  if (entries.length === 0) {
    return (
      <div className="font-mono text-xs">
        {name && <span className="text-muted-foreground">{name}: </span>}
        <span className="text-muted-foreground">{isArray ? '[]' : '{}'}</span>
      </div>
    );
  }

  // 节点摘要：显示 type 字段
  const obj = data as Record<string, unknown>;
  const nodeType = !isArray && typeof obj.type === 'string' ? (obj.type as string) : null;
  const nodeName = !isArray && typeof obj.name === 'string' ? (obj.name as string) : null;
  const summary = nodeType
    ? <span className={`font-medium ${TYPE_COLOR[nodeType] || 'text-foreground'}`}>{nodeType}{nodeName ? <span className="text-muted-foreground"> ({nodeName})</span> : null}</span>
    : <span className="text-muted-foreground">{isArray ? `Array(${entries.length})` : `Object(${entries.length})`}</span>;

  return (
    <div className="font-mono text-xs">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 hover:bg-muted/50 rounded px-1 -ml-1 py-0.5 w-full text-left"
      >
        {open ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
        {name && <span className="text-muted-foreground">{name}: </span>}
        {summary}
      </button>
      {open && (
        <div className="ml-4 border-l border-border/40 pl-2 space-y-0.5 mt-0.5">
          {entries.map(([k, v]) => (
            <ASTTree key={k} data={v} name={isArray ? `[${k}]` : k} depth={depth + 1} defaultOpen={false} />
          ))}
        </div>
      )}
    </div>
  );
};
