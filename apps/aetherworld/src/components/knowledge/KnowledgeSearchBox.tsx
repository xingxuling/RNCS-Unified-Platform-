import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function KnowledgeSearchBox({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState("");
  return (
    <div className="flex gap-2">
      <Input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="搜索知识：MSL、蓝天机、Sequence AI、模型生成…"
        onKeyDown={e => { if (e.key === "Enter") onSearch(q); }}
      />
      <Button onClick={() => onSearch(q)}>搜索</Button>
    </div>
  );
}
