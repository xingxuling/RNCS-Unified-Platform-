import { Link } from "@tanstack/react-router";
import { AETHER_STORE_CATEGORIES, type AetherStoreCategoryId } from "@/constants/store/storeCategories";

interface Props { active: AetherStoreCategoryId }

export function StoreCategoryTabs({ active }: Props) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border/40 pb-2 overflow-x-auto">
      {AETHER_STORE_CATEGORIES.map((c) => {
        const isActive = c.id === active;
        const linkProps = c.id === "ALL"
          ? { to: "/store" as const }
          : { to: "/store/category/$category" as const, params: { category: c.id } };
        return (
          <Link
            key={c.id}
            {...linkProps}
            className={`text-xs px-3 py-1.5 rounded transition-colors ${
              isActive
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {c.chineseName}
          </Link>
        );
      })}
    </div>
  );
}
