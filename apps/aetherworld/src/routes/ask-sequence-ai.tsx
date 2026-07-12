import { createFileRoute } from "@tanstack/react-router";
import { SequenceAIChat } from "@/components/sequence-ai/SequenceAIChat";

export const Route = createFileRoute("/ask-sequence-ai")({
  head: () => ({
    meta: [
      { title: "问数列 AI · Ask Sequence AI" },
      { name: "description", content: "把你想分析、生成、判断、创作、翻译、写歌、写剧情、做模型的需求说出来，系统会自动选择合适引擎。" },
    ],
  }),
  component: () => (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">问数列 AI</h1>
        <p className="text-sm text-muted-foreground">
          不需要点哪个模块——告诉它你想做什么，它会判断意图、调用合适的引擎，给你一个结构化、可执行、可验证的答案。
        </p>
      </header>
      <SequenceAIChat />
    </div>
  ),
});
