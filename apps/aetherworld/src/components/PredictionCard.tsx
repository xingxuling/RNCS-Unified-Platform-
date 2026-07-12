import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { TriggerResult } from "@/lib/predictionEngine";
import { judgeFiveDomain } from "@/lib/fiveDomainJudge";
import { getEventType } from "@/constants/eventTypes";
import { getAction } from "@/constants/actionPermissions";
import { DOMAIN_META } from "@/constants/types";
import { TriggerBadge, TriggerBar } from "./TriggerBadge";

interface Props {
  result: TriggerResult;
  mainline: string;
  compact?: boolean;
  href?: boolean;
}

export function PredictionCard({ result, mainline, compact, href = true }: Props) {
  const judge = judgeFiveDomain(result, mainline);
  const event = getEventType(result.eventTypeId);
  const action = getAction(result.actionKey);

  const inner = (
    <div className="aether-card p-5 group hover:border-primary/40 transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {result.dayOffset === 0 ? "今日" : result.dayOffset > 0 ? `T+${result.dayOffset}` : `T${result.dayOffset}`}
          </div>
          <div className="font-display text-2xl gold-text mt-1">{result.date}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {result.phase.name}相 · {result.phase.meaning}
          </div>
        </div>
        <div className="text-right space-y-2">
          <TriggerBadge level={result.level} score={result.score} />
          <div className="font-mono text-xs text-muted-foreground">
            数列 #{result.digitsIndex + 1} · {result.digits.join("·")}
          </div>
        </div>
      </div>

      <TriggerBar score={result.score} />

      <div className="mt-4 flex flex-wrap gap-2 items-center text-xs">
        <span
          className="px-2 py-0.5 rounded border"
          style={{
            borderColor: DOMAIN_META[result.dominantDomain].colorVar,
            color: DOMAIN_META[result.dominantDomain].colorVar,
          }}
        >
          主导：{DOMAIN_META[result.dominantDomain].name}域
        </span>
        <span className="px-2 py-0.5 rounded border border-border bg-secondary/30">
          {event.name}
        </span>
        <span className="px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary">
          行动：{action.name}
        </span>
        <span className="font-mono text-muted-foreground">日根 {result.dateRoot}</span>
      </div>

      {!compact && (
        <>
          <div className="gold-divider my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <DomainLine label="天" text={judge.tian} colorVar="var(--tian)" />
            <DomainLine label="地" text={judge.di}   colorVar="var(--di)" />
            <DomainLine label="人" text={judge.ren}  colorVar="var(--ren)" />
            <DomainLine label="神" text={judge.shen} colorVar="var(--shen)" />
            <DomainLine label="风" text={judge.feng} colorVar="var(--feng)" />
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
              <div className="text-[10px] uppercase tracking-widest text-primary/80">总断</div>
              <div className="mt-1 text-base font-display text-primary">{judge.summary}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {action.name} · {action.desc}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <Block title="事件解释" body={event.explanation} />
            <Block title="可能噪声" body={result.noiseCandidates.length ? result.noiseCandidates.join(" · ") : "无明显噪声"} />
            <Block title="验证点" body={event.verification} accent />
          </div>
        </>
      )}

      {href && (
        <div className="mt-4 flex justify-end">
          <Link
            to="/prediction/$date"
            params={{ date: result.date }}
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
          >
            进入详情 / 回验 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );

  return inner;
}

function DomainLine({ label, text, colorVar }: { label: string; text: string; colorVar: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <div
        className="font-display text-base shrink-0 w-6 text-center"
        style={{ color: colorVar }}
      >
        {label}
      </div>
      <div className="text-muted-foreground leading-relaxed">{text}</div>
    </div>
  );
}

function Block({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${accent ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/20"}`}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="mt-1 leading-relaxed">{body}</div>
    </div>
  );
}
