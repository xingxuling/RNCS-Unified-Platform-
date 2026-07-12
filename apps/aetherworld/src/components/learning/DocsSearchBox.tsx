import { useState } from "react";
import { searchAll } from "@/lib/learning/learningDocsEngine";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";

export function DocsSearchBox() {
  const [q, setQ] = useState("");
  const res = q.trim() ? searchAll(q) : null;
  return (
    <div className="space-y-2">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索教程 / 模块 / FAQ / 术语..." />
      {res && (
        <div className="rounded-md border border-border p-3 text-sm space-y-2 max-h-72 overflow-auto">
          {res.tutorials.length > 0 && <Section title="教程">{res.tutorials.map((t) => <Link key={t.tutorialId} to="/tutorials" className="block text-primary hover:underline">{t.chineseTitle}</Link>)}</Section>}
          {res.modules.length > 0 && <Section title="模块">{res.modules.map((m) => <Link key={m.moduleId} to="/module-docs" className="block text-primary hover:underline">{m.chineseTitle}</Link>)}</Section>}
          {res.faq.length > 0 && <Section title="FAQ">{res.faq.map((f) => <Link key={f.id} to="/faq" className="block text-primary hover:underline">{f.question}</Link>)}</Section>}
          {res.glossary.length > 0 && <Section title="术语">{res.glossary.map((g) => <Link key={g.termId} to="/glossary" className="block text-primary hover:underline">{g.term} / {g.chineseTerm}</Link>)}</Section>}
          {res.tutorials.length + res.modules.length + res.faq.length + res.glossary.length === 0 && <div className="text-muted-foreground">没有结果。</div>}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
