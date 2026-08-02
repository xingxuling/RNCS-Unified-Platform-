import { canonicalClone, compareUtf8, isSha256, semanticHash } from './canonical.mjs';
import { WorldBodyValidationError, diagnostic } from './errors.mjs';

export const WORLD_BODY_RENDER_GRAPH_FORMAT = 'taowind.world-body-render-graph.v0.1';

const QUEUES = new Set(['graphics', 'compute', 'copy']);
const RESOURCE_KINDS = new Set(['buffer', 'texture', 'attachment', 'swapchain']);
const LIFETIMES = new Set(['transient', 'persistent', 'external']);
const READ_ACCESS = new Set(['sampled', 'uniform', 'storage-read', 'copy-source', 'vertex', 'index', 'indirect', 'present']);
const WRITE_ACCESS = new Set(['color-attachment', 'depth-attachment', 'storage-write', 'copy-destination']);
const MAX_RESOURCES = 4096;
const MAX_PASSES = 1024;
const MAX_DEPENDENCIES = 8192;
const MAX_ACCESSES = 4096;

function idCompare(left, right) {
  return compareUtf8(left, right);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/.test(value) && !value.includes('..');
}

function uniqueById(items, path, errors) {
  const map = new Map();
  if (!Array.isArray(items)) {
    errors.push(diagnostic('WBIR_GRAPH_ARRAY_REQUIRED', path, 'expected an array'));
    return map;
  }
  items.forEach((item, index) => {
    if (!isRecord(item) || !validId(item.id)) {
      errors.push(diagnostic('WBIR_GRAPH_ID_REQUIRED', `${path}/${index}/id`, 'a safe non-traversing id is required'));
      return;
    }
    if (map.has(item.id)) {
      errors.push(diagnostic('WBIR_GRAPH_ID_DUPLICATE', `${path}/${index}/id`, `duplicate id ${item.id}`));
      return;
    }
    map.set(item.id, item);
  });
  return map;
}

function topological(passMap, errors) {
  const indegree = new Map([...passMap.keys()].map(id => [id, 0]));
  const outgoing = new Map([...passMap.keys()].map(id => [id, []]));
  for (const [id, pass] of passMap) {
    const dependencies = Array.isArray(pass.dependsOn) ? pass.dependsOn : [];
    if (!Array.isArray(pass.dependsOn)) errors.push(diagnostic('WBIR_GRAPH_DEPENDENCIES_REQUIRED', `/passes/${id}/dependsOn`, 'dependsOn must be an array'));
    const seen = new Set();
    dependencies.forEach((dependency, index) => {
      if (seen.has(dependency)) {
        errors.push(diagnostic('WBIR_GRAPH_DEPENDENCY_DUPLICATE', `/passes/${id}/dependsOn/${index}`, `duplicate dependency ${dependency}`));
        return;
      }
      seen.add(dependency);
      if (!passMap.has(dependency)) {
        errors.push(diagnostic('WBIR_GRAPH_DEPENDENCY_MISSING', `/passes/${id}/dependsOn/${index}`, `unknown pass ${dependency}`));
        return;
      }
      if (dependency === id) {
        errors.push(diagnostic('WBIR_GRAPH_SELF_DEPENDENCY', `/passes/${id}/dependsOn/${index}`, 'pass cannot depend on itself'));
        return;
      }
      indegree.set(id, indegree.get(id) + 1);
      outgoing.get(dependency).push(id);
    });
  }
  const ready = [...indegree].filter(([, degree]) => degree === 0).map(([id]) => id).sort(idCompare);
  const order = [];
  while (ready.length > 0) {
    const id = ready.shift();
    order.push(id);
    for (const next of outgoing.get(id).sort(idCompare)) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) {
        ready.push(next);
        ready.sort(idCompare);
      }
    }
  }
  if (order.length !== passMap.size) {
    const cycleMembers = [...indegree].filter(([, degree]) => degree > 0).map(([id]) => id).sort(idCompare);
    errors.push(diagnostic('WBIR_GRAPH_CYCLE', '/passes', 'render graph contains a dependency cycle', { passIds: cycleMembers }));
  }
  return { order, outgoing };
}

