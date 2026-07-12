import { createFileRoute } from "@tanstack/react-router";
import { LlmProviderTestPanel } from "@/components/llm-providers/LlmProviderTestPanel";

export const Route = createFileRoute("/llm-providers/test")({
  component: () => <LlmProviderTestPanel />,
});
