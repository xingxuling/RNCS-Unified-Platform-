import { createFileRoute } from "@tanstack/react-router";
import { MSLConsole } from "@/components/msl/MSLConsole";

export const Route = createFileRoute("/sequence-language")({
  head: () => ({
    meta: [
      { title: "数列解释器 · Sequence Language" },
      { name: "description", content: "数列解释器：输入 5 位数列，看清它代表的世界状态与行动倾向。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8 space-y-3">
      <div className="text-xs text-muted-foreground">
        新手提示：每条 5 位数 ABCDE 分别代表 天·地·人·神·风。例如输入 <span className="font-mono">55555</span> 看看会发生什么。
      </div>
      <MSLConsole mode="beginner" />
    </div>
  ),
});
