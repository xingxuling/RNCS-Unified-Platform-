import { createFileRoute, Link } from "@tanstack/react-router";
import { VirtualLifeJournal } from "@/components/VirtualLifeJournal";
import { VirtualLifeSafetyNote } from "@/components/VirtualLifeSafetyNote";

export const Route = createFileRoute("/virtual-journal")({
  head: () => ({
    meta: [
      { title: "虚拟生活日记 · Virtual Life Journal" },
      { name: "description", content: "保存、查看、导出你的虚拟生活日记。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Virtual Life Journal · 虚拟生活日记</div>
        <h1 className="text-2xl font-display gold-text">日记</h1>
        <p className="text-sm text-muted-foreground">本地保存。日记仅用于个人理解，不代表对现实的预测。</p>
      </header>
      <VirtualLifeSafetyNote />
      <div className="text-xs text-muted-foreground">
        想保存新日记？前往 <Link to="/virtual-life" className="text-primary hover:underline">虚拟生活</Link>。
      </div>
      <VirtualLifeJournal />
    </div>
  ),
});
