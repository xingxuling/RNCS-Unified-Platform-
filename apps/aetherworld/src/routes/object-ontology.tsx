import { createFileRoute } from "@tanstack/react-router";
import { ThingItselfPanel } from "@/components/ThingItselfPanel";

export const Route = createFileRoute("/object-ontology")({
  head: () => ({
    meta: [
      { title: "对象本体 · Object Ontology" },
      { name: "description", content: "对象本体读取：本质、边界、不变量、动态变量、关系场、显层/潜层、阶段、自洽度。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Object Ontology</div>
        <h1 className="font-display text-2xl gold-text">对象本体</h1>
      </header>
      <ThingItselfPanel />
    </div>
  ),
});
