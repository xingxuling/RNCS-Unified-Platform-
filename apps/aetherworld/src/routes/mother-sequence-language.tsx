import { createFileRoute } from "@tanstack/react-router";
import { MSLConsole } from "@/components/msl/MSLConsole";

export const Route = createFileRoute("/mother-sequence-language")({
  head: () => ({
    meta: [
      { title: "母体数列语言 · Mother Sequence Language" },
      { name: "description", content: "MSL：以五位数列为最小语句的状态驱动语言，可编译到 World Engine / IAL / Prompt / Unity / Godot。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <MSLConsole mode="advanced" />
    </div>
  ),
});
