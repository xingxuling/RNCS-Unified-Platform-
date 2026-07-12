import { createFileRoute } from "@tanstack/react-router";
import { CoreModelSetupPanel } from "@/components/first-use/CoreModelSetupPanel";
import { useNavigate } from "@tanstack/react-router";

function Page() {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <CoreModelSetupPanel
        onDone={() => navigate({ to: "/chat" })}
        onSkip={() => navigate({ to: "/chat" })}
      />
    </div>
  );
}

export const Route = createFileRoute("/first-use-setup")({
  head: () => ({ meta: [{ title: "首次设置｜Aetherworld" }] }),
  component: Page,
});
