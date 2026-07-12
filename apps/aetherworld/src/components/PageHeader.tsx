import { ReactNode } from "react";
import { SubjectSwitcher } from "./SubjectSwitcher";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface Props {
  title: string;
  subtitle?: string;
  caption?: string; // 副标题 EN
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, caption, actions, children }: Props) {
  return (
    <div className="px-6 md:px-10 pt-6 pb-4 border-b border-border/60 bg-background/50 backdrop-blur sticky top-0 z-20">
      <div className="flex items-center gap-3 mb-3">
        <SidebarTrigger className="md:hidden" />
        <SubjectSwitcher />
        <div className="ml-auto">{actions}</div>
      </div>
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          {caption && (
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
              {caption}
            </div>
          )}
          <h1 className="font-display text-3xl md:text-4xl gold-text">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
