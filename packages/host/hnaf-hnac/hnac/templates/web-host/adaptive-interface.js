const supportedVersions = new Set(['0.6','0.7']);
const NODE_KINDS = new Set(['action', 'information', 'navigation', 'document', 'media', 'spatial', 'group']);
const PRIORITY_ORDER = { critical: 0, primary: 1, secondary: 2, supporting: 3, low: 4 };

export class AdaptiveInterfaceError extends Error {}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])]));
  }
  return value;
}

function canonicalJson(value) {
  return new TextEncoder().encode(JSON.stringify(sortObject(value)));
}

function hex(buffer) {
  return [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function sha256(data) {
  return hex(await crypto.subtle.digest('SHA-256', data));
}

function compareId(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function priority(node) {
  return PRIORITY_ORDER[node?.priority ?? 'secondary'] ?? 9;
}

export function validateAdaptiveGraph(graph) {
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) throw new AdaptiveInterfaceError('AIP graph must be an object');
  if (!supportedVersions.has(graph.version)) throw new AdaptiveInterfaceError(`Unsupported AIP version: ${graph.version}`);
  if (typeof graph.id !== 'string' || !graph.id) throw new AdaptiveInterfaceError('AIP graph requires id');
  if (typeof graph.root !== 'string' || !graph.root) throw new AdaptiveInterfaceError('AIP graph requires root');
  if (!graph.nodes || typeof graph.nodes !== 'object' || Array.isArray(graph.nodes)) throw new AdaptiveInterfaceError('AIP graph requires node map');
  if (!graph.intents || typeof graph.intents !== 'object' || Array.isArray(graph.intents)) throw new AdaptiveInterfaceError('AIP graph requires intent map');
  if (!Object.hasOwn(graph.nodes, graph.root)) throw new AdaptiveInterfaceError(`AIP root does not exist: ${graph.root}`);
  for (const [nodeId, node] of Object.entries(graph.nodes)) {
    if (!node || typeof node !== 'object') throw new AdaptiveInterfaceError(`Invalid AIP node: ${nodeId}`);
    if (!NODE_KINDS.has(node.kind)) throw new AdaptiveInterfaceError(`Unsupported AIP node kind at ${nodeId}: ${node.kind}`);
    if (typeof node.label !== 'string' || !node.label) throw new AdaptiveInterfaceError(`AIP node requires label: ${nodeId}`);
    for (const child of node.children ?? []) if (!Object.hasOwn(graph.nodes, child)) throw new AdaptiveInterfaceError(`AIP child does not exist: ${nodeId} -> ${child}`);
    if (node.intent && !Object.hasOwn(graph.intents, node.intent)) throw new AdaptiveInterfaceError(`AIP node references unknown intent: ${nodeId} -> ${node.intent}`);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(nodeId) {
    if (visited.has(nodeId)) return;
    if (visiting.has(nodeId)) throw new AdaptiveInterfaceError(`AIP graph contains a cycle at ${nodeId}`);
    visiting.add(nodeId);
    for (const child of graph.nodes[nodeId].children ?? []) visit(child);
    visiting.delete(nodeId);
    visited.add(nodeId);
  }
  visit(graph.root);
  for (const nodeId of Object.keys(graph.nodes).sort(compareId)) visit(nodeId);
  return graph;
}

export function selectProjectionProfile(host) {
  const resources = host.resources ?? {};
  const policies = host.policies ?? {};
  const modes = new Set((host.interaction_modes ?? []).map((mode) => String(mode).toLowerCase()));
  const family = String(host.family ?? '').toLowerCase();
  if (Boolean(resources.spatial) || ['xr', 'spatial'].includes(family)) return 'spatial';
  if (Boolean(policies.accessibility_mode) || Boolean(resources.screen_reader) || modes.has('screen-reader')) return 'accessibility';
  const width = Number(resources.viewport_width ?? resources.width ?? 0) || 0;
  if (['mobile', 'phone', 'android', 'ios'].includes(family)) return width >= 700 ? 'tablet' : 'phone';
  if (['tablet', 'ipad'].includes(family)) return 'tablet';
  if (family === 'web' && width && width < 700) return 'phone';
  if (family === 'web' && width && width < 1100) return 'tablet';
  return 'desktop';
}

function visible(node, profile, host) {
  const rule = node.visibility ?? {};
  if (Array.isArray(rule.profiles) && rule.profiles.length && !rule.profiles.includes(profile)) return false;
  if (Array.isArray(rule.exclude_profiles) && rule.exclude_profiles.includes(profile)) return false;
  const modes = host.interaction_modes ?? [];
  if (Array.isArray(rule.interaction_modes) && rule.interaction_modes.length && !rule.interaction_modes.some((mode) => modes.includes(mode))) return false;
  const width = Number(host.resources?.viewport_width ?? host.resources?.width ?? 0) || 0;
  if (rule.min_width !== undefined && width && width < Number(rule.min_width)) return false;
  if (rule.max_width !== undefined && width && width > Number(rule.max_width)) return false;
  return true;
}

function walkOrder(graph, visibleIds) {
  const ordered = [];
  const seen = new Set();
  function visit(nodeId) {
    if (seen.has(nodeId) || !visibleIds.has(nodeId)) return;
    seen.add(nodeId);
    ordered.push(nodeId);
    const children = (graph.nodes[nodeId].children ?? []).filter((child) => visibleIds.has(child));
    children.sort((left, right) => priority(graph.nodes[left]) - priority(graph.nodes[right]) || compareId(left, right));
    for (const child of children) visit(child);
  }
  visit(graph.root);
  const remaining = [...visibleIds].sort((left, right) => priority(graph.nodes[left]) - priority(graph.nodes[right]) || compareId(left, right));
  for (const nodeId of remaining) visit(nodeId);
  return ordered;
}

function affordance(kind, profile) {
  const table = {
    action: { phone: 'full-width-action', tablet: 'touch-action', desktop: 'button', accessibility: 'command', spatial: 'spatial-control' },
    information: { phone: 'stacked-card', tablet: 'card', desktop: 'panel', accessibility: 'reading-block', spatial: 'world-label' },
    navigation: { phone: 'bottom-navigation', tablet: 'rail-navigation', desktop: 'sidebar-navigation', accessibility: 'landmark', spatial: 'portal' },
    document: { phone: 'single-column-document', tablet: 'document', desktop: 'document-pane', accessibility: 'linear-document', spatial: 'document-surface' },
    media: { phone: 'responsive-media', tablet: 'media-card', desktop: 'media-panel', accessibility: 'described-media', spatial: 'immersive-media' },
    spatial: { phone: 'spatial-fallback-card', tablet: 'spatial-preview', desktop: 'spatial-preview', accessibility: 'spatial-description', spatial: 'spatial-anchor' },
    group: { phone: 'stack', tablet: 'grid', desktop: 'region', accessibility: 'group', spatial: 'cluster' },
  };
  return table[kind][profile];
}

function layout(profile, graph) {
  const defaults = {
    phone: { mode: 'single-column', columns: 1, navigation: 'bottom', density: 'comfortable' },
    tablet: { mode: 'adaptive-grid', columns: 2, navigation: 'rail', density: 'comfortable' },
    desktop: { mode: 'multi-pane', columns: 3, navigation: 'sidebar', density: 'compact' },
    accessibility: { mode: 'linear', columns: 1, navigation: 'landmarks', density: 'spacious' },
    spatial: { mode: 'spatial-field', columns: 0, navigation: 'portals', density: 'world-scale' },
  };
  return { ...defaults[profile], ...(graph.projections?.[profile] ?? {}) };
}

function normalizeBinding(node) {
  if (node.binding === undefined) return null;
  if (typeof node.binding === 'string') return { path: node.binding };
  return { ...node.binding };
}

export async function compileAdaptiveInterface(graphValue, host) {
  const graph = validateAdaptiveGraph(graphValue);
  const profile = selectProjectionProfile(host);
  const visibleIds = new Set(Object.entries(graph.nodes).filter(([, node]) => visible(node, profile, host)).map(([nodeId]) => nodeId));
  if (!visibleIds.has(graph.root)) throw new AdaptiveInterfaceError(`AIP root is hidden for projection profile ${profile}`);
  const order = walkOrder(graph, visibleIds);
  const nodes = order.map((nodeId, index) => {
    const source = graph.nodes[nodeId];
    const node = {
      id: nodeId,
      kind: source.kind,
      label: source.label ?? nodeId,
      description: source.description,
      priority: source.priority ?? 'secondary',
      order: index,
      affordance: affordance(source.kind, profile),
      children: (source.children ?? []).filter((child) => visibleIds.has(child)),
    };
    for (const key of ['intent', 'media', 'spatial', 'document', 'navigation', 'style', 'fallback']) if (source[key] !== undefined) node[key] = source[key];
    const binding = normalizeBinding(source);
    if (binding !== null) node.binding = binding;
    return Object.fromEntries(Object.entries(node).filter(([, value]) => value !== undefined && value !== null));
  });
  const modes = host.interaction_modes ?? [];
  const intents = Object.entries(graph.intents).sort(([left], [right]) => compareId(left, right)).map(([intentId, intent]) => {
    const triggers = Object.fromEntries(Object.entries(intent.triggers ?? {}).sort(([left], [right]) => compareId(left, right)).filter(([mode]) => modes.includes(mode)).map(([mode, values]) => [mode, [...values]]));
    const result = {
      id: intentId,
      label: intent.label ?? intentId,
      risk: intent.risk ?? 'low',
      confirmation: Boolean(intent.confirmation),
      triggers,
      input_schema: intent.input_schema,
      goal: intent.goal,
      execution: intent.execution,
      authority: intent.authority,
    };
    return Object.fromEntries(Object.entries(result).filter(([, value]) => value !== undefined && value !== null));
  });
  const plan = {
    version: `hnaf.adaptive-interface-plan.v${graph.version}`,
    graph_id: graph.id ?? 'main',
    graph_version: graph.version,
    profile,
    host: { id: host.id, family: host.family },
    root: graph.root,
    layout: layout(profile, graph),
    interaction_modes: [...modes].sort(compareId),
    nodes,
    intents,
  };
  plan.semantic_snapshot = await sha256(canonicalJson(plan));
  return plan;
}

export function routeAdaptiveEvent(graphValue, host, eventValue) {
  const graph = validateAdaptiveGraph(graphValue);
  const mode = String(eventValue?.mode ?? '').trim().toLowerCase();
  const signal = String(eventValue?.signal ?? '').trim();
  if (!mode || !signal) throw new AdaptiveInterfaceError('Interface event requires non-empty mode and signal');
  const value = eventValue.value === undefined || eventValue.value === null ? null : String(eventValue.value);
  const target = eventValue.target === undefined || eventValue.target === null ? null : String(eventValue.target);
  const supportedModes = host.interaction_modes ?? [];
  if (!supportedModes.includes(mode)) return { status: 'unsupported-mode', mode, supported_modes: [...supportedModes].sort(compareId) };
  const candidates = [];
  if (target) {
    const node = graph.nodes[target];
    if (node?.intent) candidates.push({ intent: node.intent, source: 'target', target });
  }
  const probes = new Set([signal.toLocaleLowerCase()]);
  if (value !== null) probes.add(value.trim().toLocaleLowerCase());
  for (const [intentId, intent] of Object.entries(graph.intents).sort(([left], [right]) => compareId(left, right))) {
    for (const trigger of intent.triggers?.[mode] ?? []) {
      if (probes.has(String(trigger).trim().toLocaleLowerCase())) {
        candidates.push({ intent: intentId, source: 'trigger', trigger });
        break;
      }
    }
  }
  const unique = new Map(candidates.map((candidate) => [candidate.intent, candidate]));
  if (!unique.size) return { status: 'unresolved', mode, signal, value, target };
  if (unique.size > 1) return { status: 'ambiguous', mode, candidates: [...unique.keys()].sort(compareId) };
  const [intentId, match] = unique.entries().next().value;
  const intent = graph.intents[intentId];
  return {
    status: 'resolved', intent: intentId, label: intent.label ?? intentId, risk: intent.risk ?? 'low',
    confirmation_required: Boolean(intent.confirmation), mode, match, payload: value,
  };
}

function readPath(context, path) {
  let cursor = context;
  for (const part of String(path).split('.')) {
    if (cursor === null || cursor === undefined || typeof cursor !== 'object' || !Object.hasOwn(cursor, part)) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function textValue(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

export function renderAdaptiveInterface(container, graph, plan, context = {}, onIntent = () => {}) {
  container.replaceChildren();
  container.dataset.profile = plan.profile;
  container.className = `projection projection-${plan.profile}`;
  container.style.setProperty('--projection-columns', String(Math.max(1, plan.layout.columns || 1)));
  for (const node of plan.nodes) {
    const article = document.createElement(node.kind === 'navigation' ? 'nav' : 'article');
    article.className = `semantic-node kind-${node.kind} affordance-${node.affordance}`;
    article.dataset.node = node.id;
    article.dataset.kind = node.kind;
    article.setAttribute('aria-label', node.label);

    const heading = document.createElement(node.kind === 'document' ? 'h2' : 'h3');
    heading.textContent = node.label;
    article.append(heading);
    if (node.description) {
      const description = document.createElement('p');
      description.className = 'node-description';
      description.textContent = node.description;
      article.append(description);
    }
    if (node.binding) {
      const bound = readPath(context, node.binding.path);
      const value = bound === undefined ? node.binding.fallback : bound;
      const output = document.createElement('output');
      output.className = 'bound-value';
      output.textContent = textValue(value);
      output.dataset.binding = node.binding.path;
      article.append(output);
    }
    if (node.kind === 'action' && node.intent) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'intent-action';
      button.textContent = node.label;
      button.dataset.intent = node.intent;
      button.addEventListener('click', (domEvent) => onIntent({
        intent: node.intent,
        node,
        route: routeAdaptiveEvent(graph, { ...plan.host, interaction_modes: plan.interaction_modes, resources: {}, policies: {} }, { mode: 'pointer', signal: 'activate', target: node.id }),
        domEvent,
      }));
      article.append(button);
    }
    if (node.kind === 'media') {
      const media = document.createElement('div');
      media.className = 'media-placeholder';
      media.setAttribute('role', 'img');
      media.setAttribute('aria-label', node.media?.alt ?? node.label);
      media.textContent = node.media?.alt ?? '媒体内容';
      article.append(media);
    }
    if (node.kind === 'spatial') {
      const spatial = document.createElement('div');
      spatial.className = 'spatial-placeholder';
      spatial.textContent = plan.profile === 'spatial' ? `空间锚点：${node.spatial?.anchor ?? node.id}` : `空间内容回退：${node.spatial?.anchor ?? node.id}`;
      article.append(spatial);
    }
    const meta = document.createElement('small');
    meta.className = 'node-meta';
    meta.textContent = `${node.kind} · ${node.affordance} · ${node.priority}`;
    article.append(meta);
    container.append(article);
  }
}
