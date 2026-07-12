/**
 * Sidebar Collapse Toggle
 */
import { ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  expanded: boolean;
  onToggle: () => void;
  label?: string;
}

export function SidebarCollapseToggle({ expanded, onToggle, label }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={label ?? (expanded ? "收起" : "展开")}
      className="inline-flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-foreground transition-colors"
    >
      {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
    </button>
  );
}
