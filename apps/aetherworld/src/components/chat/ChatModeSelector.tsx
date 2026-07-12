import { Settings2 } from "lucide-react";

export type ChatMode = "AUTO" | "ANSWER_ONLY" | "CREATE_OBJECT" | "RUN_CAPABILITY" | "OPEN_PAGE" | "QA_CHECK" | "FOUNDER";

const MODES: { id: ChatMode; label: string }[] = [
  { id: "AUTO", label: "自动" },
  { id: "ANSWER_ONLY", label: "只回答" },
  { id: "CREATE_OBJECT", label: "创建对象" },
  { id: "RUN_CAPABILITY", label: "调用能力" },
  { id: "OPEN_PAGE", label: "打开页面" },
  { id: "QA_CHECK", label: "QA 检查" },
  { id: "FOUNDER", label: "Founder Mode" },
];

interface Props {
  value: ChatMode;
  onChange: (v: ChatMode) => void;
}

export function ChatModeSelector({ value, onChange }: Props) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ChatMode)}
        className="appearance-none bg-transparent text-[11px] text-muted-foreground hover:text-foreground border border-border/60 hover:border-border rounded-md pl-6 pr-2 py-1 cursor-pointer focus:outline-none"
      >
        {MODES.map((m) => (
          <option key={m.id} value={m.id} className="bg-background">{m.label}</option>
        ))}
      </select>
      <Settings2 className="w-3 h-3 absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}
