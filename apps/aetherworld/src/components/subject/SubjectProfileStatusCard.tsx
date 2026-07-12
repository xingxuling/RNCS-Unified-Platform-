import { useEffect, useState } from "react";
import { SUBJECT_MODES } from "@/constants/subject/subjectModes";
import { getActiveSubjectProfile } from "@/lib/subject/activeSubjectModeResolver";
import type { ActiveSubjectProfile } from "@/lib/subject/subjectProfileStore";

export function SubjectProfileStatusCard() {
  const [profile, setProfile] = useState<ActiveSubjectProfile | null>(null);
  useEffect(() => {
    setProfile(getActiveSubjectProfile());
  }, []);

  if (!profile) return null;
  const meta = SUBJECT_MODES[profile.subjectMode];

  return (
    <div className="aether-card p-4 space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{meta.label}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] ${meta.badgeClass}`}>{meta.shortLabel}</span>
      </div>
      <dl className="grid grid-cols-2 gap-y-1 text-xs text-muted-foreground">
        <dt>主体 ID</dt><dd className="text-right text-foreground">{profile.subjectId}</dd>
        <dt>显示名称</dt><dd className="text-right text-foreground">{profile.displayName}</dd>
        <dt>数列数量</dt><dd className="text-right text-foreground">{profile.sequenceCount}</dd>
        <dt>已存 Light20</dt><dd className="text-right text-foreground">{profile.hasLight20 ? "是" : "否"}</dd>
        <dt>已存 Full60</dt><dd className="text-right text-foreground">{profile.hasFull60 ? "是" : "否"}</dd>
        <dt>Founder</dt><dd className="text-right text-foreground">{profile.isFounder ? "已启用" : "未启用"}</dd>
        <dt>隐私级别</dt><dd className="text-right text-foreground">{profile.privacyLevel}</dd>
        <dt>数据来源</dt><dd className="text-right text-foreground">{profile.source}</dd>
      </dl>
    </div>
  );
}
