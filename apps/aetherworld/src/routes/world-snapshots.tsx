import { createFileRoute } from "@tanstack/react-router";
import { loadSnapshots } from "@/lib/sequence-world/simulation/worldSnapshotEngine";
import { WorldSnapshotPanel } from "@/components/sequence-world/simulation/WorldSnapshotPanel";

export const Route = createFileRoute("/world-snapshots")({
  head: () => ({
    meta: [
      { title: "世界快照 · World Snapshots" },
      { name: "description", content: "查看、对比、回滚和 fork 已保存的世界快照。" },
    ],
  }),
  component: () => {
    const snaps = loadSnapshots();
    return (
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-4">
        <h1 className="font-display text-2xl gold-text">世界快照</h1>
        <p className="text-xs text-muted-foreground">本地存储最近 50 个快照。普通用户只能回滚自己的本地世界；Full60 世界回滚会提示隐私边界。</p>
        <WorldSnapshotPanel snapshots={snaps} />
      </div>
    );
  },
});
