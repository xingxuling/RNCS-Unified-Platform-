import { createFileRoute, Link } from "@tanstack/react-router";
import { SocialShell } from "@/components/social/SocialShell";
import { listCollections, getOrCreateDefaultCollection } from "@/lib/social/socialCollectionEngine";
import { getCurrentUserId } from "@/lib/social/socialProfileEngine";
import { getPost } from "@/lib/social/socialPublishEngine";
import { useSocialTick } from "@/hooks/useSocialTick";

export const Route = createFileRoute("/social/collections")({
  component: CollectionsPage,
});

function CollectionsPage() {
  useSocialTick();
  const userId = getCurrentUserId();
  getOrCreateDefaultCollection(userId);
  const cols = listCollections(userId);

  return (
    <SocialShell title="收藏" subtitle="你收藏的作品按收藏夹分组管理。">
      <div className="space-y-6">
        {cols.map((c) => (
          <section key={c.collectionId} className="space-y-3">
            <h2 className="text-sm font-medium">{c.name} ({c.postIds.length})</h2>
            {c.postIds.length === 0 ? (
              <div className="border border-dashed border-border rounded-md p-4 text-xs text-muted-foreground">
                这个收藏夹还是空的。
              </div>
            ) : (
              <div className="space-y-2">
                {c.postIds.map((pid) => {
                  const p = getPost(pid);
                  if (!p) return null;
                  return (
                    <Link
                      key={pid}
                      to="/social/object/$id"
                      params={{ id: pid }}
                      className="block border border-border rounded-md px-3 py-2 hover:bg-muted/40"
                    >
                      <div className="text-sm font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{p.content}</div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </SocialShell>
  );
}
