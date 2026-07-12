import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/social/")({
  component: () => <Navigate to="/social/feed" />,
});
