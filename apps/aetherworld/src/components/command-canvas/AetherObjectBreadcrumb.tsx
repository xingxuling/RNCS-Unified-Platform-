interface Props { objectTitle?: string; objectType?: string; runStatus?: string; }

export function AetherObjectBreadcrumb({ objectTitle, objectType, runStatus }: Props) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span>Workspace</span>
      <span>/</span>
      <span className="text-foreground">{objectType ?? "GENERIC_OBJECT"}</span>
      {objectTitle && (
        <>
          <span>/</span>
          <span className="text-foreground/80">{objectTitle}</span>
        </>
      )}
      {runStatus && (
        <span className="ml-2 rounded-full border border-border/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
          {runStatus}
        </span>
      )}
    </div>
  );
}
