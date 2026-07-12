import { Plus, Send } from "lucide-react";
import { useState } from "react";
import { MOBILE_INPUT_PLACEHOLDER } from "@/constants/multi-device/inputPlacementRules";

export function MobileChatInput({ onSend }: { onSend?: (text: string) => void }) {
  const [value, setValue] = useState("");
  const submit = () => {
    if (!value.trim()) return;
    onSend?.(value.trim());
    setValue("");
  };
  return (
    <div
      className="md:hidden fixed bottom-16 inset-x-0 z-30 border-t border-border/40 bg-background/95 backdrop-blur px-3 py-2"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-full border border-border/40 text-muted-foreground" aria-label="更多">
          <Plus className="w-4 h-4" />
        </button>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={MOBILE_INPUT_PLACEHOLDER}
          className="flex-1 bg-transparent border border-border/40 rounded-full px-3 py-2 text-sm focus:outline-none"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button onClick={submit} className="p-2 rounded-full bg-primary text-primary-foreground" aria-label="发送">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
