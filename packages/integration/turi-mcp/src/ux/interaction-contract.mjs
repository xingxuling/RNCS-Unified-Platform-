export const INTERACTION_CONTRACT = 'turi.interaction.v0.1';

export const INTERACTION_STATUSES = Object.freeze([
  'queued',
  'running',
  'input_required',
  'blocked',
  'completed',
  'failed',
  'cancelled',
]);

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled']);
const STATUS_ALIASES = new Map([
  ['queued', 'queued'],
  ['submitted', 'queued'],
  ['starting', 'running'],
  ['running', 'running'],
  ['in_progress', 'running'],
  ['waiting_subagents', 'running'],
  ['cancelling', 'running'],
  ['waiting_authority', 'input_required'],
  ['awaiting_approval', 'input_required'],
  ['requires_authorization', 'input_required'],
  ['requires_host_reasoning', 'input_required'],
  ['host_contribution_required', 'input_required'],
  ['input_required', 'input_required'],
  ['host_contribution_rejected', 'failed'],
  ['succeeded', 'completed'],
  ['success', 'completed'],
  ['complete', 'completed'],
  ['completed', 'completed'],
  ['ready', 'completed'],
  ['healthy', 'completed'],
  ['degraded', 'completed'],
  ['ok', 'completed'],
  ['failed', 'failed'],
  ['error', 'failed'],
  ['rejected', 'failed'],
  ['cancelled', 'cancelled'],
  ['canceled', 'cancelled'],
  ['blocked', 'blocked'],
  ['not_configured', 'blocked'],
]);

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function normaliseStatusKey(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function normalizeInteractionStatus(value, fallback = 'completed') {
  const key = normaliseStatusKey(value);
  return STATUS_ALIASES.get(key) ?? fallback;
}

export function statusFromData(data, fallback = 'completed') {
  const root = objectValue(data);
  const candidates = [
    root?.status,
    objectValue(root?.job)?.status,
    objectValue(root?.state)?.status,
    objectValue(root?.outcome)?.status,
  ];
  const candidate = candidates.find((item) => item !== undefined && item !== null && item !== '');
  return normalizeInteractionStatus(candidate, fallback);
}

function jobIdFromData(data) {
  const root = objectValue(data);
  const jobId = root?.jobId ?? objectValue(root?.job)?.jobId;
  return typeof jobId === 'string' && jobId.trim() ? jobId : null;
}

function nextActionFor({ status, data, capabilityId }) {
  const root = objectValue(data);
  if (status === 'input_required') {
    if (root?.resumeToken || capabilityId === 'turi.host.request-reasoning' || capabilityId === 'turi.workflow.research-task') {
      return {
        type: 'resume',
        tool: 'turi_resume_with_host_contribution',
        label: '提交宿主贡献后继续',
        requiredFields: ['resumeToken', 'hostContribution'],
      };
    }
    return {
      type: 'authorize',
      label: '补充授权或输入后继续',
      requiredFields: ['requiredInput'],
    };
  }

  if (status === 'queued' || status === 'running') {
    const jobId = jobIdFromData(root);
    if (jobId) {
      return {
        type: 'poll',
        tool: 'turi_job_status',
        label: '查询任务进度',
        arguments: { jobId },
      };
    }
    return { type: 'wait', label: '等待当前执行阶段完成' };
  }

  if (root?.decision?.code === 'GAMEBRAIN_NOT_CONFIGURED') {
    return {
      type: 'inspect',
      tool: 'gamebrain_status',
      label: '先检查 GameBrain 配置',
      reason: '当前路由需要 GameBrain，但服务没有完成配置；不会隐式切换到 Ollama。',
    };
  }

  if (status === 'blocked') {
    return {
      type: 'inspect',
      label: '检查阻断原因并调整配置或输入',
    };
  }

  if (status === 'failed') {
    return {
      type: 'inspect_and_retry',
      label: '查看 error 与 receipt，修复后再重试',
      retryable: true,
    };
  }

  return null;
}

export function interactionFor({ data, capabilityId, status, error = null } = {}) {
  const resolvedStatus = normalizeInteractionStatus(
    status ?? (error ? 'failed' : statusFromData(data)),
    error ? 'failed' : 'completed',
  );
  return {
    format: INTERACTION_CONTRACT,
    status: resolvedStatus,
    terminal: TERMINAL_STATUSES.has(resolvedStatus),
    resumable: resolvedStatus === 'input_required' || resolvedStatus === 'queued' || resolvedStatus === 'running',
    nextAction: nextActionFor({ status: resolvedStatus, data, capabilityId }),
  };
}
