import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SocialShell } from "@/components/social/SocialShell";
import { ensureProfile, getCurrentUserId, updateProfile } from "@/lib/social/socialProfileEngine";
import { isPublicFeedEnabled, setPublicFeedEnabled } from "@/lib/social/socialFeedEngine";
import { useFounderState } from "@/hooks/useFounderState";
import { toast } from "sonner";

export const Route = createFileRoute("/social/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const userId = getCurrentUserId();
  const profile = ensureProfile(userId);
  const founder = useFounderState();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio || "");
  const [publicFeed, setPublicFeed] = useState(isPublicFeedEnabled());

  const save = () => {
    updateProfile(userId, { displayName: displayName.trim() || "未命名旅人", handle: handle.trim() || userId.slice(-6), bio });
    toast.success("资料已保存");
  };

  return (
    <SocialShell title="社交设置" subtitle="管理你的资料与内测开关。">
      <div className="space-y-6">
        <section className="space-y-3 border border-border rounded-lg p-4">
          <h2 className="text-sm font-medium">个人资料</h2>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">昵称</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Handle</label>
            <input value={handle} onChange={(e) => setHandle(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">简介</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm resize-y" />
          </div>
          <button onClick={save} className="px-4 h-9 text-sm bg-foreground text-background rounded-md hover:opacity-90">
            保存
          </button>
        </section>

        <section className="space-y-3 border border-border rounded-lg p-4">
          <h2 className="text-sm font-medium">内测开关</h2>
          <label className="flex items-center justify-between text-sm">
            <div>
              <div>开启公共动态</div>
              <div className="text-xs text-muted-foreground">关闭后，所有公开作品不会出现在动态广场。</div>
            </div>
            <input
              type="checkbox"
              checked={publicFeed}
              disabled={!founder.active}
              onChange={(e) => { setPublicFeed(e.target.checked); setPublicFeedEnabled(e.target.checked); toast.success("已更新"); }}
            />
          </label>
          {!founder.active && (
            <p className="text-[11px] text-muted-foreground">仅 Founder 可调整公共动态开关。</p>
          )}
        </section>
      </div>
    </SocialShell>
  );
}
