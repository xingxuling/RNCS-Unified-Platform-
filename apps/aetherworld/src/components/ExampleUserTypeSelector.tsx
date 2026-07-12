import { EXAMPLE_USER_TYPES } from "@/constants/exampleUserTypes";

export function ExampleUserTypeSelector({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (id: string | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(undefined)}
        className={`text-xs px-3 py-1.5 rounded-full border transition ${
          !value ? "border-primary/60 bg-primary/10 text-primary" : "border-border/60 hover:border-primary/40"
        }`}
      >
        全部
      </button>
      {EXAMPLE_USER_TYPES.map((u) => (
        <button
          key={u.id}
          onClick={() => onChange(u.id)}
          className={`text-xs px-3 py-1.5 rounded-full border transition ${
            value === u.id ? "border-primary/60 bg-primary/10 text-primary" : "border-border/60 hover:border-primary/40"
          }`}
        >
          {u.userFriendlyName}
        </button>
      ))}
    </div>
  );
}
