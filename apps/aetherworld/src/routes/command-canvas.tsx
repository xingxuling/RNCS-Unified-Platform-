import { createFileRoute } from "@tanstack/react-router";
import { AetherCommandCanvasShell } from "@/components/command-canvas/AetherCommandCanvasShell";

export const Route = createFileRoute("/command-canvas")({
  head: () => ({
    meta: [
      { title: "Command Canvas · 以太指挥画布" },
      { name: "description", content: "Aether Command Canvas UI v0.8：统一命令、画布、检查器、运行与能力坞的中枢工作台。" },
    ],
  }),
  component: () => <AetherCommandCanvasShell />,
});
