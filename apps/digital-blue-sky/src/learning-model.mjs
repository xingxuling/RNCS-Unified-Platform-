import { hash, id, now } from './canonical.mjs';

export function createLearningPlan({ topic, goalId = null, knowledgeGaps = [], sourceRequirements = [], experiments = [] }) {
  const base = {
    learning_id: id('learning', { topic, goalId, at: now() }),
    topic,
    goal_id: goalId,
    knowledge_gaps: knowledgeGaps,
    source_requirements: sourceRequirements,
    experiments,
    status: 'planned',
    created_at: now(),
  };
  return { ...base, plan_root: hash(base) };
}

export function createKnowledgeClaim({ statement, sourceIds = [], evidenceRoots = [], confidence = 0.5, limitations = [], status = 'candidate' }) {
  const base = {
    claim_id: id('claim', { statement, sourceIds, evidenceRoots }),
    statement,
    confidence: Math.max(0, Math.min(1, Number(confidence))),
    source_ids: sourceIds,
    evidence_roots: evidenceRoots,
    status,
    limitations,
    created_at: now(),
  };
  return { ...base, claim_root: hash(base) };
}

export function createExperienceEpisode({ goalId, context, actions, result, lessons = [], counterfactuals = [], evidenceRoots = [] }) {
  const base = {
    episode_id: id('episode', { goalId, context, actions, result, at: now() }),
    goal_id: goalId,
    context,
    actions,
    result,
    lessons,
    counterfactuals,
    evidence_roots: evidenceRoots,
    created_at: now(),
  };
  return { ...base, evidence_root: hash(base) };
}

export function createSkillHypothesis({ name, triggerConditions, procedure, expectedResult, evidenceRoots = [] }) {
  const base = {
    hypothesis_id: id('skill-hypothesis', { name, triggerConditions, procedure }),
    name,
    trigger_conditions: triggerConditions,
    procedure,
    expected_result: expectedResult,
    evidence_roots: evidenceRoots,
    status: 'candidate',
    created_at: now(),
  };
  return { ...base, hypothesis_root: hash(base) };
}

export function createSkillCapsule({ name, version = '0.1.0', applicability, procedure, validationCases = [], failureBoundaries = [], evidenceRoots = [], level = '刚学会' }) {
  const base = {
    skill_id: id('skill', { name, version, applicability, procedure }),
    name,
    version,
    applicability,
    procedure,
    validation_cases: validationCases,
    failure_boundaries: failureBoundaries,
    evidence_roots: evidenceRoots,
    level,
    formed_at: now(),
  };
  return { ...base, evidence_root: hash(base) };
}
