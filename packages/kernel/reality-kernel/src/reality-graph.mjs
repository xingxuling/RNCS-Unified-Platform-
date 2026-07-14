import {
  RealityKernelError,
  assertNonEmptyString,
  compareStrings,
  clone,
  rootHash,
  sortedUnique
} from './canonical.mjs';
import {assertRealityObject, verifyRealityObject} from './object-abi.mjs';

const GRAPH_FORMAT = 'reality.graph-snapshot.v0.1';
const RELATION_FORMAT = 'reality.relation.v0.1';

export function createRealityRelation({type, from, to, qualifiers = {}, metadata = {}}) {
  assertNonEmptyString(type, 'RK_RELATION_TYPE_REQUIRED', 'type');
  assertNonEmptyString(from, 'RK_RELATION_FROM_REQUIRED', 'from');
  assertNonEmptyString(to, 'RK_RELATION_TO_REQUIRED', 'to');
  const body = {format: RELATION_FORMAT, type, from, to, qualifiers: clone(qualifiers), metadata: clone(metadata)};
  return {...body, relationRoot: rootHash(body)};
}

export function verifyRealityRelation(value) {
  if (!value || value.format !== RELATION_FORMAT || typeof value.relationRoot !== 'string') return false;
  try {
    const body = Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'relationRoot'));
    return value.relationRoot === rootHash(body) &&
      typeof value.type === 'string' && value.type.length > 0 &&
      typeof value.from === 'string' && value.from.length > 0 &&
      typeof value.to === 'string' && value.to.length > 0 &&
      body.qualifiers && typeof body.qualifiers === 'object' &&
      body.metadata && typeof body.metadata === 'object';
  } catch {
    return false;
  }
}

function relationKey(relation) {
  return `${relation.type}\u0000${relation.from}\u0000${relation.to}\u0000${rootHash(relation.qualifiers ?? {})}`;
}

function relationSort(a, b) {
  return compareStrings(a.from, b.from) || compareStrings(a.type, b.type) || compareStrings(a.to, b.to) ||
    compareStrings(a.relationRoot, b.relationRoot);
}

export class RealityGraph {
  constructor({worldId = 'world:default', revision = 0, logicalTime = 0, objects = [], relations = []} = {}) {
    assertNonEmptyString(worldId, 'RK_WORLD_ID_REQUIRED', 'worldId');
    if (!Number.isInteger(revision) || revision < 0) throw new RealityKernelError('RK_REVISION_INVALID', 'revision must be >= 0');
    if (!Number.isInteger(logicalTime) || logicalTime < 0) throw new RealityKernelError('RK_LOGICAL_TIME_INVALID', 'logicalTime must be >= 0');
    this.worldId = worldId;
    this.revision = revision;
    this.logicalTime = logicalTime;
    this._objects = new Map();
    this._relations = new Map();
    for (const object of objects) this.addObject(object);
    for (const relation of relations) this.addRelation(relation);
  }

  static fromSnapshot(snapshot) {
    if (!snapshot || snapshot.format !== GRAPH_FORMAT || snapshot.realityRoot !== rootHash(Object.fromEntries(Object.entries(snapshot).filter(([key]) => key !== 'realityRoot')))) {
      throw new RealityKernelError('RK_GRAPH_INVALID', 'graph snapshot failed root verification');
    }
    return new RealityGraph(snapshot);
  }

  clone() {
    return RealityGraph.fromSnapshot(this.snapshot());
  }

  addObject(object) {
    assertRealityObject(object);
    if (this._objects.has(object.id)) throw new RealityKernelError('RK_OBJECT_EXISTS', object.id);
    this._objects.set(object.id, clone(object));
    return this;
  }

  replaceObject(object) {
    assertRealityObject(object);
    if (!this._objects.has(object.id)) throw new RealityKernelError('RK_OBJECT_NOT_FOUND', object.id);
    this._objects.set(object.id, clone(object));
    return this;
  }

  getObject(id) {
    return this._objects.has(id) ? clone(this._objects.get(id)) : null;
  }

  hasObject(id) {
    return this._objects.has(id);
  }

