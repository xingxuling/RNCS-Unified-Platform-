import { clone, now } from './canonical.mjs';
import { normalizeProjection } from './contracts.mjs';

export function initialState(subjectId = 'subject:dml:blue-tianji-001') {
  return {
    subject: { subject_id: subjectId, name: '数字蓝天机', online: true },
    system: { paused: false, risk_events: 0, devices_online: 1 },
    projects: {
      'project:vsr': { project_id: 'project:vsr', name: 'VSR', subtitle: '视觉与空间投影', selected: true },
      'project:reality-studio': { project_id: 'project:reality-studio', name: 'Reality Studio', subtitle: '现实制造工作台', selected: false },
      'project:dml': { project_id: 'project:dml', name: '数字机械生命', subtitle: '持续主体与学习', selected: false },
      'project:blue-tianji-ip': { project_id: 'project:blue-tianji-ip', name: '蓝天机 IP', subtitle: '世界与内容', selected: false },
    },
    active_project_id: 'project:vsr', goals: {}, active_goal_id: null,
    messages: [], files: [], artifacts: [], approvals: [],
    learning: [], learning_plans: [], sources: [], knowledge_claims: [], experiments: [],
    branches: [], experiences: [], skill_hypotheses: [], skills: [], notices: [],
  };
}

const upsert = (list, key, item) => {
  const index = list.findIndex((entry) => entry[key] === item[key]);
  if (index >= 0) list[index] = { ...list[index], ...item };
  else list.push(item);
};

