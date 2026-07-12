// Preset text scopes — see spec §26
export const TEXT_SCOPES = [
  "home.hero", "home.quickstart", "sidebar.labels",
  "quickstart.public", "quickstart.advanced", "quickstart.founder",
  "emptyStates.core", "safetyNotes.core",
  "subjectMode.badges", "sequenceAi.headers",
  "worldEngine.descriptions", "currency.boundaries",
  "constitution.descriptions", "constantUniverse.descriptions",
  "learningDocs.summaries", "audit.explanations",
  "export.descriptions", "permission.notes",
  "tooltip.core", "errorMessages.core",
] as const;
export type TextScope = (typeof TEXT_SCOPES)[number];
