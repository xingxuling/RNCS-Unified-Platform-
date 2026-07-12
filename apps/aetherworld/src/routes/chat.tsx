import { createFileRoute } from "@tanstack/react-router";
import { AetherChatShell } from "@/components/chat/AetherChatShell";
import { CoreModelReadinessHint } from "@/components/first-use/CoreModelReadinessHint";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "对话 · Aetherworld" }] }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <CoreModelReadinessHint />
      <AetherChatShell />
    </div>
  );
}
