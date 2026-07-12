/**
 * Sidebar Parent Item — 父级分组标题 + 展开/收起箭头
 */
import { SidebarCollapseToggle } from "./SidebarCollapseToggle";

interface Props {
  title: string;
  chineseTitle: string;
  expanded: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export function SidebarParentItem({ title, chineseTitle, expanded, onToggle, icon, badge }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent/40 transition-colors group"
    >
      {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      <span className="flex-1 text-left leading-tight">
        <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground group-hover:text-foreground">
          {title}
        </span>
        <span className="block text-[10px] text-muted-foreground/70">{chineseTitle}</span>
      </span>
      {badge}
      <SidebarCollapseToggle expanded={expanded} onToggle={onToggle} />
    </button>
  );
}
