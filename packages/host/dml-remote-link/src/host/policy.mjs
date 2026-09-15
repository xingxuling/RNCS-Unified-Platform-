import fs from 'node:fs';
import path from 'node:path';
import { clone, RemoteLinkError } from '../shared/canonical.mjs';

const riskRank = { low: 1, medium: 2, high: 3, critical: 4 };

const defaultPolicy = {
  format: 'dml.local-host-policy.v0.4',
  allowed_actions: [
    'dml.goal.create', 'dml.goal.pause', 'dml.goal.resume', 'dml.goal.inspect',
    'dml.learning.start', 'dml.learning.inspect', 'dml.skill.inspect',
    'dml.project.inspect', 'dml.result.preview', 'dml.result.approve',
    'dml.result.reject', 'dml.result.alternate', 'dml.system.pause',
    'dml.system.resume', 'dml.message.send', 'dml.project.select',
    'dml.device.inspect',
  ],
  max_risk: 'high',
  require_reversible_above: 'medium',
  strip_remote_identity: true,
  project_roots: {},
  allow_unmapped_project_inspection: false,
  allow_process_list: false,
  allow_open_url: false,
  allowed_apps: {},
  command_profiles: {},
};

export function loadHostPolicy(file = null) {
  if (!file) return clone(defaultPolicy);
  const resolved = path.resolve(file);
  const supplied = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  return {
    ...clone(defaultPolicy),
    ...supplied,
    project_roots: { ...defaultPolicy.project_roots, ...(supplied.project_roots || {}) },
    allowed_apps: { ...defaultPolicy.allowed_apps, ...(supplied.allowed_apps || {}) },
    command_profiles: { ...defaultPolicy.command_profiles, ...(supplied.command_profiles || {}) },
  };
}

export function enforceHostPolicy(envelope, policy) {
  const action = clone(envelope.action || {});
  if (!policy.allowed_actions.includes(action.type)) {
    throw new RemoteLinkError('HOST_ACTION_DENIED', `Action is not allowed by local host policy: ${action.type}`, 403);
  }
  const risk = String(action.authority?.max_risk || 'medium');
  if ((riskRank[risk] || 99) > (riskRank[policy.max_risk] || 0)) {
    throw new RemoteLinkError('HOST_RISK_DENIED', `Action risk ${risk} exceeds host maximum ${policy.max_risk}`, 403);
  }
  if (policy.strip_remote_identity) {
    delete action.subject;
    delete action.human_principal;
  }
  if (action.type === 'dml.project.inspect') {
    const projectId = action.project_ref?.project_id;
    const root = projectId ? policy.project_roots[projectId] : null;
    if (!root && !policy.allow_unmapped_project_inspection) {
      throw new RemoteLinkError('PROJECT_ROOT_NOT_MAPPED', `No local root is mapped for ${projectId || 'unknown project'}`, 403);
    }
    if (root) action.payload = { ...(action.payload || {}), path: path.resolve(root) };
  }
  if (action.type === 'dml.device.process.list' && !policy.allow_process_list) {
    throw new RemoteLinkError('DEVICE_PROCESS_LIST_DENIED', 'Process listing is disabled by local host policy', 403);
  }
  if (action.type === 'dml.device.url.open' && policy.allow_open_url !== true) {
    throw new RemoteLinkError('DEVICE_OPEN_URL_DENIED', 'Opening URLs is disabled by local host policy', 403);
  }
  if (action.type === 'dml.device.app.launch') {
    const appId = String(action.payload?.app_id || action.app_id || '');
    if (!appId || !policy.allowed_apps?.[appId]) {
      throw new RemoteLinkError('DEVICE_APP_DENIED', `App is not mapped in local host policy: ${appId || 'missing'}`, 403);
    }
  }
  if (action.type === 'dml.device.command.run') {
    const profileId = String(action.payload?.profile_id || action.profile_id || '');
    if (!profileId || !policy.command_profiles?.[profileId]) {
      throw new RemoteLinkError('DEVICE_COMMAND_PROFILE_DENIED', `Command profile is not mapped: ${profileId || 'missing'}`, 403);
    }
  }
  return { ...envelope, action };
}