function reachability(order, outgoing) {
  const cache = new Map();
  const visit = id => {
    if (cache.has(id)) return cache.get(id);
    const reached = new Set();
    for (const next of outgoing.get(id) ?? []) {
      reached.add(next);
      for (const nested of visit(next)) reached.add(nested);
    }
    cache.set(id, reached);
    return reached;
  };
  for (const id of [...order].reverse()) visit(id);
  return (before, after) => before !== after && (cache.get(before)?.has(after) ?? false);
}

function accessList(pass, direction, path, resources, errors) {
  const list = pass[direction] ?? [];
  if (!Array.isArray(list)) {
    errors.push(diagnostic('WBIR_GRAPH_ACCESS_ARRAY_REQUIRED', path, 'expected an array'));
    return [];
  }
  const allowed = direction === 'reads' ? READ_ACCESS : WRITE_ACCESS;
  const seen = new Set();
  return list.flatMap((entry, index) => {
    if (!isRecord(entry) || typeof entry.resourceId !== 'string' || typeof entry.access !== 'string') {
      errors.push(diagnostic('WBIR_GRAPH_ACCESS_INVALID', `${path}/${index}`, 'resourceId and access are required'));
      return [];
    }
    const key = `${entry.resourceId}:${entry.access}`;
    if (seen.has(key)) {
      errors.push(diagnostic('WBIR_GRAPH_ACCESS_DUPLICATE', `${path}/${index}`, `duplicate access ${key}`));
      return [];
    }
    seen.add(key);
    if (!resources.has(entry.resourceId)) {
      errors.push(diagnostic('WBIR_GRAPH_RESOURCE_MISSING', `${path}/${index}/resourceId`, `unknown resource ${entry.resourceId}`));
    }
    if (!allowed.has(entry.access)) {
      errors.push(diagnostic('WBIR_GRAPH_ACCESS_KIND_INVALID', `${path}/${index}/access`, `invalid ${direction} access ${entry.access}`));
    }
    return [{ resourceId: entry.resourceId, access: entry.access }];
  });
}

function barrierKey(barrier) {
  return [
    barrier.resourceId,
    barrier.fromPassId,
    barrier.toPassId,
    barrier.fromAccess,
    barrier.toAccess,
    barrier.fromQueue,
    barrier.toQueue,
  ].join('|');
}

