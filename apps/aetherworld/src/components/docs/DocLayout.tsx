// 产品文档 · 左侧锚点导航 + 内容区
import { ReactNode, useEffect, useState } from "react";
import { DOC_SECTIONS } from "@/data/productDocs";
import { ArrowUp } from "lucide-react";

export function DocLayout({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string>(DOC_SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    DOC_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 p-6 md:p-10">
      <aside className="hidden lg:block sticky top-32 self-start max-h-[calc(100vh-10rem)] overflow-y-auto">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">章节导航</div>
        <nav className="space-y-1">
          {DOC_SECTIONS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors border ${
                active === s.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
              }`}
            >
              <div className="font-mono text-[10px] opacity-60">{String(i + 1).padStart(2, "0")}</div>
              <div>{s.cn}</div>
              <div className="text-[10px] opacity-60 tracking-widest">{s.en}</div>
            </button>
          ))}
        </nav>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="mt-4 w-full inline-flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary py-2 border border-border/40 rounded-md"
        >
          <ArrowUp className="w-3 h-3" /> 返回顶部
        </button>
      </aside>

      <main className="max-w-3xl">{children}</main>
    </div>
  );
}
