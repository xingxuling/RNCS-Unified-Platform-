import type { BetaLaunchStatus } from "@/lib/betaLaunchCalculus";
import { Badge } from "@/components/ui/badge";

interface Phase {
  id: string;
  cn: string;
  en: string;
  duration: string;
  users: string;
  goal: string;
  status: BetaLaunchStatus[];
}

const PHASES: Phase[] = [
  {
    id: "P0",
    cn: "Phase 0 · 创始人自测",
    en: "Founder Self-Test",
    duration: "3–7 天",
    users: "1 人（创始人）",
    goal: "完整跑通 60 组数列、回验权重、定数判断。",
    status: ["INTERNAL_ONLY", "NOT_READY"],
  },
  {
    id: "P1",
    cn: "Phase 1 · 私密 Alpha",
    en: "Private Alpha",
    duration: "7–14 天",
    users: "3–10 名可信用户",
    goal: "发现理解问题、安全问题、回验问题。",
    status: ["PRIVATE_ALPHA"],
  },
  {
    id: "P2",
    cn: "Phase 2 · 封闭内测",
    en: "Closed Beta",
    duration: "14–30 天",
    users: "10–50 名筛选用户",
    goal: "验证 onboarding、Demo、Light 20、基础回验。",
    status: ["CLOSED_BETA"],
  },
  {
    id: "P3",
    cn: "Phase 3 · 引导内测",
    en: "Guided Beta",
    duration: "30–60 天",
    users: "50–200 名",
    goal: "验证留存、回验率、地区 UX、产品活性。",
    status: ["GUIDED_BETA"],
  },
  {
    id: "P4",
    cn: "Phase 4 · 公开候补",
    en: "Public Waitlist",
    duration: "持续",
    users: "等待名单",
    goal: "Demo + 产品文档；Full 60 不向陌生用户开放。",
    status: ["PUBLIC_WAITLIST", "RELEASE_CANDIDATE"],
  },
];

interface Props {
  current: BetaLaunchStatus;
}

export function BetaLaunchTimeline({ current }: Props) {
  return (
    <div className="aether-card p-5 space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Launch Timeline</div>
        <div className="font-display text-lg gold-text">内测时间线</div>
      </div>
      <div className="space-y-3">
        {PHASES.map((p) => {
          const active = p.status.includes(current);
          return (
            <div
              key={p.id}
              className={`rounded-md border p-3 ${
                active ? "border-primary/60 bg-primary/5" : "border-border bg-secondary/20"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-display text-sm">
                  {p.cn} <span className="text-[10px] text-muted-foreground ml-1">{p.en}</span>
                </div>
                {active && (
                  <Badge variant="outline" className="border-primary/60 text-primary text-[10px]">
                    当前
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                <div><span className="text-muted-foreground/70">时长：</span>{p.duration}</div>
                <div><span className="text-muted-foreground/70">用户：</span>{p.users}</div>
                <div><span className="text-muted-foreground/70">目标：</span>{p.goal}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
