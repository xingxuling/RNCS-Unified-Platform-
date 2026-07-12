import { createFileRoute } from "@tanstack/react-router";
import { ShowcaseGallery } from "@/components/showcase/ShowcaseGallery";

export const Route = createFileRoute("/showcase")({
  head: () => ({
    meta: [
      { title: "示例库 · Aetherworld Showcase" },
      { name: "description", content: "整理自同账号项目群的可参考示例：世界运行时、应用运行时、能力包、对话主体、商店模板。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <ShowcaseGallery />
    </div>
  ),
});