function analyze(graph) {
  const errors = [];
  if (!isRecord(graph)) {
    return { errors: [diagnostic('WBIR_GRAPH_OBJECT_REQUIRED', '', 'render graph must be an object')], order: [], expectedBarriers: [] };
  }
  if (graph.format !== WORLD_BODY_RENDER_GRAPH_FORMAT) {
    errors.push(diagnostic('WBIR_GRAPH_FORMAT_INVALID', '/format', `expected ${WORLD_BODY_RENDER_GRAPH_FORMAT}`));
  }
  if (!validId(graph.id)) {
    errors.push(diagnostic('WBIR_GRAPH_ID_REQUIRED', '/id', 'a safe graph id is required'));
  }

  const resourceMap = uniqueById(graph.resources, '/resources', errors);
  const passMap = uniqueById(graph.passes, '/passes', errors);
  if (resourceMap.size > MAX_RESOURCES) errors.push(diagnostic('WBIR_GRAPH_RESOURCE_LIMIT', '/resources', `resource count exceeds ${MAX_RESOURCES}`));
  if (passMap.size > MAX_PASSES) errors.push(diagnostic('WBIR_GRAPH_PASS_LIMIT', '/passes', `pass count exceeds ${MAX_PASSES}`));
  const dependencyCount = [...passMap.values()].reduce((count, pass) => count + (Array.isArray(pass.dependsOn) ? pass.dependsOn.length : 0), 0);
  const accessCount = [...passMap.values()].reduce((count, pass) => count
    + (Array.isArray(pass.reads) ? pass.reads.length : 0)
    + (Array.isArray(pass.writes) ? pass.writes.length : 0), 0);
  if (dependencyCount > MAX_DEPENDENCIES) errors.push(diagnostic('WBIR_GRAPH_DEPENDENCY_LIMIT', '/passes', `dependency count exceeds ${MAX_DEPENDENCIES}`));
  if (accessCount > MAX_ACCESSES) errors.push(diagnostic('WBIR_GRAPH_ACCESS_LIMIT', '/passes', `resource access count exceeds ${MAX_ACCESSES}`));
  if (resourceMap.size > MAX_RESOURCES || passMap.size > MAX_PASSES || dependencyCount > MAX_DEPENDENCIES || accessCount > MAX_ACCESSES) {
    return { errors, order: [], expectedBarriers: [] };
  }
  for (const [id, resource] of resourceMap) {
    if (!RESOURCE_KINDS.has(resource.kind)) {
      errors.push(diagnostic('WBIR_GRAPH_RESOURCE_KIND_INVALID', `/resources/${id}/kind`, `invalid resource kind ${resource.kind}`));
    }
    if (!LIFETIMES.has(resource.lifetime)) {
      errors.push(diagnostic('WBIR_GRAPH_LIFETIME_INVALID', `/resources/${id}/lifetime`, `invalid lifetime ${resource.lifetime}`));
    }
    if (resource.lifetime === 'external' && resource.imported !== true) {
      errors.push(diagnostic('WBIR_GRAPH_EXTERNAL_NOT_IMPORTED', `/resources/${id}/imported`, 'external resources must be imported'));
    }
    if (resource.lifetime === 'transient' && (resource.imported === true || resource.exported === true)) {
      errors.push(diagnostic('WBIR_GRAPH_TRANSIENT_ESCAPE', `/resources/${id}`, 'transient resources cannot be imported or exported'));
    }
    if (resource.aliasGroup !== undefined && !validId(resource.aliasGroup)) {
      errors.push(diagnostic('WBIR_GRAPH_ALIAS_GROUP_INVALID', `/resources/${id}/aliasGroup`, 'aliasGroup must be a safe id'));
    }
    if (resource.aliasGroup !== undefined && resource.lifetime !== 'transient') {
      errors.push(diagnostic('WBIR_GRAPH_ALIAS_NON_TRANSIENT', `/resources/${id}/aliasGroup`, 'only transient resources may alias'));
    }
    if (typeof resource.imported !== 'boolean' || typeof resource.exported !== 'boolean') {
      errors.push(diagnostic('WBIR_GRAPH_RESOURCE_FLAGS_INVALID', `/resources/${id}`, 'imported and exported must be booleans'));
    }
    if (resource.format !== undefined && (typeof resource.format !== 'string' || resource.format.length === 0)) {
      errors.push(diagnostic('WBIR_GRAPH_RESOURCE_FORMAT_INVALID', `/resources/${id}/format`, 'format must be a non-empty string when declared'));
    }
  }

  const accesses = new Map([...resourceMap.keys()].map(id => [id, []]));
  for (const [id, pass] of passMap) {
    if (typeof pass.kind !== 'string' || pass.kind.length === 0) {
      errors.push(diagnostic('WBIR_GRAPH_PASS_KIND_INVALID', `/passes/${id}/kind`, 'pass kind must be a non-empty string'));
    }
    if (!QUEUES.has(pass.queue)) {
      errors.push(diagnostic('WBIR_GRAPH_QUEUE_INVALID', `/passes/${id}/queue`, `invalid queue ${pass.queue}`));
    }
    const reads = accessList(pass, 'reads', `/passes/${id}/reads`, resourceMap, errors);
    const writes = accessList(pass, 'writes', `/passes/${id}/writes`, resourceMap, errors);
    const readIds = new Set(reads.map(entry => entry.resourceId));
    for (const write of writes) {
      if (readIds.has(write.resourceId)) {
        errors.push(diagnostic('WBIR_GRAPH_SAME_PASS_READ_WRITE', `/passes/${id}`, `resource ${write.resourceId} is both read and written in one pass; declare separate phases`));
      }
    }
    reads.forEach(entry => accesses.get(entry.resourceId)?.push({ passId: id, queue: pass.queue, mode: 'read', access: entry.access }));
    writes.forEach(entry => accesses.get(entry.resourceId)?.push({ passId: id, queue: pass.queue, mode: 'write', access: entry.access }));
  }

  const { order, outgoing } = topological(passMap, errors);
  if (order.length !== passMap.size) return { errors, order, expectedBarriers: [] };
  const index = new Map(order.map((id, position) => [id, position]));
  const before = reachability(order, outgoing);
  const expected = new Map();

  for (const [resourceId, rawUses] of accesses) {
    const uses = rawUses.sort((left, right) => index.get(left.passId) - index.get(right.passId) || idCompare(left.access, right.access));
    const resource = resourceMap.get(resourceId);
    const writers = uses.filter(use => use.mode === 'write');
    for (const use of uses) {
      if (use.mode !== 'read') continue;
      const initialized = resource?.imported === true || writers.some(writer => before(writer.passId, use.passId));
      if (!initialized) {
        errors.push(diagnostic('WBIR_GRAPH_READ_BEFORE_WRITE', `/passes/${use.passId}/reads`, `resource ${resourceId} is read before an ordered writer or import`));
      }
    }
    for (let leftIndex = 0; leftIndex < uses.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < uses.length; rightIndex += 1) {
        const left = uses[leftIndex];
        const right = uses[rightIndex];
        if (left.mode === 'read' && right.mode === 'read') continue;
        let from = left;
        let to = right;
        if (!before(left.passId, right.passId)) {
          if (before(right.passId, left.passId)) {
            from = right;
            to = left;
          } else {
            errors.push(diagnostic(
              'WBIR_GRAPH_UNORDERED_HAZARD',
              '/passes',
              `resource ${resourceId} has unordered ${left.mode}/${right.mode} access`,
              { passIds: [left.passId, right.passId] },
            ));
            continue;
          }
        }
        const barrier = {
          resourceId,
          fromPassId: from.passId,
          toPassId: to.passId,
          fromAccess: from.access,
          toAccess: to.access,
          fromQueue: from.queue,
          toQueue: to.queue,
        };
        expected.set(barrierKey(barrier), barrier);
      }
    }
  }

  const aliasGroups = new Map();
  for (const resource of resourceMap.values()) {
    if (!resource.aliasGroup) continue;
    const group = aliasGroups.get(resource.aliasGroup) ?? [];
    group.push(resource.id);
    aliasGroups.set(resource.aliasGroup, group);
  }
  for (const [aliasGroup, resourceIds] of aliasGroups) {
    for (let leftIndex = 0; leftIndex < resourceIds.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < resourceIds.length; rightIndex += 1) {
        const leftUses = accesses.get(resourceIds[leftIndex]) ?? [];
        const rightUses = accesses.get(resourceIds[rightIndex]) ?? [];
        if (leftUses.length === 0 || rightUses.length === 0) continue;
        const leftBeforeRight = leftUses.every(left => rightUses.every(right => before(left.passId, right.passId)));
        const rightBeforeLeft = rightUses.every(right => leftUses.every(left => before(right.passId, left.passId)));
        if (!leftBeforeRight && !rightBeforeLeft) {
          errors.push(diagnostic(
            'WBIR_GRAPH_ALIAS_LIFETIME_OVERLAP',
            '/resources',
            `alias group ${aliasGroup} has overlapping or unordered lifetimes`,
            { resourceIds: [resourceIds[leftIndex], resourceIds[rightIndex]] },
          ));
        }
      }
    }
  }

  return { errors, order, expectedBarriers: [...expected.values()].sort((left, right) => compareUtf8(barrierKey(left), barrierKey(right))) };
}

