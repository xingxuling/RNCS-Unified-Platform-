// 事件字段补全引擎
import { EVENT_ALGORITHMS, type EventAlgorithm } from "@/constants/eventAlgorithmTypes";
import { EVENT_MANIFESTATIONS } from "@/constants/eventManifestations";
import { EVENT_VALIDATION_RULES } from "@/constants/eventValidationRules";
import {
  EVENT_COMPLETION_FIELDS,
  TOTAL_COMPLETION_WEIGHT,
  type EventCompletionField,
} from "@/constants/eventCompletionRules";

export interface EventFieldStatus {
  field: EventCompletionField;
  present: boolean;
  fallbackValue?: string | string[];
}

export interface EventCompletionReport {
  eventId: string;
  eventName: string;
  dimensionId: string;
  fields: EventFieldStatus[];
  missingFieldCount: number;
  missingWeight: number;
  completenessScore: number; // 0-100
}

/** 判断某事件某字段是否“已具备”——结合 EventAlgorithm / Manifestation / Validation 三处数据。 */
function hasField(ev: EventAlgorithm, key: string): { present: boolean; fallback?: string | string[] } {
  const manifest = EVENT_MANIFESTATIONS.find((m) => m.eventId === ev.id);
  const validation = EVENT_VALIDATION_RULES.find((r) => r.eventId === ev.id);
  switch (key) {
    case "userFriendlyName":
      return { present: Boolean(ev.userFriendlyName), fallback: ev.userFriendlyName ?? ev.name };
    case "professionalName":
      return { present: Boolean(ev.en), fallback: ev.en };
    case "actionLanguage":
      return { present: Boolean(ev.actionLanguage) || ev.actionPermissions.length > 0,
        fallback: ev.actionLanguage ?? ev.actionPermissions.join(" / ") };
    case "microcopy":
      return { present: Boolean(ev.microcopy), fallback: ev.microcopy };
    case "subtleManifestations": {
      const v = ev.subtleManifestations ?? manifest?.subtle;
      return { present: Boolean(v && v.length > 0), fallback: v };
    }
    case "typicalManifestations": {
      const v = ev.typicalManifestations ?? manifest?.typical;
      return { present: Boolean(v && v.length > 0), fallback: v };
    }
    case "strongManifestations": {
      const v = ev.strongManifestations ?? manifest?.strong;
      return { present: Boolean(v && v.length > 0), fallback: v };
    }
    case "falseManifestations": {
      const v = ev.falseManifestations ?? manifest?.falseSignals;
      return { present: Boolean(v && v.length > 0), fallback: v };
    }
    case "validationSignals":
      return { present: ev.validationSignals.length > 0, fallback: ev.validationSignals };
    case "riskSignals": {
      const v = ev.riskSignals ?? ev.blockingSignals;
      return { present: Boolean(v && v.length > 0), fallback: v };
    }
    case "recommendedFeedbackFields": {
      const v = ev.recommendedFeedbackFields ?? validation?.checklist ?? ev.feedbackMetrics;
      return { present: Boolean(v && v.length > 0), fallback: v };
    }
    case "polarity":
      return { present: Boolean(ev.positiveOrNegative) };
    case "relatedNumbers":
      return { present: false };
    case "relatedFiveDomains":
      return { present: false };
    case "relatedActionPermissions": {
      const v = ev.relatedActionPermissions ?? ev.actionPermissions;
      return { present: v.length > 0, fallback: v };
    }
    default:
      return { present: false };
  }
}


export function buildCompletionReport(ev: EventAlgorithm): EventCompletionReport {
  const fields: EventFieldStatus[] = EVENT_COMPLETION_FIELDS.map((f) => {
    const r = hasField(ev, f.key);
    return { field: f, present: r.present, fallbackValue: r.fallback };
  });
  const missing = fields.filter((f) => !f.present);
  const missingRequired = missing.filter((f) => f.field.required);
  const missingWeight = missing.reduce((s, f) => s + f.field.weight, 0);
  const completenessScore = Math.round(
    ((TOTAL_COMPLETION_WEIGHT - missingWeight) / TOTAL_COMPLETION_WEIGHT) * 100,
  );
  return {
    eventId: ev.id,
    eventName: ev.name,
    dimensionId: ev.dimensionId,
    fields,
    missingFieldCount: missingRequired.length,
    missingWeight,
    completenessScore,
  };
}

export function buildAllCompletionReports(): EventCompletionReport[] {
  return EVENT_ALGORITHMS.map(buildCompletionReport);
}

export interface CompletionAggregate {
  totalEvents: number;
  averageCompleteness: number;
  missingUserLanguageCount: number;
  missingManifestationCount: number;
  missingValidationCount: number;
  missingActionMappingCount: number;
  missingFalseSignalsCount: number;
}

export function aggregateCompletion(reports: EventCompletionReport[]): CompletionAggregate {
  const total = reports.length || 1;
  const avg = Math.round(
    reports.reduce((s, r) => s + r.completenessScore, 0) / total,
  );
  const has = (r: EventCompletionReport, key: string) =>
    r.fields.find((f) => f.field.key === key)?.present;
  return {
    totalEvents: reports.length,
    averageCompleteness: avg,
    missingUserLanguageCount: reports.filter((r) => !has(r, "userFriendlyName")).length,
    missingManifestationCount: reports.filter((r) => !has(r, "typicalManifestations")).length,
    missingValidationCount: reports.filter((r) => !has(r, "validationSignals")).length,
    missingActionMappingCount: reports.filter((r) => !has(r, "relatedActionPermissions")).length,
    missingFalseSignalsCount: reports.filter((r) => !has(r, "falseManifestations")).length,
  };
}
