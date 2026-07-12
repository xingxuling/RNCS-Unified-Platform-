import {
  detectRecentChanges, aggregateChangeTypes, aggregateScopes, aggregateModules,
  type VersionChangeRecord,
} from "./versionChangeDetector";
import { analyzeImpact, impactSummary } from "./versionImpactAnalyzer";
import { scoreVersionLeap, type VersionLeapScore } from "./versionLeapScorer";
import { classifyVersion, type VersionClassification } from "./versionTypeClassifier";
import { suggestVersionNumber, type VersionNumberSuggestion } from "./versionNumberAdvisor";
import { generateReleaseNote, type ReleaseNote } from "./releaseNoteGenerator";
import { checkReleaseReadiness, defaultReadinessInput, type ReleaseReadinessResult } from "./releaseReadinessChecker";
import { planMigration, type MigrationPlan } from "./versionMigrationPlanner";
import { planRollback, type RollbackPlan } from "./versionRollbackPlanner";
import { listVersionTimeline, getCurrentVersion, previousVersion } from "./versionTimelineEngine";
import { auditVersion, type VersionAuditResult } from "./versionAuditEngine";

export interface VersionLeapBundle {
  currentVersion: string;
  currentReleaseName: string;
  currentChannel: string;
  currentStatus: string;
  changes: VersionChangeRecord[];
  changeTypes: ReturnType<typeof aggregateChangeTypes>;
  scopes: ReturnType<typeof aggregateScopes>;
  modules: string[];
  impact: ReturnType<typeof analyzeImpact>;
  impactSummary: ReturnType<typeof impactSummary>;
  score: VersionLeapScore;
  classification: VersionClassification;
  suggestion: VersionNumberSuggestion;
  publicNote: ReleaseNote;
  founderNote: ReleaseNote;
  readiness: ReleaseReadinessResult;
  migration: MigrationPlan;
  rollback: RollbackPlan;
  audit: VersionAuditResult;
}

export function buildVersionLeapBundle(channel: "internal" | "advanced" | "public" | "founder" = "internal"): VersionLeapBundle {
  const current = getCurrentVersion();
  const prev = previousVersion();
  const changes = detectRecentChanges();
  const changeTypes = aggregateChangeTypes(changes);
  const scopes = aggregateScopes(changes);
  const modules = aggregateModules(changes);
  const impact = analyzeImpact(changeTypes, scopes);
  const summary = impactSummary(impact);

  const score = scoreVersionLeap({
    changedModules: modules,
    changeTypes,
    affectedScopes: scopes,
  });

  const classification = classifyVersion(score.leapLevel, changeTypes, scopes);
  const suggestion = suggestVersionNumber(prev?.version ?? current.version, score.leapLevel, classification, channel);

  const publicNote = generateReleaseNote({
    version: suggestion.suggestedVersion,
    releaseName: suggestion.releaseName ?? current.releaseName,
    level: score.leapLevel,
    score, classification, changes, audience: "PUBLIC",
  });
  const founderNote = generateReleaseNote({
    version: suggestion.suggestedVersion,
    releaseName: suggestion.releaseName ?? current.releaseName,
    level: score.leapLevel,
    score, classification, changes, audience: "FOUNDER",
  });

  const readiness = checkReleaseReadiness(defaultReadinessInput(suggestion.suggestedVersion));
  const migration = planMigration(prev?.version ?? "v0.0.0", suggestion.suggestedVersion, score.leapLevel, classification);
  const rollback = planRollback(prev?.version ?? "v0.0.0", score.leapLevel, changes);
  const audit = auditVersion({
    version: suggestion.suggestedVersion,
    releaseName: suggestion.releaseName,
    score, classification, readiness,
    releaseNote: publicNote, migrationPlan: migration, rollbackPlan: rollback,
    founderApproved: false, qaRan: true, recalcRan: true, knownIssuesAcknowledged: false,
  });

  return {
    currentVersion: current.version,
    currentReleaseName: current.releaseName,
    currentChannel: channel,
    currentStatus: current.readinessStatus,
    changes, changeTypes, scopes, modules,
    impact, impactSummary: summary,
    score, classification, suggestion,
    publicNote, founderNote, readiness, migration, rollback, audit,
  };
}

export { listVersionTimeline };
