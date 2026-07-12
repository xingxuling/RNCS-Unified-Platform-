import { Link } from "@tanstack/react-router";
import { getArchetype, type PersonalAppProfile } from "@/constants/personalAppProfileSchema";

export function PersonalizedAppPreview({ profile }: { profile: PersonalAppProfile }) {
  const arche = getArchetype(profile.appArchetype);
  return (
    <div className="aether-card-elevated p-5 space-y-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Personalized App Preview · 个人 App 预览</div>
      <div>
        <div className="font-display text-2xl gold-text">{arche?.name ?? "默认 App"}</div>
        <div className="text-xs text-muted-foreground">{arche?.en} · 语言 {profile.preferredLanguageLevel} · 密度 {profile.preferredUIDensity}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">首页推荐</div>
          <ol className="space-y-1.5">
            {profile.topModules.slice(0, 8).map((m, i) => (
              <li key={m}>
                <Link to={m} className="flex items-center gap-2 text-sm px-2.5 py-1.5 rounded border border-border bg-background/40 hover:border-primary/40 transition">
                  <span className="text-[10px] text-muted-foreground w-4">{i + 1}.</span>
                  <span className="flex-1">{m}</span>
                </Link>
              </li>
            ))}
            {profile.topModules.length === 0 && <li className="text-xs text-muted-foreground">尚未识别偏好</li>}
          </ol>
        </div>

        <div className="space-y-3">
          {profile.recommendedShortcuts.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">快捷入口</div>
              <div className="flex flex-wrap gap-1.5">
                {profile.recommendedShortcuts.map(s => (
                  <Link key={s} to={s} className="text-[11px] px-2 py-1 rounded bg-primary/15 text-primary hover:bg-primary/25">{s}</Link>
                ))}
              </div>
            </div>
          )}
          {profile.hiddenModules.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">已折叠模块</div>
              <div className="flex flex-wrap gap-1.5">
                {profile.hiddenModules.map(m => (
                  <span key={m} className="text-[11px] px-2 py-0.5 rounded border border-border text-muted-foreground line-through">{m}</span>
                ))}
              </div>
            </div>
          )}
          <div className="text-[11px] text-muted-foreground">
            世界模式：{profile.worldGenerationMode} · 回验提醒：{profile.feedbackReminderStyle}
          </div>
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground/70 border-t border-border/40 pt-2">
        预览基于本地进化记忆生成。实际侧边栏不会被自动改写 — 任何修改都需先预览与确认。
      </div>
    </div>
  );
}