export function reduceEvent(state, event) {
  const next = clone(state);
  const goal = event.goal_id ? next.goals[event.goal_id] : null;
  switch (event.type) {
    case 'message.added': next.messages.push({ message_id: event.event_id, role: event.data.role || 'system', text: event.message, goal_id: event.goal_id, created_at: event.created_at }); break;
    case 'project.selected': next.active_project_id = event.project_id; Object.values(next.projects).forEach((project) => { project.selected = project.project_id === event.project_id; }); break;
    case 'goal.created': next.goals[event.goal_id] = { goal_id: event.goal_id, project_id: event.project_id, title: event.data.title || event.message, instruction: event.data.instruction || '', status: 'running', progress: { current: 0, total: 1, label: '已创建' }, steps: [], created_at: event.created_at, updated_at: event.created_at }; next.active_goal_id = event.goal_id; break;
    case 'goal.status.changed': if (goal) { goal.status = event.data.status; goal.updated_at = event.created_at; } break;
    case 'plan.created': if (goal) { goal.steps = clone(event.data.steps || []); const completed = goal.steps.filter((step) => step.status === 'completed').length; goal.progress = { current: completed, total: goal.steps.length || 1, label: `${completed}/${goal.steps.length || 1} 步已完成` }; goal.updated_at = event.created_at; } break;
    case 'step.started': if (goal) { upsert(goal.steps, 'step_id', { step_id: event.data.step_id, label: event.data.label, status: 'running', progress: event.data.progress || null }); goal.updated_at = event.created_at; } break;
    case 'step.progressed': if (goal) { upsert(goal.steps, 'step_id', { step_id: event.data.step_id, label: event.data.label, status: 'running', progress: event.data.progress }); goal.progress = event.data.progress || goal.progress; goal.updated_at = event.created_at; } break;
    case 'step.completed': if (goal) { upsert(goal.steps, 'step_id', { step_id: event.data.step_id, label: event.data.label, status: 'completed' }); const completed = goal.steps.filter((step) => step.status === 'completed').length; goal.progress = { current: completed, total: goal.steps.length || 1, label: `${completed}/${goal.steps.length || 1} 步已完成` }; goal.updated_at = event.created_at; } break;
    case 'step.failed': if (goal) { upsert(goal.steps, 'step_id', { step_id: event.data.step_id, label: event.data.label, status: 'failed', error: event.data.error }); const completed = goal.steps.filter((step) => step.status === 'completed').length; goal.progress = { current: completed, total: goal.steps.length || 1, label: `${completed}/${goal.steps.length || 1} 步已完成` }; goal.status = 'blocked'; goal.updated_at = event.created_at; } break;
    case 'file.observed': case 'file.changed': upsert(next.files, 'path', { ...clone(event.data), path: event.data.path, project_id: event.project_id, status: event.type === 'file.changed' ? 'modified' : (event.data.status || 'observed'), root: event.data.root || null }); break;
    case 'artifact.produced': upsert(next.artifacts, 'artifact_id', { ...clone(event.data), artifact_id: event.data.artifact_id, goal_id: event.goal_id, created_at: event.created_at }); break;
    case 'approval.requested': upsert(next.approvals, 'approval_id', { ...clone(event.data), approval_id: event.data.approval_id, goal_id: event.goal_id, status: 'pending', question: event.message }); break;
    case 'approval.resolved': { const approval = next.approvals.find((entry) => entry.approval_id === event.data.approval_id); if (approval) approval.status = event.data.decision; break; }
    case 'transition.committed': if (goal) { goal.status = 'completed'; goal.updated_at = event.created_at; } next.notices.push({ kind: 'success', text: event.message || '结果已加入当前项目', at: event.created_at }); break;
    case 'learning.started': case 'learning.updated': upsert(next.learning, 'learning_id', { ...clone(event.data), updated_at: event.created_at }); break;
    case 'learning.plan.created': upsert(next.learning_plans, 'learning_id', { ...clone(event.data), goal_id: event.goal_id, updated_at: event.created_at }); break;
    case 'source.recorded': upsert(next.sources, 'source_id', { ...clone(event.data), goal_id: event.goal_id }); break;
    case 'knowledge.claimed': upsert(next.knowledge_claims, 'claim_id', { ...clone(event.data), goal_id: event.goal_id }); break;
    case 'experiment.completed': upsert(next.experiments, 'experiment_id', { ...clone(event.data), goal_id: event.goal_id }); break;
    case 'branch.created': upsert(next.branches, 'branch_id', { ...clone(event.data), goal_id: event.goal_id, status: event.data.status || 'candidate' }); break;
    case 'branch.changed': upsert(next.branches, 'branch_id', { branch_id: event.data.branch_id, goal_id: event.goal_id, branch_path: event.data.branch_path, strategy: event.data.strategy, patch: event.data.patch, diff: event.data.diff, status: 'changed' }); break;
    case 'branch.tested': upsert(next.branches, 'branch_id', { ...clone(event.data), goal_id: event.goal_id, status: event.data.status }); break;
    case 'branch.compared': next.notices.push({ kind: 'info', text: event.message, at: event.created_at, data: clone(event.data) }); break;
    case 'branch.committed': upsert(next.branches, 'branch_id', { branch_id: event.data.branch_id, goal_id: event.goal_id, status: 'committed', commit_receipt: clone(event.data) }); break;
    case 'experience.recorded': upsert(next.experiences, 'episode_id', { ...clone(event.data), goal_id: event.goal_id }); break;
    case 'skill.hypothesized': upsert(next.skill_hypotheses, 'hypothesis_id', { ...clone(event.data), goal_id: event.goal_id }); break;
    case 'skill.formed': upsert(next.skills, 'skill_id', { ...clone(event.data), goal_id: event.goal_id, formed_at: event.created_at }); break;
    case 'skill.transfer.verified': { const skill = next.skills.find((entry) => entry.skill_id === event.data.skill_id); if (skill) { skill.level = event.data.level || '已验证'; skill.transfer_verification = clone(event.data); } break; }
    case 'capability.scanned': next.notices.push({ kind: 'info', text: event.message, at: event.created_at, data: clone(event.data) }); break;
    case 'capability.plan.created': next.notices.push({ kind: event.data.executable === false ? 'warning' : 'info', text: event.message, at: event.created_at, data: clone(event.data) }); break;
    case 'capability.gap.detected': next.system.risk_events = Math.max(1, next.system.risk_events || 0); next.notices.push({ kind: 'warning', text: event.message, at: event.created_at, data: clone(event.data) }); break;
    case 'capability.provider.failed': next.system.risk_events = (next.system.risk_events || 0) + 1; next.notices.push({ kind: 'warning', text: event.message, at: event.created_at, data: clone(event.data) }); break;
    case 'capability.plan.revised': next.notices.push({ kind: 'info', text: event.message, at: event.created_at, data: clone(event.data) }); break;
    case 'capability.goal.blocked': if (goal) { goal.status = 'blocked'; goal.updated_at = event.created_at; } next.notices.push({ kind: 'warning', text: event.message, at: event.created_at, data: clone(event.data) }); break;
    case 'capability.goal.resumed': if (goal) { goal.status = 'running'; goal.updated_at = event.created_at; } next.notices.push({ kind: 'success', text: event.message, at: event.created_at, data: clone(event.data) }); break;
    case 'system.paused': next.system.paused = true; break;
    case 'system.resumed': next.system.paused = false; break;
    case 'notice.added': next.notices.push({ kind: event.data.kind || 'info', text: event.message, at: event.created_at }); break;
    default: break;
  }
  return next;
}

export function projectEvents(events, subjectId) {
  let state = initialState(subjectId);
  for (const event of events) state = reduceEvent(state, event);
  const activeGoal = state.active_goal_id ? state.goals[state.active_goal_id] : null;
  return normalizeProjection({
    projection_id: 'projection:dml:workbench:primary', subject_id: subjectId,
    source_event_sequence: events.at(-1)?.sequence || 0,
    state: {
      ...state, active_project: state.projects[state.active_project_id] || null, active_goal: activeGoal,
      right_context: {
        task: activeGoal,
        files: state.files.filter((file) => !activeGoal || file.project_id === activeGoal.project_id),
        artifacts: state.artifacts.filter((artifact) => !activeGoal || artifact.goal_id === activeGoal.goal_id),
        pending_approval: state.approvals.find((approval) => approval.status === 'pending') || null,
      }, generated_at: now(),
    },
  });
}
