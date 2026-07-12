import { createFileRoute } from "@tanstack/react-router";
import { HubPage } from "@/components/minimal/HubPage";

export const Route = createFileRoute("/docs")({
  head: () => ({ meta: [{ title: "文档 · Aetherworld" }] }),
  component: () => (
    <HubPage
      caption="Docs"
      title="文档中心"
      subtitle="产品手册、学习路径、术语词典与示例。"
      groups={[
        { id: "main", label: "核心文档", items: [
          { to: "/module-docs",       label: "模块文档" },
          { to: "/technical-manual",  label: "技术手册" },
          { to: "/learn",             label: "学习中心" },
          { to: "/tutorials",         label: "教程" },
        ]},
        { id: "ref", label: "参考", items: [
          { to: "/glossary",                label: "术语" },
          { to: "/terminology-dictionary",  label: "术语词典" },
          { to: "/encyclopedia",            label: "百科" },
          { to: "/faq",                     label: "FAQ" },
        ]},
        { id: "rel", label: "发布 / 路线", items: [
          { to: "/release-notes",     label: "发布说明" },
          { to: "/release-readiness", label: "发布就绪度" },
          { to: "/example-library",   label: "示例库" },
          { to: "/usage-examples",    label: "使用示例" },
        ]},
      ]}
    />
  ),
});
