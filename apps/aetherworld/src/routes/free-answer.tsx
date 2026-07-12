import { createFileRoute } from "@tanstack/react-router";
import { FreeInputPanel } from "@/components/free-input/FreeInputPanel";

export const Route = createFileRoute("/free-answer")({
  head: () => ({
    meta: [
      { title: "自由解答 · Free Answer" },
      { name: "description", content: "面向真实用户的自由解答入口：自然语言输入，结构化、可执行、可验证的解答。" },
    ],
  }),
  component: () => (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">随便问 · 自由解答</h1>
        <p className="text-sm text-muted-foreground">
          自然语言输入，自动路由到 Sequence AI / Omni / MSL / 模型 / 剧情 / 声乐 / 翻译 / 代码 / QA 等引擎，并给出可执行结果。
        </p>
      </header>
      <FreeInputPanel />
    </div>
  ),
});
