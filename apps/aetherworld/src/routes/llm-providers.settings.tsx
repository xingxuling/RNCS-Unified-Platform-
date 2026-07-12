import { createFileRoute } from "@tanstack/react-router";
import { LlmProviderSettingsPanel } from "@/components/llm-providers/LlmProviderSettingsPanel";

export const Route = createFileRoute("/llm-providers/settings")({
  component: () => <LlmProviderSettingsPanel />,
});
