import { SUBJECT_MODES, type SubjectModeId } from "@/constants/subject/subjectModes";
import { PRIVACY_NOTES } from "@/constants/subject/subjectPrivacyRules";
import { getActiveSubjectProfile } from "./activeSubjectModeResolver";

export interface SubjectMetadata {
  subjectModeUsed: SubjectModeId;
  subjectSource: string;
  subjectDepth: string;
  generatedAt: string;
  privacyNotes: string[];
  subjectPrivacyNote: string;
}

export function buildSubjectMetadata(): SubjectMetadata {
  const profile = getActiveSubjectProfile();
  const meta = SUBJECT_MODES[profile.subjectMode];
  return {
    subjectModeUsed: profile.subjectMode,
    subjectSource: profile.source,
    subjectDepth: meta.depth,
    generatedAt: new Date().toISOString(),
    privacyNotes: [PRIVACY_NOTES[profile.subjectMode]],
    subjectPrivacyNote: PRIVACY_NOTES[profile.subjectMode],
  };
}

export function labelOutput<T extends Record<string, unknown>>(payload: T): T & { metadata: SubjectMetadata } {
  return { ...payload, metadata: buildSubjectMetadata() };
}

export function formatModeLabel(mode: SubjectModeId): string {
  return SUBJECT_MODES[mode].label;
}
