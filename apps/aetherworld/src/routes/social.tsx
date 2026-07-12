import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/social")({
  head: () => ({
    meta: [
      { title: "以太社交 · Aetherworld" },
      { name: "description", content: "Aetherworld 的社交层：发布作品、查看动态、互动与收藏。" },
    ],
  }),
  component: SocialLayout,
});

function SocialLayout() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Outlet />
      </div>
    </div>
  );
}
