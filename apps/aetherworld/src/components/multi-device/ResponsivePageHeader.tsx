export function ResponsivePageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 border-b border-border/40">
      <div className="min-w-0 flex-1">
        <h1 className="text-base md:text-lg font-display truncate">{title}</h1>
        {subtitle && (
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate">{subtitle}</div>
        )}
      </div>
      {action}
    </header>
  );
}
