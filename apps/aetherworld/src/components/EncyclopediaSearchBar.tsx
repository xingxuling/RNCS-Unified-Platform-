import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function EncyclopediaSearchBar({
  value, onChange, placeholder = "搜索：定没定、回验、Full 60、Prompt Forge……",
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 h-11 text-sm bg-card/60 border-border/60"
      />
    </div>
  );
}
