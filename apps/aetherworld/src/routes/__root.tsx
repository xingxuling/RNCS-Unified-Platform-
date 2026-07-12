import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { AetherResponsiveShell } from "@/components/layout/AetherResponsiveShell";
import { BottomChatBar } from "@/components/minimal/BottomChatBar";
import { FirstUseSetupModal } from "@/components/first-use/FirstUseSetupModal";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { runSubjectModeMigration } from "@/lib/subject/subjectModeMigration";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="aether-card max-w-md text-center p-10">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Aether Fate Engine
        </div>
        <h1 className="text-7xl font-display gold-text mt-3">404</h1>
        <h2 className="mt-4 text-xl font-display">未匹配到时间线节点</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          这一节点不在当前主体的预测范围内。
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            回到主控台
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="aether-card max-w-md text-center p-10">
        <h1 className="text-xl font-display text-foreground">引擎暂时无法读取此结构</h1>
        <p className="mt-2 text-sm text-muted-foreground">请重试或返回主控台。</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            重试
          </button>
          <a href="/" className="rounded-md border border-border bg-background px-4 py-2 text-sm">主控台</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Aetherworld｜数列元智能驱动器" },
      { name: "description", content: "Aetherworld 是一个以对话为入口的数列元智能平台，支持应用生成、能力商店、模型接入、工作区管理、日历触发与社交发布。" },
      { name: "author", content: "Aether" },
      { property: "og:title", content: "Aetherworld｜数列元智能驱动器" },
      { property: "og:description", content: "Aetherworld 是一个以对话为入口的数列元智能平台，支持应用生成、能力商店、模型接入、工作区管理、日历触发与社交发布。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Aetherworld｜数列元智能驱动器" },
      { name: "twitter:description", content: "Aetherworld 是一个以对话为入口的数列元智能平台，支持应用生成、能力商店、模型接入、工作区管理、日历触发与社交发布。" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b12b1579-d69b-42c3-afac-724b93425f6f/id-preview-c5f0a672--a99c959d-8fe8-48c3-9ca4-e90017b31add.lovable.app-1779666655336.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b12b1579-d69b-42c3-afac-724b93425f6f/id-preview-c5f0a672--a99c959d-8fe8-48c3-9ca4-e90017b31add.lovable.app-1779666655336.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    runSubjectModeMigration();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AetherResponsiveShell>
        <Outlet />
        <BottomChatBar />
      </AetherResponsiveShell>
      <Toaster richColors theme="dark" />
      <FirstUseSetupModal />
    </QueryClientProvider>
  );
}
