import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "@/router";
import "@/styles.css";
const router = getRouter();
declare module "@tanstack/react-router" { interface Register { router: ReturnType<typeof getRouter>; } }
const root = document.getElementById("root");
if (!root) throw new Error("Aetherworld SPA root element was not found.");
createRoot(root).render(<StrictMode><RouterProvider router={router}/></StrictMode>);
