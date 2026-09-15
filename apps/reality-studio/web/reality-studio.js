const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let state = null;
let sessionId = null;
let viewportDataUrl = null;
let viewportExpanded = false;
let activeConsole = 'logs';
let activeInspectorTab = 'properties';
let consoleQuery = '';
let toastTimer = null;
let stateRevision = 0;
let graphZoom = 1;
let graphGridVisible = true;

const STATUS_TEXT = {
  initializing: '初始化中',
  ready: '已验证',
  running: '运行中',
  healthy: '健康',
  candidate: '候选',
  'candidate-verified': '候选已验证',
  simulated: '已模拟',
  authorized: '已授权',
  'awaiting-explicit-confirmation': '等待明确确认',
  'candidate-committed': '本地候选已提交',
  'committed-local-candidate': '本地候选已提交',
  locked: '已锁定',
  unavailable: '不可用',
  failed: '失败',
  open: '开放缺口',
  recorded: '已记录',
  verified: '已验证',
  required: '需要操作',
};

const NODE_ICONS = {
  'data-source': '◌',
  'semantic-compiler': '✣',
  'studio-adapter': '◫',
  'reality-kernel': '◆',
  'world-body': '◉',
  'rsr-runtime': '◈',
  'commit-gate': '⬡',
  'vsr-projection': '▣',
  'candidate-reality': '◇',
  'behavior-fabric': '♧',
  'evidence-ledger': '▤',
  'network-runtime': '⌘',
  'authority-fabric': '⬢',
  'agent-hub': '♙',
};

const EDGE_MARKERS = Object.freeze({
  source: 'graph-arrow-source',
  projection: 'graph-arrow-projection',
  runtime: 'graph-arrow-runtime',
  candidate: 'graph-arrow-candidate',
  authority: 'graph-arrow-authority',
  evidence: 'graph-arrow-evidence',
  unavailable: 'graph-arrow-unavailable',
});

