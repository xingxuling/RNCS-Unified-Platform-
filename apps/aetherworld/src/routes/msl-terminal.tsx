import { createFileRoute } from "@tanstack/react-router";
import { SequenceTerminalPanel } from "@/components/terminal/SequenceTerminalPanel";

export const Route = createFileRoute("/msl-terminal")({
  head: () => ({
    meta: [
      { title: "MSL 终端 · MSL Terminal" },
      { name: "description", content: "聚焦母体数列语言：parse / explain / block / run / compile。" },
    ],
  }),
  component: () => (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">MSL 终端 · MSL Terminal</h1>
        <p className="text-sm text-muted-foreground">
          仅运行母体数列语言相关命令：parse / explain / block / run / compile。直接输入纯五位数列将自动 explain。
        </p>
      </header>
      <SequenceTerminalPanel forceMode="MSL_TERMINAL" subtitle="此终端被锁定为 MSL_TERMINAL 模式。" />
    </div>
  ),
});
