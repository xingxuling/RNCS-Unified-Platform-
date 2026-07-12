import { createFileRoute } from "@tanstack/react-router";
import { SocialShell } from "@/components/social/SocialShell";
import { socialStorage } from "@/lib/social/socialStorage";
import { useSocialTick } from "@/hooks/useSocialTick";
import { useFounderState } from "@/hooks/useFounderState";
import { listPublishAuditsForFounder } from "@/lib/social/socialPublishAuditLogger";

export const Route = createFileRoute("/social/audit")({
  component: AuditPage,
});

function AuditPage() {
  useSocialTick();
  const founder = useFounderState();
  const posts = socialStorage.getPosts();
  const flagged = posts.filter((p) => p.qaStatus === "WARN" || p.qaStatus === "BLOCKED" || p.qaStatus === "FAIL");
  const audits = listPublishAuditsForFounder();

  if (!founder.active) {
    return (
      <SocialShell title="社交审计">
        <div className="text-sm text-muted-foreground">仅 Founder 可查看完整审计记录。</div>
      </SocialShell>
    );
  }

  return (
    <SocialShell title="社交审计" subtitle="QA 状态非通过的作品 + 发布行为审计。">
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-medium">被标记的作品</h3>
          {flagged.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-6 text-center">
              目前没有被标记的作品。
            </div>
          ) : (
            flagged.map((p) => (
              <div key={p.postId} className="border border-border rounded-md p-3 space-y-1">
                <div className="text-sm font-medium">{p.title}</div>
                <div className="text-xs text-muted-foreground">
                  作者 {p.authorUserId} · {p.visibility} · {p.qaStatus}
                </div>
                {p.qaNotes && (
                  <ul className="text-xs text-amber-500 list-disc pl-5">
                    {p.qaNotes.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                )}
              </div>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium">发布行为审计（最近 50 条）</h3>
          {audits.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-6 text-center">
              暂无发布审计记录。
            </div>
          ) : (
            <div className="border border-border rounded-md divide-y divide-border">
              {audits.slice(0, 50).map((a) => (
                <div key={a.auditId} className="p-3 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.action}</span>
                    <span className="text-muted-foreground">·</span>
                    <span>{a.visibility}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className={a.safetyStatus === "BLOCK" ? "text-rose-500" : a.safetyStatus === "WARN" ? "text-amber-500" : "text-emerald-500"}>
                      {a.safetyStatus}
                    </span>
                    <span className="ml-auto text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-muted-foreground">用户 {a.userId} · QA {a.qaStatus}{a.postId ? ` · post ${a.postId}` : ""}</div>
                  {a.blockedReasons.length > 0 && (
                    <ul className="list-disc pl-5 text-rose-500">
                      {a.blockedReasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </SocialShell>
  );
}
