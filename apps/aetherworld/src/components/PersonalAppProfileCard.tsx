import { getArchetype, type PersonalAppProfile } from "@/constants/personalAppProfileSchema";

export function PersonalAppProfileCard({ profile, rationale }: { profile: PersonalAppProfile; rationale?: string[] }) {
  const arche = getArchetype(profile.appArchetype);
  return (
    <div className="aether-card-elevated p-5 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Personal App Profile · 个人 App 配置</div>
      <div>
        <div className="font-display text-xl gold-text">{profile.profileName}</div>
        <div className="text-xs text-muted-foreground">{arche?.name} · {arche?.en}</div>
        <p className="text-xs text-foreground/85 mt-1">{arche?.description}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <Field label="首页布局" value={profile.homeLayout} />
        <Field label="语言层级" value={profile.preferredLanguageLevel} />
        <Field label="UI 密度" value={profile.preferredUIDensity} />
        <Field label="世界模式" value={profile.worldGenerationMode} />
        <Field label="回验提醒" value={profile.feedbackReminderStyle} />
        <Field label="安全等级" value={profile.safetyLevel} />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">推荐首页模块</div>
        <div className="flex flex-wrap gap-1.5">
          {profile.topModules.map(m => (
            <span key={m} className="text-[11px] px-2 py-0.5 rounded border border-border bg-background/40">{m}</span>
          ))}
          {profile.topModules.length === 0 && <span className="text-xs text-muted-foreground">暂无</span>}
        </div>
      </div>

      {profile.hiddenModules.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">已隐藏模块</div>
          <div className="flex flex-wrap gap-1.5">
            {profile.hiddenModules.map(m => (
              <span key={m} className="text-[11px] px-2 py-0.5 rounded border border-border text-muted-foreground line-through">{m}</span>
            ))}
          </div>
        </div>
      )}

      {rationale && rationale.length > 0 && (
        <div className="border-t border-border/40 pt-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">推理</div>
          <ul className="text-[11px] text-muted-foreground space-y-0.5">
            {rationale.map((r, i) => <li key={i}>· {r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="aether-card p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}
