import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/store")({
  head: () => ({ meta: [{ title: "以太商店 · Aetherworld" }] }),
  component: StoreLayout,
});

function StoreLayout() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Outlet />
      </div>
    </div>
  );
}
