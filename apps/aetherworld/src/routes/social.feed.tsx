import { createFileRoute } from "@tanstack/react-router";
import { SocialShell } from "@/components/social/SocialShell";
import { SocialFeed } from "@/components/social/SocialFeed";

export const Route = createFileRoute("/social/feed")({
  component: () => (
    <SocialShell title="动态" subtitle="查看公开作品、能力、世界、应用和创作。">
      <SocialFeed />
    </SocialShell>
  ),
});
