interface Props {
  status: "PASS" | "WARN" | "BLOCK";
}
export function ChatQaStatusBadge({ status }: Props) {
  const color =
    status === "BLOCK" ? "bg-rose-500/20 text-rose-200 border-rose-500/40"
    : status === "WARN" ? "bg-amber-500/20 text-amber-200 border-amber-500/40"
    : "bg-emerald-500/15 text-emerald-200 border-emerald-500/40";
  const label = status === "BLOCK" ? "BLOCK" : status === "WARN" ? "WARN" : "PASS";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${color}`}>QA {label}</span>
  );
}
