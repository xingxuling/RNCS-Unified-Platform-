import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/llm-providers/")({
  component: LlmProvidersOverview,
});

function LlmProvidersOverview() {
  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-2">
        <div className="text-sm font-medium">什么是模型提供者</div>
        <p className="text-sm text-muted-foreground">
          模型提供者是 Aetherworld 调用语言模型的统一适配层。对话、WebCodeM、App Runtime、Code Sandbox 等所有需要语言生成的能力，都通过统一的提供者运行时调用模型，并支持自动降级。
        </p>
        <div className="flex gap-2 pt-2">
          <Button asChild size="sm"><Link to="/llm-providers/settings">前往设置</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to="/llm-providers/test">模型测试</Link></Button>
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="text-sm font-medium">推荐</div>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
          <li>推荐使用 8B 以上开源模型，例如 qwen2.5:8b、llama3.1:8b、mistral 等。</li>
          <li>本机 Ollama 默认地址：<code className="px-1 bg-muted rounded">http://localhost:11434</code>。</li>
          <li>本地 OpenAI 兼容接口适配 llama.cpp server、vLLM、LM Studio 等。</li>
          <li>本系统不接入商业 OpenAI / Claude / Gemini 作为默认。</li>
        </ul>
      </Card>
    </div>
  );
}
