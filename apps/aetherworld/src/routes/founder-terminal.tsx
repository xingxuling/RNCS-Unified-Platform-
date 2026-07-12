import { createFileRoute } from "@tanstack/react-router";
import { SequenceTerminalPanel } from "@/components/terminal/SequenceTerminalPanel";
import { useFounderState } from "@/hooks/useFounderState";

export const Route = createFileRoute("/founder-terminal")({
  head: () => ({
    meta: [
      { title: "Founder 终端 · Founder Terminal" },
      { name: "description", content: "创始人命令终端：engine.audit / system.audit / knowledge.lock / encyclopedia.write / route.trace。" },
    ],
  }),
  component: FounderTerminalPage,
});

function FounderTerminalPage() {
  const { active } = useFounderState();
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Founder Terminal · 创始人终端</h1>
        <p className="text-sm text-muted-foreground">
          仅在 Founder Mode 下可执行 founder.* / engine.audit / system.audit / knowledge.lock / encyclopedia.write / route.trace 等高权限命令。
        </p>
      </header>
      {!active ? (
        <div className="border border-amber-500/30 rounded-md p-4 bg-black/40 text-sm">
          当前未解锁 Founder Mode。请先前往 <a href="/founder" className="underline text-amber-300">/founder</a> 解锁。
          <div className="mt-3">
            <SequenceTerminalPanel forceMode="SAFE_READONLY_TERMINAL" subtitle="已降级为只读终端：只可运行 help / status / parse / explain / knowledge.search。" />
          </div>
        </div>
      ) : (
        <SequenceTerminalPanel forceMode="FOUNDER_TERMINAL" subtitle="此终端被锁定为 FOUNDER_TERMINAL。" />
      )}
    </div>
  );
}
