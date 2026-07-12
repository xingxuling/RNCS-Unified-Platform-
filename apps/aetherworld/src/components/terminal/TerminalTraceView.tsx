interface Props {
  trace?: object;
}

export function TerminalTraceView({ trace }: Props) {
  if (!trace) return null;
  return (
    <details className="border border-purple-500/30 rounded-md p-2 bg-purple-900/10">
      <summary className="text-xs text-purple-200 cursor-pointer">Trace · 引擎调用链</summary>
      <pre className="text-[10px] mt-1 whitespace-pre-wrap break-words text-purple-100/80">
        {JSON.stringify(trace, null, 2)}
      </pre>
    </details>
  );
}