function esc(value) {
  return String(value === undefined || value === null ? '—' : value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function json(value) {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try { return JSON.stringify(value); } catch { return '[unserializable]'; }
}

function shortRoot(value) {
  if (!value) return '—';
  const text = String(value);
  return text.length > 24 ? `${text.slice(0, 12)}…${text.slice(-8)}` : text;
}

function statusClass(value) {
  return String(value ?? 'unavailable').toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

function statusText(value) {
  return STATUS_TEXT[value] ?? String(value ?? 'unavailable').replaceAll('-', ' ');
}

function dotClass(value) {
  const normalized = statusClass(value);
  if (['ready', 'running', 'healthy', 'verified'].includes(normalized)) return 'is-ready';
  if (['candidate', 'candidate-verified', 'simulated', 'authorized', 'awaiting-explicit-confirmation', 'candidate-committed', 'committed-local-candidate', 'open', 'recorded', 'required'].includes(normalized)) return 'is-candidate';
  if (['failed'].includes(normalized)) return 'is-failed';
  return '';
}

function notify(message, error = false) {
  const node = $('#toast');
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('is-error', error);
  node.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-visible'), 4200);
}

async function post(path, payload = {}) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let result = null;
  try { result = await response.json(); } catch { result = {}; }
  if (!response.ok) {
    const error = result?.error ?? {};
    throw new Error(`${error.code ?? `HTTP_${response.status}`}: ${error.message ?? 'request failed'}`);
  }
  return result;
}

function setState(next) {
  stateRevision += 1;
  state = next;
  sessionId = next?.session_id ?? sessionId;
  if (next?.viewport_png_data_url) viewportDataUrl = next.viewport_png_data_url;
  render();
}

function showUnavailable(error) {
  stateRevision += 1;
  state = null;
  sessionId = null;
  viewportDataUrl = null;
  $('#studioShell')?.classList.remove('file-entry-required');
  $('#studioShell')?.classList.add('runtime-unavailable');
  $('#runtimePillText').textContent = 'Native Runtime unavailable';
  $('#sidebarStatus').innerHTML = '<span class="status-dot is-failed"></span><span>原生运行时不可用</span>';
  $('#workspaceMeta').textContent = error?.message ?? '无法连接 Reality Studio Adapter';
  $('#graphNodes').innerHTML = '<div class="graph-loading">Native Runtime unavailable · 未显示本地假数据</div>';
  syncControls();
  notify(`Native Runtime unavailable：${error?.message ?? 'request failed'}`, true);
}

function showFileProtocolEntry() {
  stateRevision += 1;
  state = null;
  sessionId = null;
  viewportDataUrl = null;
  $('#studioShell')?.classList.remove('runtime-unavailable');
  $('#studioShell')?.classList.add('file-entry-required');
  $('#runtimePillText').textContent = '请启动本地 Studio 服务';
  $('#sidebarStatus').innerHTML = '<span class="status-dot is-candidate"></span><span>file:// 无法连接 Runtime API</span>';
  $('#workspaceMeta').textContent = '当前页面由 file:// 打开；Reality Graph 需要本地 Adapter API。';
  $('#graphNodes').innerHTML = '<div class="graph-loading graph-loading-entry"><strong>需要本地 Reality Studio 服务</strong><span>请运行启动 Reality Studio 原生版.bat，或启动服务后打开下方地址。</span><a href="http://127.0.0.1:17608/">打开 http://127.0.0.1:17608/</a></div>';
  syncControls();
  notify('检测到 file:// 入口；未创建假 Runtime 会话。请通过本地服务地址打开。', true);
}

async function createSession() {
  stateRevision += 1;
  state = null;
  sessionId = null;
  viewportDataUrl = null;
  $('#studioShell')?.classList.remove('runtime-unavailable');
  $('#studioShell')?.classList.remove('file-entry-required');
  if (window.location.protocol === 'file:') {
    showFileProtocolEntry();
    return;
  }
  $('#runtimePillText').textContent = '创建真实适配器会话…';
  try {
    const next = await post('/api/reality-studio/session/new', {});
    viewportDataUrl = null;
    setState(next);
    await refreshViewportImage();
    notify('Game World Graph 已连接到本地原生运行时。');
  } catch (error) {
    showUnavailable(error);
  }
}

async function refreshViewportImage() {
  if (!sessionId) return;
  const requestedSessionId = sessionId;
  const requestedRevision = stateRevision;
  try {
    const next = await post('/api/reality-studio/session/viewport', { session_id: requestedSessionId });
    if (sessionId !== requestedSessionId) return;
    if (!state || stateRevision === requestedRevision) {
      setState(next);
      return;
    }
    // A viewport request may complete after a newer control response. Preserve
    // that newer Runtime/Evidence state, and merge pixels only when both
    // responses name the same verified viewport root.
    if (state.viewport?.viewport_root && state.viewport.viewport_root === next.viewport?.viewport_root) {
      setState({ ...state, viewport: next.viewport, viewport_png_data_url: next.viewport_png_data_url });
    }
  } catch (error) {
    notify(`VSR viewport unavailable：${error.message}`, true);
  }
}

async function inspectSession() {
  if (!sessionId) return createSession();
  try { setState(await post('/api/reality-studio/session/inspect', { session_id: sessionId })); }
  catch (error) { notify(error.message, true); }
}

async function sendCommand(command, payload = {}) {
  if (!sessionId) return createSession();
  try {
    const next = await post('/api/reality-studio/session/command', { session_id: sessionId, command, ...payload });
    setState(next);
    if (['step', 'run', 'reset', 'candidate-commit'].includes(command)) await refreshViewportImage();
    if (command === 'candidate-propose') notify('候选 Reality 已由 Behavior Fabric 实际模拟，尚未授权。');
    if (command === 'candidate-authorize') notify('候选已获得本地明确授权，仍需单独提交确认。');
    if (command === 'candidate-commit') notify('本地候选已提交到当前 Studio Session；生产 promotion 仍不可用。');
    if (command === 'replay') {
      const replay = next.replay ?? {};
      if (replay.status === 'verified') notify('Behavior + Network 已在隔离运行时重放并核对 roots；活跃世界未被改写。');
      else notify(`Integration replay ${statusText(replay.status)}：${replay.reason ?? '请查看 Evidence Ledger。'}`, replay.status === 'failed');
    }
  } catch (error) {
    notify(error.message, true);
  }
}

function render() {
  if (!state) { syncControls(); return; }
  $('#studioShell')?.classList.remove('runtime-unavailable');
  renderShell();
  renderSidebar();
  renderGraph();
  renderInspector();
  renderConsole();
  renderViewport();
  renderCommitCard();
  renderFooter();
  syncControls();
}

function renderShell() {
  const runtime = state.runtime ?? {};
  const graph = state.graph ?? {};
  const project = state.project ?? {};
  const gate = state.commit_gate ?? {};
  const integration = state.integration ?? {};
  const replay = state.replay ?? {};
  const roots = state.inspector?.source_roots ?? {};
  const branchId = graph.recommended_branch_id ?? '—';
  const status = runtime.status === 'healthy' ? runtime.status : state.status;
  const dot = dotClass(status);
  $('#runtimePillText').textContent = runtime.status === 'healthy' ? `Native Runtime · ${statusText(runtime.control_mode)}` : statusText(status);
  $('#runtimePill .status-dot').className = `status-dot ${dot}`;
  $('#projectTitle').textContent = project.title ?? 'Reality Studio';
  $('#projectId').textContent = project.project_id ?? 'Native Runtime';
  $('#workspaceHeading').textContent = project.title ? `${project.title} / Game World Graph` : 'Game World Graph';
  $('#workspaceMeta').textContent = `${project.format ?? '—'} · ${shortRoot(project.project_root)} · ${runtime.protocol ?? 'native runtime'} · Product Body projection`;
  const badge = $('#liveBadge');
  badge.className = `live-badge ${dot}`;
  badge.innerHTML = `<span class="status-dot ${dot}"></span>${esc(statusText(status))}`;
  $('#adapterVersion').textContent = `${state.version ?? '—'}`;
  const sidebarStatus = $('#sidebarStatus');
  sidebarStatus.innerHTML = `<span class="status-dot ${dot}"></span><span>${esc(runtime.status === 'healthy' ? '原生运行时健康' : statusText(status))}</span>`;
  $('#graphHint').textContent = `${graph.nodes?.length ?? 0} backend nodes · ${runtime.server?.players ?? '—'} players · tick ${runtime.tick ?? '—'} · status from roots`;
  $('#statusRuntimeValue').textContent = statusText(runtime.status);
  $('#statusRuntimeValue').className = `status-signal-value ${dotClass(runtime.status)}`;
  $('#statusRuntimeMeta').textContent = `${runtime.protocol ?? '—'} · ${shortRoot(runtime.state_root)}`;
  $('#statusControlValue').textContent = statusText(runtime.control_mode);
  $('#statusControlValue').className = `status-signal-value ${dotClass(runtime.control_mode)}`;
  $('#statusControlMeta').textContent = `tick ${runtime.tick ?? '—'} · ${runtime.server?.players ?? '—'} players · epoch ${integration.entry_count ?? 0} · replay ${statusText(replay.status)}`;
  $('#statusWorldValue').textContent = project.title ?? '—';
  $('#statusWorldValue').className = 'status-signal-value';
  $('#statusWorldMeta').textContent = `session ${shortRoot(state.session_id)} · scene ${project.active_scene_id ?? '—'}`;
  const tick = runtime.tick ?? '—';
  const players = runtime.server?.players ?? '—';
  $('#statusTickPlayersValue').textContent = `${tick} · ${players}`;
  $('#statusTickPlayersValue').className = 'status-signal-value';
  $('#statusTickPlayersMeta').textContent = `authoritative server · ${runtime.server?.authoritative_world_instances ?? '—'} world(s)`;
  const tickAligned = state.integration?.tick_aligned;
  const syncValue = tickAligned === true ? 'ALIGNED' : tickAligned === false ? 'CHECK' : 'UNAVAILABLE';
  const syncClass = tickAligned === true ? 'is-ready' : tickAligned === false ? 'is-candidate' : 'is-failed';
  $('#statusSyncValue').textContent = syncValue;
  $('#statusSyncValue').className = `status-signal-value ${syncClass}`;
  $('#statusSyncMeta').textContent = `behavior ${state.inspector?.properties?.behavior_tick ?? '—'} · network ${runtime.server?.tick ?? '—'}`;
  $('#statusBranchValue').textContent = branchId;
  $('#statusBranchValue').className = `status-signal-value ${graph.recommended_branch_id ? 'is-candidate' : ''}`;
  $('#statusBranchMeta').textContent = `comparison ${shortRoot(roots.branch_comparison_root)}`;
  $('#statusGateValue').textContent = statusText(gate.status);
  $('#statusGateValue').className = `status-signal-value ${dotClass(gate.status)}`;
  $('#statusGateMeta').textContent = gate.production_promotion_permitted === true ? 'production promotion available' : 'production promotion unavailable';
}

function renderSidebar() {
  $$('.nav-item[data-node]').forEach(button => button.classList.toggle('is-active', button.dataset.node === state.graph.selected_node_id));
}

function graphEdgePath(from, to) {
  const x1 = Number(from.x);
  const y1 = Number(from.y);
  const x2 = Number(to.x);
  const y2 = Number(to.y);
  if (![x1, y1, x2, y2].every(Number.isFinite)) return '';
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const bend = Math.max(4.5, Math.abs(dx) * .42) * (Math.sign(dx) || 1);
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
  }
  const bend = Math.max(4.5, Math.abs(dy) * .42) * (Math.sign(dy) || 1);
  return `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`;
}

function applyGraphView() {
  const canvas = $('#graphCanvas');
  const edges = $('#graphEdges');
  const nodes = $('#graphNodes');
  if (!canvas || !edges || !nodes) return;
  // Keep the Adapter-provided desktop coordinates intact. On a narrow
  // viewport this is only a Product Body fit transform so every real node
  // remains inspectable without changing the graph state or hiding nodes.
  const fitScale = window.innerWidth <= 900 ? 0.74 : 1;
  const transform = `scale(${(graphZoom * fitScale).toFixed(2)})`;
  edges.style.transform = transform;
  nodes.style.transform = transform;
  edges.style.transformOrigin = '50% 50%';
  nodes.style.transformOrigin = '50% 50%';
  canvas.classList.toggle('is-grid-muted', !graphGridVisible);
  const readout = $('#graphZoomReadout');
  if (readout) readout.textContent = `${Math.round(graphZoom * 100)}%`;
}

function branchDisplayName(value) {
  return String(value ?? 'branch').replace(/^branch:/, '').replaceAll('-', ' ');
}

function renderGraphBranchRail() {
  const rail = $('#graphBranchRail');
  if (!rail) return;
  const rows = state.graph?.branch_rows ?? [];
  const recommended = state.graph?.recommended_branch_id;
  if (!rows.length) {
    rail.innerHTML = '<span class="graph-rail-empty">当前没有后端 Branch Evaluation</span>';
    return;
  }
  rail.innerHTML = `<div class="graph-rail-header"><span>CANDIDATE BRANCH EVALUATION</span><span>${rows.length} evaluated</span></div><div class="graph-branch-list">${rows.map(row => {
    const isRecommended = row.branch_id === recommended;
    const eligibility = row.eligible ? 'ELIGIBLE' : 'INELIGIBLE';
    return `<div class="graph-branch-chip${isRecommended ? ' is-recommended' : ''}${row.eligible ? '' : ' is-ineligible'}" title="${esc(`${row.branch_id} · simulation ${row.simulation_root ?? '—'} · state ${row.candidate_state_root ?? '—'}`)}"><span class="graph-branch-name">${esc(branchDisplayName(row.branch_id))}</span><strong>${esc(row.score ?? '—')}</strong><small>${eligibility}${isRecommended ? ' · RECOMMENDED' : ''}</small></div>`;
  }).join('')}</div>`;
}

function renderGraphPromotionStatus() {
  const element = $('#graphPromotionStatus');
  if (!element) return;
  const gate = state.commit_gate ?? {};
  const productionReady = gate.production_promotion_permitted === true;
  const localReady = gate.local_candidate_commit_ready === true;
  const pending = (gate.checks ?? []).filter(check => ['required', 'unavailable'].includes(check.status)).length;
  const status = productionReady ? 'PROMOTION READY' : localReady ? 'LOCAL COMMIT READY · PRODUCTION UNAVAILABLE' : `GATE ${statusText(gate.status).toUpperCase()}`;
  const detail = productionReady ? 'external authority connected' : `${pending} gate check(s) pending · ${localReady ? 'local candidate path available' : 'local candidate path unavailable'}`;
  element.innerHTML = `<span class="promotion-status-dot ${dotClass(gate.status)}"></span><strong>${esc(status)}</strong><small>${esc(detail)}</small>`;
}

function renderGraph() {
  const nodes = state.graph?.nodes ?? [];
  const edges = state.graph?.edges ?? [];
  const byId = new Map(nodes.map(node => [node.id, node]));
  const selectedId = state.graph?.selected_node_id;
  $('#graphEdges').innerHTML = edges.map(edge => {
    const from = byId.get(edge.from)?.position;
    const to = byId.get(edge.to)?.position;
    if (!from || !to) return '';
    const related = selectedId && (edge.from === selectedId || edge.to === selectedId);
    const emphasis = related ? ' is-related' : selectedId ? ' is-dimmed' : '';
    const marker = EDGE_MARKERS[edge.kind];
    return `<path class="graph-edge graph-edge-${esc(edge.kind)}${emphasis}" data-from="${esc(edge.from)}" data-to="${esc(edge.to)}" d="${graphEdgePath(from, to)}"${marker ? ` marker-end="url(#${marker})"` : ''}></path>`;
  }).join('');
  $('#graphNodes').innerHTML = nodes.map(node => {
    const status = statusClass(node.status);
    const metrics = Object.entries(node.metrics ?? {}).slice(0, 2).map(([key, value]) => `${key}:${json(value)}`).join(' · ');
    const selected = node.id === state.graph.selected_node_id ? ' is-selected' : '';
    return `<button class="graph-node status-${esc(status)}${selected}" data-node="${esc(node.id)}" style="left:${node.position.x}%;top:${node.position.y}%" title="${esc(node.root ?? node.subtitle ?? '')}">
      <span class="node-head"><span class="node-icon">${esc(NODE_ICONS[node.id] ?? '◇')}</span><span class="node-copy"><span class="node-title">${esc(node.title)}</span><span class="node-subtitle">${esc(node.subtitle)}</span></span></span>
      <span class="node-status status-${esc(status)}"><span class="status-dot ${dotClass(node.status)}"></span>${esc(statusText(node.status))}</span>
      <span class="node-root">${esc(metrics || shortRoot(node.root))}</span>
    </button>`;
  }).join('');
  renderGraphBranchRail();
  renderGraphPromotionStatus();
  applyGraphView();
}

function propertyRows(rows) {
  return rows.filter(([, value]) => value !== undefined).map(([key, value]) => `<div class="property-row"><span class="property-key">${esc(key)}</span><span class="property-value ${String(key).includes('root') ? 'is-root' : ''}">${esc(json(value))}</span></div>`).join('');
}

function rootsBlock(roots) {
  const entries = Object.entries(roots ?? {}).filter(([, value]) => value !== null && value !== undefined);
  if (!entries.length) return '<div class="empty-state">暂无可验证 root</div>';
  return `<div class="root-block">${entries.map(([key, value]) => `<div class="root-line"><span>${esc(key)}</span><span title="${esc(value)}">${esc(shortRoot(value))}</span></div>`).join('')}</div>`;
}

function gapsBlock(gaps) {
  if (!gaps?.length) return '<div class="empty-state">当前没有后端报告的缺口</div>';
  return gaps.map(gap => `<div class="gap-item ${gap.severity === 'high' ? 'is-high' : ''}"><div class="gap-code">${esc(gap.code)}</div><div class="gap-detail">${esc(gap.detail ?? gap.reason ?? '—')}</div><div class="gap-status">${esc(statusText(gap.status))}</div></div>`).join('');
}

function inspectorSummary(selected) {
  const metrics = Object.entries(selected.metrics ?? {}).filter(([, value]) => value !== null && value !== undefined).slice(0, 4);
  const metricMarkup = metrics.length
    ? metrics.map(([key, value]) => `<div class="summary-metric"><span>${esc(key)}</span><strong>${esc(json(value))}</strong></div>`).join('')
    : '<div class="empty-state summary-empty">No exposed health metrics</div>';
  const receipt = (selected.evidence_refs ?? []).find(Boolean);
  return `<section class="inspector-summary" id="inspectorSummary">
    <div class="inspector-summary-top"><span class="inspector-summary-kicker">SELECTED NODE</span><span class="summary-status ${dotClass(selected.status)}"><span class="status-dot ${dotClass(selected.status)}"></span>${esc(statusText(selected.status))}</span></div>
    <div class="inspector-summary-title">${esc(selected.title ?? 'Node')}</div>
    <div class="inspector-summary-subtitle">${esc(selected.owner ?? '—')} · ${esc(selected.subtitle ?? '—')}</div>
    <div class="inspector-metrics">${metricMarkup}</div>
    <div class="inspector-provenance"><div><span>API</span><code>${esc(selected.api ?? 'unavailable')}</code></div><div><span>ROOT</span><code title="${esc(selected.root ?? '')}">${esc(shortRoot(selected.root))}</code></div><div><span>RECEIPT</span><code title="${esc(receipt ?? '')}">${esc(shortRoot(receipt))}</code></div></div>
  </section>`;
}

function renderInspector() {
  const selected = state.inspector?.selected_node ?? state.graph?.nodes?.[0];
  if (!selected) return;
  $('#inspectorIcon').textContent = NODE_ICONS[selected.id] ?? '◇';
  $('#inspectorTitle').textContent = selected.title ?? 'Node';
  $('#inspectorSubtitle').textContent = selected.subtitle ?? 'Backend-driven inspector';
  const statusNode = $('#inspectorStatus');
  statusNode.textContent = statusText(selected.status);
  statusNode.className = `inspector-status ${dotClass(selected.status)}`;
  const roots = state.inspector?.source_roots ?? {};
  const summary = inspectorSummary(selected);
  const technicalDetails = `<details class="inspector-details"><summary>Technical details <span>▾</span></summary><section class="inspector-section">${propertyRows([
    ['节点 ID', selected.id], ['Owner', selected.owner], ['状态', statusText(selected.status)], ['Format', selected.format], ['Version', selected.version], ['API', selected.api], ['Source', selected.source], ['Root', selected.root],
  ])}</section><section class="inspector-section"><div class="inspector-section-title">Exposed runtime properties</div>${propertyRows(Object.entries(selected.metrics ?? {}))}</section></details>`;
  const evidenceDetails = `<details class="inspector-details"><summary>Roots & receipts <span>▾</span></summary><section class="inspector-section"><div class="inspector-section-title">Source Roots</div>${rootsBlock(roots)}</section><section class="inspector-section"><div class="inspector-section-title">Node Evidence</div>${(selected.evidence_refs ?? []).filter(Boolean).map(ref => `<div class="root-line"><span>receipt</span><span title="${esc(ref)}">${esc(shortRoot(ref))}</span></div>`).join('') || '<div class="empty-state">暂无 evidence refs</div>'}</section></details>`;
  const gapDetails = `<details class="inspector-details"><summary>Backend gaps <span>▾</span></summary><section class="inspector-section">${gapsBlock(state.gaps)}</section></details>`;
  let body = '';
  if (activeInspectorTab === 'properties') {
    body = summary + technicalDetails + evidenceDetails + gapDetails;
    if (selected.id === 'candidate-reality') {
      const rows = state.graph.branch_rows ?? [];
      body += `<details class="inspector-details"><summary>Reality Branch candidates <span>▾</span></summary><section class="inspector-section">${rows.map(row => `<div class="console-card"><div class="console-card-head"><span>${esc(row.branch_id)}</span><small>${row.eligible ? 'eligible' : 'ineligible'}</small></div><div class="console-card-body">score ${esc(row.score)} · resilience ${esc(row.resilience)}<br>simulation ${esc(shortRoot(row.simulation_root))}<br>state ${esc(shortRoot(row.candidate_state_root))}</div></div>`).join('')}</section></details>`;
    }
  } else if (activeInspectorTab === 'status') {
    body = summary + `<details class="inspector-details" open><summary>Runtime status <span>▾</span></summary><section class="inspector-section">${propertyRows([
      ['Adapter', state.status], ['Control', state.runtime.control_mode], ['Network', state.runtime.status], ['Network tick', state.runtime.tick], ['Behavior tick', state.inspector.properties.behavior_tick], ['Integration epoch', state.integration?.epoch_id], ['Integration entries', state.integration?.entry_count], ['Integration timeline root', state.integration?.timeline_root], ['Tick aligned', state.integration?.tick_aligned], ['Replay scope', state.replay?.scope], ['Replay status', state.replay?.status], ['Replay deterministic', state.replay?.deterministic], ['Replay active runtime unchanged', state.replay?.active_runtime_unchanged], ['Canonical state mutated', state.replay?.canonical_state_mutated], ['Server state root', state.runtime.server.state_root], ['RSR state root', state.runtime.state_root],
    ])}</section></details>${gapDetails}`;
  } else if (activeInspectorTab === 'authority') {
    const gate = state.commit_gate ?? {};
    body = summary + `<details class="inspector-details" open><summary>Authority boundary <span>▾</span></summary><section class="inspector-section">${propertyRows([
      ['Gate status', gate.status], ['Local commit ready', gate.local_candidate_commit_ready], ['Commit permitted', gate.commit_permitted], ['Production promotion', gate.production_promotion_permitted], ['Branch proposal root', gate.branch_proposal_root], ['Gate root', gate.gate_root],
    ])}</section><section class="inspector-section"><div class="inspector-section-title">Checks</div>${(gate.checks ?? []).map(check => `<div class="property-row"><span class="property-key">${esc(check.label)}</span><span class="property-value ${check.status === 'unavailable' || check.status === 'required' ? '' : 'is-root'}">${esc(statusText(check.status))}${check.root ? `<br>${esc(shortRoot(check.root))}` : ''}</span></div>`).join('')}</section></details>${gapDetails}`;
  } else if (activeInspectorTab === 'logs') {
    body = summary + `<details class="inspector-details" open><summary>Selected node events <span>▾</span></summary><section class="inspector-section">${(state.event_tail ?? []).filter(event => event.type.includes(selected.id.split('-')[0]) || event.type.includes(selected.id)).slice(-20).reverse().map(event => `<div class="console-card"><div class="console-card-head"><span>${esc(event.type)}</span><small>#${esc(event.sequence)}</small></div><div class="console-card-body">${esc(json(event.details))}<br>${esc(shortRoot(event.event_root))}</div></div>`).join('') || '<div class="empty-state">当前节点暂无匹配事件</div>'}</section></details>`;
  } else if (activeInspectorTab === 'evidence') {
    body = summary + evidenceDetails + gapDetails;
  }
  $('#inspectorContent').innerHTML = body;
  $$('.inspector-tab').forEach(tab => tab.classList.toggle('is-active', tab.dataset.inspectorTab === activeInspectorTab));
}

function eventLevel(event) {
  const type = String(event.type ?? '');
  if (type.includes('failed') || type.includes('error')) return 'error';
  if (type.includes('unavailable') || type.includes('rolled')) return 'warn';
  return 'info';
}

function eventSummary(event) {
  const details = event?.details ?? {};
  const scalarEntries = Object.entries(details).filter(([, value]) => value === null || ['string', 'number', 'boolean'].includes(typeof value));
  const simple = scalarEntries.filter(([key]) => !key.endsWith('_root') && !key.includes('hash')).slice(0, 3).map(([key, value]) => `${key}:${json(value)}`);
  const rootEntry = scalarEntries.find(([key]) => key.endsWith('_root') || key.includes('hash'));
  if (rootEntry) simple.push(`${rootEntry[0]}:${shortRoot(rootEntry[1])}`);
  return simple.join(' · ') || 'backend event';
}

function logRows(events) {
  if (!events?.length) return '<div class="empty-state">暂无后端事件</div>';
  return [...events].reverse().map(event => {
    const level = eventLevel(event);
    const time = String(event.time ?? '—').slice(11, 19);
    const module = String(event.type ?? 'event').split('.')[0];
    return `<div class="console-row" title="${esc(json(event.details))}"><span class="console-time">${esc(time)}</span><span class="console-level ${level}">${level.toUpperCase()}</span><span class="console-module">${esc(module)}</span><span class="console-message"><strong>${esc(event.type)}</strong><span>${esc(eventSummary(event))}</span></span></div>`;
  }).join('');
}

function issueCards(gaps) {
  return gaps?.length ? gaps.map(gap => `<div class="console-card"><div class="console-card-head"><span>${esc(gap.code)}</span><small>${esc(statusText(gap.status))}</small></div><div class="console-card-body">${esc(gap.detail)}</div></div>`).join('') : '<div class="empty-state">暂无后端报告的缺口</div>';
}

function performanceCards() {
  const metrics = state.runtime?.metrics ?? {};
  return Object.entries(metrics).map(([key, value]) => `<div class="console-card"><div class="console-card-head"><span>${esc(key)}</span><small>${typeof value === 'object' ? esc(statusText(value.status)) : 'runtime'}</small></div><div class="console-card-body">${esc(json(value))}</div></div>`).join('') || '<div class="empty-state">暂无 runtime metrics</div>';
}

function receiptCards() {
  const entries = state.evidence?.entries ?? [];
  return entries.map(entry => `<div class="console-card"><div class="console-card-head"><span>${esc(entry.entry_id)}</span><small>${esc(statusText(entry.status))}</small></div><div class="console-card-body">${esc(entry.kind)}<br>root ${esc(shortRoot(entry.root))}${entry.frame_root ? `<br>frame ${esc(shortRoot(entry.frame_root))}` : ''}</div></div>`).join('') || '<div class="empty-state">暂无 evidence entry</div>';
}

function renderConsole() {
  let content = '';
  const query = consoleQuery.trim().toLowerCase();
  const matches = value => !query || JSON.stringify(value ?? '').toLowerCase().includes(query);
  if (activeConsole === 'logs' || activeConsole === 'events') content = logRows((state.event_tail ?? []).filter(matches));
  else if (activeConsole === 'issues') content = issueCards((state.gaps ?? []).filter(matches));
  else if (activeConsole === 'performance') content = performanceCards();
  else if (activeConsole === 'receipts') content = receiptCards();
  $('#consoleContent').innerHTML = content;
  const search = $('#consoleSearch');
  if (search && search.value !== consoleQuery) search.value = consoleQuery;
  $$('.console-tabs .panel-tab').forEach(tab => tab.classList.toggle('is-active', tab.dataset.console === activeConsole));
}

function renderViewport() {
  const viewport = state.viewport ?? {};
  $('#studioShell')?.classList.toggle('viewport-expanded', viewportExpanded);
  const expandButton = $('#viewportExpandButton');
  if (expandButton) {
    expandButton.textContent = viewportExpanded ? '收起投影' : '展开投影';
    expandButton.setAttribute('aria-expanded', String(viewportExpanded));
  }
  const image = $('#viewportImage');
  const empty = $('#viewportEmpty');
  const hasImage = Boolean(viewportDataUrl);
  image.hidden = !hasImage;
  empty.hidden = hasImage;
  if (hasImage && image.src !== viewportDataUrl) image.src = viewportDataUrl;
  if (!hasImage) empty.textContent = viewport.available ? '等待真实 VSR 世界投影' : 'VSR World Projection unavailable';
  $('#viewportSource').textContent = viewport.frame_root ? `LIVE FRAME ${shortRoot(viewport.frame_root)}` : '等待真实世界投影';
  $('#viewportRoot').textContent = `viewport_root ${shortRoot(viewport.viewport_root)}`;
  $('#viewportState').textContent = `source_state_root ${shortRoot(viewport.source_state_root)}`;
  $('#viewportStatus').textContent = viewport.frame_verified ? 'VERIFIED' : 'UNAVAILABLE';
  $('#viewportStatus').className = viewport.frame_verified ? '' : 'text-warn';
  $('#viewportOverlay').textContent = viewport.frame_verified ? `VSR VERIFIED · tick ${state.runtime.tick ?? '—'} · ${viewport.asset_draw_count ?? '—'} asset draw(s)` : 'VSR WORLD PROJECTION UNAVAILABLE';
}

function renderCommitCard() {
  const gate = state.commit_gate ?? {};
  $('#commitGateStatus').textContent = statusText(gate.status).toUpperCase();
  const missing = (gate.checks ?? []).filter(check => ['required', 'unavailable'].includes(check.status)).map(check => check.label);
  $('#commitGateReason').textContent = gate.status === 'candidate-committed'
    ? '本地候选已记录；生产 world promotion unavailable。'
    : missing.length ? `等待：${missing.join('、')}。生产 world promotion unavailable。` : 'Commit Gate 已就绪，但仍需独立确认。';
  const button = $('#commitCard .commit-action');
  button.disabled = !(state.controls?.commit?.available);
  button.title = button.disabled ? '先提出并授权一个真实候选' : '明确提交当前本地候选';
  $('#commitCard').dataset.status = statusClass(gate.status);
}

function renderFooter() {
  const runtime = state.runtime ?? {};
  const dot = dotClass(runtime.status);
  $('#footerDot').className = `status-dot ${dot}`;
  $('#footerRuntime').textContent = `Game World Runtime: ${statusText(runtime.status)} · ${statusText(runtime.control_mode)}`;
  $('#footerTick').textContent = runtime.tick ?? '—';
  $('#footerStateRoot').textContent = shortRoot(runtime.state_root);
  $('#footerEvidenceRoot').textContent = shortRoot(state.evidence?.ledger_root);
  $('#footerVersion').textContent = `Adapter ${state.version ?? '—'}`;
}

function syncControls() {
  const available = Boolean(state?.runtime?.status === 'healthy');
  $$('[data-requires-runtime]').forEach(button => { button.disabled = !available; });
  const candidate = state?.candidate_reality ?? {};
  const authorize = $('[data-command="candidate-authorize"]');
  if (authorize) authorize.disabled = !available || candidate.phase !== 'simulated';
  const commit = $('[data-command="candidate-commit"]');
  if (commit) commit.disabled = !Boolean(state?.controls?.commit?.available);
  const replay = $('[data-command="replay"]');
  if (replay) {
    replay.disabled = !Boolean(state?.controls?.replay?.available);
    replay.title = state?.controls?.replay?.reason ?? '在隔离运行时重放当前 Behavior + Network integration epoch';
  }
  $$('[data-unavailable]').forEach(button => { button.disabled = true; });
}

function handleNodeSelection(nodeId) {
  return sendCommand('select', { node_id: nodeId });
}

document.addEventListener('click', event => {
  const unavailable = event.target.closest('[data-unavailable]');
  if (unavailable) { event.preventDefault(); notify(unavailable.title || '该能力当前 unavailable。'); return; }
  const action = event.target.closest('[data-action]');
  if (action) {
    const name = action.dataset.action;
    if (name === 'new-session') { createSession(); return; }
    if (name === 'toggle-viewport') { viewportExpanded = !viewportExpanded; renderViewport(); return; }
    if (name === 'focus-graph') { graphZoom = 1; applyGraphView(); notify('Game World Graph 已适配；当前操作只改变 Product Body 投影视图。'); return; }
    if (name === 'zoom-in') { graphZoom = Math.min(1.35, Number((graphZoom + .1).toFixed(2))); applyGraphView(); return; }
    if (name === 'zoom-out') { graphZoom = Math.max(.8, Number((graphZoom - .1).toFixed(2))); applyGraphView(); return; }
    if (name === 'toggle-grid') { graphGridVisible = !graphGridVisible; applyGraphView(); notify(graphGridVisible ? '已显示 Reality Graph 投影网格。' : '已隐藏 Reality Graph 投影网格。'); return; }
  }
  const consoleTab = event.target.closest('[data-console]');
  if (consoleTab) { activeConsole = consoleTab.dataset.console; renderConsole(); return; }
  const inspectorTab = event.target.closest('[data-inspector-tab]');
  if (inspectorTab) { activeInspectorTab = inspectorTab.dataset.inspectorTab; renderInspector(); return; }
  const node = event.target.closest('[data-node]');
  if (node) { event.preventDefault(); handleNodeSelection(node.dataset.node); return; }
  const commandButton = event.target.closest('[data-command]');
  if (!commandButton || commandButton.disabled) return;
  const command = commandButton.dataset.command;
  if (command === 'refresh') { inspectSession(); return; }
  if (command === 'focus') { notify('图布局由 Adapter 提供；当前未接入独立镜头状态。'); return; }
  if (command === 'viewport') { refreshViewportImage(); return; }
  if (command === 'run') { sendCommand('run', { ticks: 6 }); return; }
  if (command === 'candidate-commit') { sendCommand('candidate-commit', { confirmed: true }); return; }
  sendCommand(command);
});

document.addEventListener('input', event => {
  if (event.target?.id !== 'consoleSearch') return;
  consoleQuery = event.target.value ?? '';
  renderConsole();
});

window.addEventListener('error', event => notify(`页面错误：${event.message}`, true));
window.addEventListener('unhandledrejection', event => notify(`请求错误：${event.reason?.message ?? event.reason}`, true));
window.addEventListener('resize', applyGraphView);

createSession();
