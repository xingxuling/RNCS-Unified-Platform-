import { createFileRoute } from "@tanstack/react-router";
import { SequenceTerminalPanel } from "@/components/terminal/SequenceTerminalPanel";

export const Route = createFileRoute("/sequence-terminal")({
  head: () => ({
    meta: [
      { title: "数列终端 · Sequence Terminal" },
      { name: "description", content: "用命令行方式直接操作 MSL、Sequence AI、世界引擎、模型生成、剧情、声乐、翻译、知识库、QA 与重算。" },
    ],
  }),
  component: () => (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">数列终端 · Sequence Terminal</h1>
        <p className="text-sm text-muted-foreground">
          Aetherworld 的命令行入口。直接输入数列、MSL 指令、引擎命令、查询命令、导出命令、QA / Recalculation 命令或 Founder 管理命令。
        </p>
      </header>
      <SequenceTerminalPanel />
    </div>
  ),
});
