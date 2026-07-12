import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SUBJECT_MODES } from "@/constants/subject/subjectModes";
import { getActiveSubjectProfile } from "@/lib/subject/activeSubjectModeResolver";
import type { ActiveSubjectProfile } from "@/lib/subject/subjectProfileStore";

export function SubjectModeBadge({ compact = false }: { compact?: boolean }) {
  const [profile, setProfile] = useState<ActiveSubjectProfile | null>(null);

  useEffect(() => {
    setProfile(getActiveSubjectProfile());
    const onStorage = () => setProfile(getActiveSubjectProfile());
    window.addEventListener("storage", onStorage);
    window.addEventListener("aether:subject-mode-changed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("aether:subject-mode-changed", onStorage);
    };
  }, []);

  if (!profile) return null;
  const meta = SUBJECT_MODES[profile.subjectMode];

  return (
    <Link
      to="/subject-mode"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${meta.badgeClass}`}
      title={meta.description}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {compact ? meta.shortLabel : meta.label}
    </Link>
  );
}
