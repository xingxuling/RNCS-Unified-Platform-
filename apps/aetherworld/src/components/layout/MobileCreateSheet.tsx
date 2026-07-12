import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AETHER_CREATE_ACTIONS } from "@/config/aetherNavigationDomains";
import { Plus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function MobileCreateSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-border/40 max-h-[80vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-base">创建</SheetTitle>
          <p className="text-xs text-muted-foreground">选择要创建的内容类型</p>
        </SheetHeader>
        <ul className="mt-3 grid grid-cols-1 gap-2 pb-4">
          {AETHER_CREATE_ACTIONS.map((a) => (
            <li key={a.id}>
              <Link
                to={a.to}
                onClick={() => onOpenChange(false)}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/40 hover:bg-card/70"
              >
                <span className="w-9 h-9 rounded-md bg-primary/15 text-primary flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{a.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{a.description}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
