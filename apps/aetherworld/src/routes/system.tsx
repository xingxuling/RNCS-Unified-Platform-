import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/system")({
  head: () => ({ meta: [{ title: "系统 · Aetherworld" }] }),
  component: () => <Outlet />,
});
