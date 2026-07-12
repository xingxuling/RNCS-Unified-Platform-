import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/chat/chatMessageEngine";
import { ChatMessageBubble } from "./ChatMessageBubble";

interface Props {
  messages: ChatMessage[];
  onAction?: (route?: string) => void;
}

export function ChatMessageList({ messages, onAction }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {messages.map((m) => (
          <ChatMessageBubble key={m.id} message={m} onAction={onAction} />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
