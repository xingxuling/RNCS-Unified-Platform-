import { Link } from "@tanstack/react-router";
import type { SocialProfile } from "@/lib/social/socialTypes";

export function SocialProfileCard({ profile, isMe = false }: { profile: SocialProfile; isMe?: boolean }) {
  return (
    <div className="border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400/80 to-amber-700/60 flex items-center justify-center text-lg font-bold text-background">
          {profile.displayName.slice(0, 1)}
        </div>
        <div className="flex-1">
          <div className="text-base font-medium">{profile.displayName}</div>
          <div className="text-xs text-muted-foreground">@{profile.handle}</div>
        </div>
        {isMe && (
          <Link to="/social/settings" className="text-xs px-3 py-1 border border-border rounded-md hover:bg-muted">
            编辑资料
          </Link>
        )}
      </div>
      {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        {[
          { k: "作品", v: profile.stats.posts },
          { k: "粉丝", v: profile.stats.followers },
          { k: "关注", v: profile.stats.following },
          { k: "获赞", v: profile.stats.likes },
          { k: "收藏夹", v: profile.stats.collections },
        ].map((s) => (
          <div key={s.k} className="border border-border rounded-md py-2">
            <div className="text-sm font-medium tabular-nums">{s.v}</div>
            <div className="text-[10px] text-muted-foreground">{s.k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
