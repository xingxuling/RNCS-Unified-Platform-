export function CompressionSafetyNote({ notes }: { notes: string[] }) {
  if (!notes.length) return null;
  return (
    <aside className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs space-y-1">
      <h4 className="uppercase tracking-wider text-amber-600 dark:text-amber-400">安全说明</h4>
      <ul className="space-y-0.5 list-disc list-inside text-amber-700 dark:text-amber-300">
        {notes.map((n, i) => <li key={i}>{n}</li>)}
      </ul>
    </aside>
  );
}
