import type { VersionLeapLevel } from "@/constants/version-leap/versionLeapLevels";

export interface VersionTimelineEntry {
  version: string;
  releaseName: string;
  date: string;
  leapLevel: VersionLeapLevel;
  changedModules: string[];
  summary: string;
  readinessStatus: "READY" | "WARN" | "BLOCKED" | "DRAFT";
  founderNote?: string;
  milestone?: boolean;
}

const TIMELINE: VersionTimelineEntry[] = [
  {
    version: "v0.6.0", releaseName: "Sub-Router & Sidebar Release",
    date: "2026-05-10", leapLevel: "MAJOR",
    changedModules: ["sidebar", "router"], summary: "新增 Collapsible Sub-Router System。",
    readinessStatus: "READY", milestone: true,
  },
  {
    version: "v0.7.0", releaseName: "Learning Docs Release",
    date: "2026-05-14", leapLevel: "LEAP",
    changedModules: ["learn", "docs", "tutorials", "module-docs"],
    summary: "新增 Learning & Documentation Engine。",
    readinessStatus: "READY", milestone: true,
  },
  {
    version: "v0.8.0", releaseName: "UI Template Coverage Release",
    date: "2026-05-18", leapLevel: "MAJOR",
    changedModules: ["ui-update-engine", "quick-start"],
    summary: "Quick Start / Examples / Empty States / Safety Notes 模板补齐。",
    readinessStatus: "READY",
  },
  {
    version: "v0.9.0", releaseName: "Text Evolution Release",
    date: "2026-05-22", leapLevel: "LEAP",
    changedModules: ["text-dynamic-update", "text-registry", "text-audit"],
    summary: "新增 Text Dynamic Update Detection & Generation Engine。",
    readinessStatus: "READY", milestone: true,
  },
  {
    version: "v1.0.0-leap.1", releaseName: "Version Leap Release",
    date: new Date().toISOString().slice(0, 10), leapLevel: "LEAP",
    changedModules: ["version-leap", "release-readiness", "release-notes"],
    summary: "新增 Application Version Leap Detection Engine。",
    readinessStatus: "DRAFT", milestone: true,
  },
];

export function listVersionTimeline(): VersionTimelineEntry[] {
  return [...TIMELINE].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getCurrentVersion(): VersionTimelineEntry {
  return listVersionTimeline()[0];
}

export function previousVersion(): VersionTimelineEntry | undefined {
  return listVersionTimeline()[1];
}

export function appendTimelineEntry(entry: VersionTimelineEntry): void {
  TIMELINE.push(entry);
}

export function compareVersions(a: string, b: string): VersionTimelineEntry[] {
  return TIMELINE.filter((t) => t.version === a || t.version === b);
}