export function deriveRenderGraphBarriers(graph) {
  const analysis = analyze(graph);
  if (analysis.errors.length > 0) {
    const first = analysis.errors[0];
    throw new WorldBodyValidationError(first.code, first.path, first.message, first.details);
  }
  return canonicalClone(analysis.expectedBarriers);
}

export function validateRenderGraph(graph, options = {}) {
  const analysis = analyze(graph);
  const errors = [...analysis.errors];
  if (errors.length === 0 && options.requireBarriers !== false) {
    const actual = Array.isArray(graph.barriers) ? graph.barriers : [];
    const actualKeys = new Set();
    actual.forEach((barrier, index) => {
      if (!isRecord(barrier)) {
        errors.push(diagnostic('WBIR_GRAPH_BARRIER_INVALID', `/barriers/${index}`, 'barrier must be an object'));
        return;
      }
      const key = barrierKey(barrier);
      if (actualKeys.has(key)) errors.push(diagnostic('WBIR_GRAPH_BARRIER_DUPLICATE', `/barriers/${index}`, 'duplicate barrier'));
      actualKeys.add(key);
    });
    const expectedKeys = new Set(analysis.expectedBarriers.map(barrierKey));
    for (const barrier of analysis.expectedBarriers) {
      if (!actualKeys.has(barrierKey(barrier))) {
        errors.push(diagnostic('WBIR_GRAPH_BARRIER_MISSING', '/barriers', `missing barrier ${barrierKey(barrier)}`));
      }
    }
    for (const [index, barrier] of actual.entries()) {
      if (isRecord(barrier) && !expectedKeys.has(barrierKey(barrier))) {
        errors.push(diagnostic('WBIR_GRAPH_BARRIER_UNJUSTIFIED', `/barriers/${index}`, `unjustified barrier ${barrierKey(barrier)}`));
      }
    }
  }
  if (graph?.graphRoot !== undefined) {
    const { graphRoot, ...base } = graph;
    if (!isSha256(graphRoot) || semanticHash(base) !== graphRoot) {
      errors.push(diagnostic('WBIR_GRAPH_ROOT_MISMATCH', '/graphRoot', 'graphRoot does not match canonical graph content'));
    }
  }
  return { ok: errors.length === 0, errors, order: analysis.order, expectedBarriers: analysis.expectedBarriers };
}

