import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SOCIAL_OBJECT_TYPE_LIST } from "@/constants/social/socialObjectTypes";
import type { SocialObjectType } from "@/constants/social/socialObjectTypes";
import type { SocialVisibility } from "@/constants/social/socialVisibilityTypes";
import { DEFAULT_SOCIAL_VISIBILITY } from "@/constants/social/socialVisibilityTypes";
import { SocialVisibilitySelector } from "./SocialVisibilitySelector";
import { SocialSafetyNotice } from "./SocialSafetyNotice";
import { runSocialSafetyCheck } from "@/lib/social/socialSafetyGuard";
import { publishPost } from "@/lib/social/socialPublishEngine";
import { getCurrentUserId } from "@/lib/social/socialProfileEngine";
import { emitWorkspaceSocialEvent } from "@/lib/social/socialWorkspaceBridge";
import { notifyPublishResult } from "@/lib/social/socialNoticeBridge";
import { scanForSecrets } from "@/lib/security/secretGuard";
import { SecretConfirmDialog } from "@/components/security/SecretConfirmDialog";

export function SocialPublishPanel({
  initial,
}: {
  initial?: Partial<{ title: string; content: string; postType: SocialObjectType; linkedObjectId: string; linkedObjectType: string }>;
}) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [postType, setPostType] = useState<SocialObjectType>((initial?.postType as SocialObjectType) || "GENERAL_POST");
  const [visibility, setVisibility] = useState<SocialVisibility>(DEFAULT_SOCIAL_VISIBILITY);
  const [allowComments, setAllowComments] = useState(true);
  const [allowRemix, setAllowRemix] = useState(false);
  const [allowStoreLink, setAllowStoreLink] = useState(false);
  const [tags, setTags] = useState("");

  const [secretDialogOpen, setSecretDialogOpen] = useState(false);

  const safety = useMemo(() => runSocialSafetyCheck(`${title}\n${content}\n${tags}`), [title, content, tags]);
  const secretReport = useMemo(() => scanForSecrets(`${title}\n${content}\n${tags}`), [title, content, tags]);
  const blockedPublic = !safety.ok && visibility !== "PRIVATE";

  const doPublish = () => {
    const result = publishPost({
      authorUserId: getCurrentUserId(),
      title,
      content,
      postType,
      visibility,
      allowComments,
      allowRemix,
      allowStoreLink,
      linkedObjectId: initial?.linkedObjectId,
      linkedObjectType: initial?.linkedObjectType,
      tags: tags.split(/[\s,，]+/).filter(Boolean),
    });
    notifyPublishResult(result);
    if (result.ok && result.post) {
      emitWorkspaceSocialEvent(result.post);
      navigate({ to: "/social/object/$id", params: { id: result.post.postId } });
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (secretReport.level !== "PASS") {
      setSecretDialogOpen(true);
      return;
    }
    if (visibility === "PUBLIC") {
      const ok = window.confirm(
        "确认公开发布？\n\n公开发布后，其他用户可能看到该作品。系统会先进行 QA 与敏感内容检查。请确认不包含密钥、私人数据、Founder-only 内容或未授权内容。",
      );
      if (!ok) return;
    }
    doPublish();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">作品标题</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="给作品起个名字"
          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">作品类型</label>
        <select
          value={postType}
          onChange={(e) => setPostType(e.target.value as SocialObjectType)}
          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
        >
          {SOCIAL_OBJECT_TYPE_LIST.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">作品简介 / 正文</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="介绍这个作品、它的用途、灵感来源…"
          className="w-full min-h-[140px] bg-background border border-border rounded-md px-3 py-2 text-sm resize-y"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">标签（空格或逗号分隔）</label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="例如：应用 模板 灵感"
          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">可见性</label>
        <SocialVisibilitySelector value={visibility} onChange={setVisibility} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <label className="flex items-center gap-2 border border-border rounded-md px-3 py-2 cursor-pointer">
          <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} />
          允许评论
        </label>
        <label className="flex items-center gap-2 border border-border rounded-md px-3 py-2 cursor-pointer">
          <input type="checkbox" checked={allowRemix} onChange={(e) => setAllowRemix(e.target.checked)} />
          允许二创 / Remix
        </label>
        <label className="flex items-center gap-2 border border-border rounded-md px-3 py-2 cursor-pointer">
          <input type="checkbox" checked={allowStoreLink} onChange={(e) => setAllowStoreLink(e.target.checked)} />
          关联到商店
        </label>
      </div>

      <SocialSafetyNotice report={safety} />

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!title.trim() || blockedPublic}
          className="px-5 h-9 text-sm bg-foreground text-background rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {visibility === "PRIVATE" ? "保存到我的草稿" : "发布作品"}
        </button>
      </div>



      <SecretConfirmDialog
        open={secretDialogOpen}
        scene="社交发布"
        hits={secretReport.hits.map((h) => ({ label: h.label, sample: h.sample }))}
        onCancel={() => setSecretDialogOpen(false)}
        onConfirmRedacted={() => {
          setSecretDialogOpen(false);
          if (visibility === "PUBLIC") {
            const ok = window.confirm("内容已脱敏，确认公开发布？");
            if (!ok) return;
          }
          doPublish();
        }}
      />
    </div>
  );
}
