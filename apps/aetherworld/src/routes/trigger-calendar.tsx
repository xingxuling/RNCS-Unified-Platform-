import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/trigger-calendar")({
  head: () => ({ meta: [{ title: "触发日历 · Aetherworld" }] }),
  component: () => <Navigate to="/calendar" />,
});