export function sealRenderGraph(input) {
  const normalized = canonicalClone({
    ...input,
    format: WORLD_BODY_RENDER_GRAPH_FORMAT,
    resources: [...(input.resources ?? [])].sort((left, right) => idCompare(left.id, right.id)),
    passes: [...(input.passes ?? [])]
      .map(pass => ({
        ...pass,
        dependsOn: Array.isArray(pass.dependsOn) ? [...pass.dependsOn].sort(idCompare) : pass.dependsOn,
        reads: Array.isArray(pass.reads) ? [...pass.reads].sort((left, right) => compareUtf8(`${left.resourceId}:${left.access}`, `${right.resourceId}:${right.access}`)) : pass.reads,
        writes: Array.isArray(pass.writes) ? [...pass.writes].sort((left, right) => compareUtf8(`${left.resourceId}:${left.access}`, `${right.resourceId}:${right.access}`)) : pass.writes,
      }))
      .sort((left, right) => idCompare(left.id, right.id)),
  });
  delete normalized.graphRoot;
  delete normalized.barriers;
  const base = canonicalClone({
    ...normalized,
    barriers: deriveRenderGraphBarriers(normalized),
  });
  delete base.graphRoot;
  const graph = { ...base, graphRoot: semanticHash(base) };
  const verification = validateRenderGraph(graph);
  if (!verification.ok) {
    const first = verification.errors[0];
    throw new WorldBodyValidationError(first.code, first.path, first.message, first.details);
  }
  return canonicalClone(graph);
}

export function assertRenderGraph(graph) {
  const result = validateRenderGraph(graph);
  if (!result.ok) {
    const first = result.errors[0];
    throw new WorldBodyValidationError(first.code, first.path, first.message, first.details);
  }
  return graph;
}
