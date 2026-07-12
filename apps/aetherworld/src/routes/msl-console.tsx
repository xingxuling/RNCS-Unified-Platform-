import { createFileRoute } from "@tanstack/react-router";
import { MSLConsole } from "@/components/msl/MSLConsole";

export const Route = createFileRoute("/msl-console")({
  head: () => ({
    meta: [
      { title: "MSL Console · 母体数列语言控制台" },
      { name: "description", content: "Mother Sequence Language Console：解析、解释、区块分析、程序运行与多引擎编译。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <MSLConsole mode="founder" />
    </div>
  ),
});