  listObjects({kind = null} = {}) {
    return [...this._objects.values()]
      .filter((object) => !kind || object.kind === kind)
      .sort((a, b) => compareStrings(a.id, b.id))
      .map(clone);
  }

  addRelation(relation) {
    if (!verifyRealityRelation(relation)) throw new RealityKernelError('RK_RELATION_INVALID', 'relation failed ABI verification');
    if (!this.hasObject(relation.from) || !this.hasObject(relation.to)) {
      throw new RealityKernelError('RK_RELATION_DANGLING_ENDPOINT', `${relation.from}->${relation.to}`);
    }
    const key = relationKey(relation);
    if (this._relations.has(key)) throw new RealityKernelError('RK_RELATION_EXISTS', key);
    this._relations.set(key, clone(relation));
    return this;
  }

  removeRelation(match) {
    const candidates = [...this._relations.values()].filter((relation) =>
      relation.type === match.type && relation.from === match.from && relation.to === match.to &&
      (match.qualifiers === undefined || rootHash(relation.qualifiers) === rootHash(match.qualifiers))
    );
    if (!candidates.length) throw new RealityKernelError('RK_RELATION_NOT_FOUND', JSON.stringify(match));
    for (const relation of candidates) this._relations.delete(relationKey(relation));
    return candidates.map(clone);
  }

  listRelations({type = null, from = null, to = null} = {}) {
    return [...this._relations.values()]
      .filter((relation) => (!type || relation.type === type) && (!from || relation.from === from) && (!to || relation.to === to))
      .sort(relationSort)
      .map(clone);
  }

  query({from, relationType = null, targetKind = null, depth = 1} = {}) {
    assertNonEmptyString(from, 'RK_QUERY_FROM_REQUIRED', 'from');
    if (!this.hasObject(from)) throw new RealityKernelError('RK_QUERY_SOURCE_NOT_FOUND', from);
    if (!Number.isInteger(depth) || depth < 0 || depth > 32) throw new RealityKernelError('RK_QUERY_DEPTH_INVALID', 'depth must be an integer from 0 to 32');

    const visited = new Set([from]);
    const paths = [[from]];
    const selectedRelations = [];
    let frontier = [{id: from, path: [from]}];
    for (let level = 0; level < depth && frontier.length; level += 1) {
      const next = [];
      for (const current of frontier) {
        for (const relation of this.listRelations({from: current.id, type: relationType})) {
          selectedRelations.push(relation);
          if (!visited.has(relation.to)) {
            visited.add(relation.to);
            const path = [...current.path, relation.to];
            paths.push(path);
            next.push({id: relation.to, path});
          }
        }
      }
      frontier = next;
    }

    const objectIds = sortedUnique([...visited]);
    const objects = objectIds
      .map((id) => this.getObject(id))
      .filter((object) => !targetKind || object.kind === targetKind);
    const objectIdSet = new Set(objects.map((object) => object.id));
    return {
      format: 'reality.graph-query-result.v0.1',
      from,
      depth,
      relationType,
      objectIds,
      objects,
      relations: selectedRelations
        .filter((relation) => objectIdSet.has(relation.from) && objectIdSet.has(relation.to))
        .sort(relationSort)
        .map(clone),
      paths: paths.sort((a, b) => a.length - b.length || compareStrings(a.join('\u0000'), b.join('\u0000')))
    };
  }

  snapshot() {
    const body = {
      format: GRAPH_FORMAT,
      worldId: this.worldId,
      revision: this.revision,
      logicalTime: this.logicalTime,
      objects: this.listObjects(),
      relations: this.listRelations()
    };
    return {...body, realityRoot: rootHash(body)};
  }

  get realityRoot() {
    return this.snapshot().realityRoot;
  }

  commitSnapshot(snapshot) {
    const next = RealityGraph.fromSnapshot(snapshot);
    if (next.worldId !== this.worldId) throw new RealityKernelError('RK_WORLD_MISMATCH', `${next.worldId} != ${this.worldId}`);
    this.revision = next.revision;
    this.logicalTime = next.logicalTime;
    this._objects = next._objects;
    this._relations = next._relations;
    return this;
  }
}

export {GRAPH_FORMAT, RELATION_FORMAT};
