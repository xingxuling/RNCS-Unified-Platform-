import { createFileRoute, useParams } from "@tanstack/react-router";
import { StoreItemDetailPanel } from "@/components/store/StoreItemDetailPanel";

export const Route = createFileRoute("/store/item/$id")({
  head: () => ({ meta: [{ title: "商店条目详情 · Aetherworld" }] }),
  component: StoreItemPage,
});

function StoreItemPage() {
  const { id } = useParams({ from: "/store/item/$id" });
  return <StoreItemDetailPanel itemId={id} />;
}
