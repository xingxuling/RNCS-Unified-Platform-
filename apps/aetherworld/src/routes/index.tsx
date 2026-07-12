import { createFileRoute } from "@tanstack/react-router";
import { MinimalHome } from "@/components/minimal/MinimalHome";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <MinimalHome />;
}
