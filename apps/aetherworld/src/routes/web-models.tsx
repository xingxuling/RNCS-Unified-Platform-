import { createFileRoute } from "@tanstack/react-router";
import { HubPage } from "@/components/minimal/HubPage";

export const Route = createFileRoute("/web-models")({
  head: () => ({ meta: [{ title: "Web 模型 · Aetherworld" }] }),
  component: () => (
    <HubPage
      caption="Web Models"
      title="Web 模型"
      subtitle="浏览器本地知识—计算法—常数—概念—语言—世界 六层模型。"
      groups={[
        {
          id: "core",
          label: "核心模型",
          items: [
            { to: "/weblkm-runtime", label: "WebLKM", desc: "本地知识模型" },
            { to: "/webcm-runtime",  label: "WebCM",  desc: "计算法模型" },
            { to: "/webcom-runtime", label: "WebCoM", desc: "常数模型" },
            { to: "/weblcm-runtime", label: "WebLCM", desc: "本地概念模型" },
            { to: "/webllm-runtime", label: "WebLLM", desc: "本地语言模型" },
            { to: "/world-runtime",  label: "WebLWM", desc: "世界运行时" },
          ],
        },
        {
          id: "hub",
          label: "聚合视图",
          items: [
            { to: "/web-knowledge-trinity", label: "知识三体", desc: "WebLKM/WebCM/WebCoM 聚合面板" },
            { to: "/weblcm-concept-graph",  label: "概念图谱" },
            { to: "/webllm-models",         label: "WebLLM 模型库" },
          ],
        },
      ]}
    />
  ),
});
