import { createFileRoute } from "@tanstack/react-router";
import { CoreModelSetupPanel } from "@/components/first-use/CoreModelSetupPanel";

function Page() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <CoreModelSetupPanel />
    </div>
  );
}

export const Route = createFileRoute("/model-initialization")({
  head: () => ({ meta: [{ title: "模型初始化｜Aetherworld" }] }),
  component: Page,
});
