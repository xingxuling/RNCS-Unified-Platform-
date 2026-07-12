import { createFileRoute } from "@tanstack/react-router";
import { FreeInputPanel } from "@/components/free-input/FreeInputPanel";

export const Route = createFileRoute("/free-input")({
  head: () => ({
    meta: [
      { title: "自由输入 · Free Input" },
      { name: "description", content: "不用选模块，直接说你想分析、生成、翻译、创作、开发、检查什么。" },
    ],
  }),
  component: () => (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">自由输入 · Free Input</h1>
        <p className="text-sm text-muted-foreground">
          不用选模块，直接把你想分析、生成、翻译、创作、开发、检查的内容写下来。系统会自动判断意图、拆分任务并路由到合适的引擎。
        </p>
      </header>
      <FreeInputPanel />
    </div>
  ),
});
