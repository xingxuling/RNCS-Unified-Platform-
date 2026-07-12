import { createFileRoute } from "@tanstack/react-router";
import { AetherChatShell } from "@/components/chat/AetherChatShell";

export const Route = createFileRoute("/aether-chat")({
  head: () => ({ meta: [{ title: "Aether Chat · Aetherworld" }] }),
  component: () => <AetherChatShell />,
});
