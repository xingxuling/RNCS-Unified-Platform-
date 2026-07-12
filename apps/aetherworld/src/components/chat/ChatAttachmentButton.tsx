import { Paperclip } from "lucide-react";
export function ChatAttachmentButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="p-1.5 text-muted-foreground hover:text-foreground" title="附件">
      <Paperclip className="w-4 h-4" />
    </button>
  );
}
