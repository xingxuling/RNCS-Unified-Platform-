import type { ChatSuggestedAction } from "@/lib/chat/chatMessageEngine";

interface Props {
  actions: ChatSuggestedAction[];
  onAction?: (route?: string) => void;
}

export function ChatSuggestedActions({ actions, onAction }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={() => onAction?.(a.route)}
          className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
