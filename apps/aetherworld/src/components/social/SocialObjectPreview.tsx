import { ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { SocialPost } from "@/lib/social/socialTypes";
import { SOCIAL_OBJECT_TYPES } from "@/constants/social/socialObjectTypes";
import { buildStoreLink, isStoreLinkable } from "@/lib/social/socialStoreBridge";

export function SocialObjectPreview({ post }: { post: SocialPost }) {
  const typeLabel = SOCIAL_OBJECT_TYPES[post.postType]?.label || post.postType;
  const storeLink = isStoreLinkable(post) ? buildStoreLink(post) : null;
  return (
    <div className="border border-border rounded-md p-3 bg-muted/20 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">作品类型</span>
        <span className="font-medium">{typeLabel}</span>
      </div>
      {post.linkedObjectId && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">关联对象</span>
          <span className="font-mono text-[10px]">{post.linkedObjectId.slice(0, 16)}…</span>
        </div>
      )}
      {storeLink && (
        <Link to={storeLink} className="text-xs inline-flex items-center gap-1 text-foreground hover:underline">
          <ExternalLink className="w-3 h-3" /> 在商店中打开
        </Link>
      )}
    </div>
  );
}
