import { createFileRoute } from "@tanstack/react-router";
import { SocialShell } from "@/components/social/SocialShell";
import { SocialPublishPanel } from "@/components/social/SocialPublishPanel";

export const Route = createFileRoute("/social/publish")({
  component: () => (
    <SocialShell title="发布作品" subtitle="把你的应用、世界、音乐或创作分享出去。默认仅自己可见。">
      <SocialPublishPanel />
    </SocialShell>
  ),
});
