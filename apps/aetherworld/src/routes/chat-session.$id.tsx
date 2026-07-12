import { createFileRoute } from "@tanstack/react-router";
import { AetherChatShell } from "@/components/chat/AetherChatShell";

export const Route = createFileRoute("/chat-session/$id")({
  head: () => ({ meta: [{ title: "对话会话 · Aetherworld" }] }),
  component: ChatSessionPage,
});

function ChatSessionPage() {
  const { id } = Route.useParams();
  return <AetherChatShell sessionId={id} />;
}
