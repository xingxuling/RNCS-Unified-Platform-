"use strict";
var VSRSpatial3D = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/spatial-reality-3d/src/index.ts
  var index_exports = {};
  __export(index_exports, {
    VSRSpatialAssetStreamer: () => VSRSpatialAssetStreamer,
    VSRSpatialWebGPUExecutor: () => VSRSpatialWebGPUExecutor,
    VSR_SPATIAL_ASSET_STREAMING_FORMAT: () => VSR_SPATIAL_ASSET_STREAMING_FORMAT,
    VSR_SPATIAL_ASSET_STREAMING_VERSION: () => VSR_SPATIAL_ASSET_STREAMING_VERSION,
    VSR_SPATIAL_CULL_WGSL_V04: () => VSR_SPATIAL_CULL_WGSL_V04,
    VSR_SPATIAL_FRAGMENT_WGSL_V04: () => VSR_SPATIAL_FRAGMENT_WGSL_V04,
    VSR_SPATIAL_FRAME_FORMAT: () => VSR_SPATIAL_FRAME_FORMAT,
    VSR_SPATIAL_REALITY_VERSION: () => VSR_SPATIAL_REALITY_VERSION,
    VSR_SPATIAL_SCENE_FORMAT: () => VSR_SPATIAL_SCENE_FORMAT,
    VSR_SPATIAL_SHADOW_WGSL_V04: () => VSR_SPATIAL_SHADOW_WGSL_V04,
    VSR_SPATIAL_STREAMING_FORMAT: () => VSR_SPATIAL_STREAMING_FORMAT,
    VSR_SPATIAL_VERTEX_WGSL_V04: () => VSR_SPATIAL_VERTEX_WGSL_V04,
    VSR_SPATIAL_VISUAL_INTENT_FORMAT: () => VSR_SPATIAL_VISUAL_INTENT_FORMAT,
    VSR_SPATIAL_VISUAL_INTENT_VERSION: () => VSR_SPATIAL_VISUAL_INTENT_VERSION,
    applySpatialAnimationConstraints: () => applySpatialAnimationConstraints,
    calculateMeshNormals: () => calculateMeshNormals,
    cameraForward: () => cameraForward,
    cameraPosition: () => cameraPosition,
    cameraViewMatrix: () => cameraViewMatrix,
    cameraWorldMatrix: () => cameraWorldMatrix,
    compileSpatialFrame: () => compileSpatialFrame,
    compileSpatialFrameFromVisualIntent: () => compileSpatialFrameFromVisualIntent,
    createCubeMesh: () => createCubeMesh,
    createPlaneMesh: () => createPlaneMesh,
    createSpatialShowcaseScene: () => createSpatialShowcaseScene,
    createUVSphereMesh: () => createUVSphereMesh,
    distributionGGX: () => distributionGGX,
    evaluatePBRLighting: () => evaluatePBRLighting,
    evaluateSpatialWebGPUCapabilities: () => evaluateSpatialWebGPUCapabilities,
    fresnelSchlick: () => fresnelSchlick,
    geometrySchlickGGX: () => geometrySchlickGGX,
    geometrySmith: () => geometrySmith,
    identityMat4: () => identityMat4,
    inspectSpatialWebGPU: () => inspectSpatialWebGPU,
    lookAtMat4: () => lookAtMat4,
    meshBounds: () => meshBounds,
    multiplyMat4: () => multiplyMat4,
    orthographicMat4: () => orthographicMat4,
    packSpatialCameraUniform: () => packSpatialCameraUniform,
    packSpatialDeformationUniform: () => packSpatialDeformationUniform,
    packSpatialIndexBuffer: () => packSpatialIndexBuffer,
    packSpatialIndirectDrawCommand: () => packSpatialIndirectDrawCommand,
    packSpatialInstanceBoundsBuffer: () => packSpatialInstanceBoundsBuffer,
    packSpatialInstanceBuffer: () => packSpatialInstanceBuffer,
    packSpatialJointBuffer: () => packSpatialJointBuffer,
    packSpatialMaterialUniform: () => packSpatialMaterialUniform,
    packSpatialMorphBuffer: () => packSpatialMorphBuffer,
    packSpatialObjectUniform: () => packSpatialObjectUniform,
    packSpatialShadowUniform: () => packSpatialShadowUniform,
    packSpatialVertexBuffer: () => packSpatialVertexBuffer,
    packSpatialVisibleInstanceIndices: () => packSpatialVisibleInstanceIndices,
    perspectiveMat4: () => perspectiveMat4,
    probeSpatialWebGPU: () => probeSpatialWebGPU,
    quaternionSlerp: () => quaternionSlerp,
    renderSpatialReference: () => renderSpatialReference,
    resolveSpatialAssetStreaming: () => resolveSpatialAssetStreaming,
    resolveSpatialBudget: () => resolveSpatialBudget,
    resolveSpatialShadowCamera: () => resolveSpatialShadowCamera,
    resolveSpatialStreaming: () => resolveSpatialStreaming,
    sampleSpatialAnimation: () => sampleSpatialAnimation,
    sampleSpatialAnimationGraph: () => sampleSpatialAnimationGraph,
    sampleSpatialAnimationLayers: () => sampleSpatialAnimationLayers,
    sampleSpatialEnvironment: () => sampleSpatialEnvironment,
    sampleSpatialTexture: () => sampleSpatialTexture,
    sanitizeSpatialEnvironment: () => sanitizeSpatialEnvironment,
    spatialEnvironmentUV: () => spatialEnvironmentUV,
    transformDirection3: () => transformDirection3,
    transformPoint3: () => transformPoint3,
    transformToMat4: () => transformToMat4,
    transformVec4: () => transformVec4,
    verifySpatialAssetStreamingReceipt: () => verifySpatialAssetStreamingReceipt,
    verifySpatialFrame: () => verifySpatialFrame,
    verifySpatialVisualIntent: () => verifySpatialVisualIntent,
    verifySpatialWebGPUReceipt: () => verifySpatialWebGPUReceipt
  });

  // packages/spec/src/index.ts
  function canonicalize(value) {
    if (value === null) return "null";
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new Error("Cannot canonicalize non-finite number.");
      return Number(value.toFixed(9)).toString();
    }
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "string") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
    if (typeof value === "object") {
      const object = value;
      const keys = Object.keys(object).filter((k) => object[k] !== void 0).sort();
      return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(object[k])}`).join(",")}}`;
    }
    throw new Error(`Unsupported canonical value: ${typeof value}`);
  }
  function sha256Bytes(bytes) {
    const bitLength = bytes.length * 8;
    const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
    const message = new Uint8Array(paddedLength);
    message.set(bytes);
    message[bytes.length] = 128;
    const view = new DataView(message.buffer);
    const high = Math.floor(bitLength / 4294967296);
    const low = bitLength >>> 0;
    view.setUint32(paddedLength - 8, high, false);
    view.setUint32(paddedLength - 4, low, false);
    const constants = new Uint32Array([
      1116352408,
      1899447441,
      3049323471,
      3921009573,
      961987163,
      1508970993,
      2453635748,
      2870763221,
      3624381080,
      310598401,
      607225278,
      1426881987,
      1925078388,
      2162078206,
      2614888103,
      3248222580,
      3835390401,
      4022224774,
      264347078,
      604807628,
      770255983,
      1249150122,
      1555081692,
      1996064986,
      2554220882,
      2821834349,
      2952996808,
      3210313671,
      3336571891,
      3584528711,
      113926993,
      338241895,
      666307205,
      773529912,
      1294757372,
      1396182291,
      1695183700,
      1986661051,
      2177026350,
      2456956037,
      2730485921,
      2820302411,
      3259730800,
      3345764771,
      3516065817,
      3600352804,
      4094571909,
      275423344,
      430227734,
      506948616,
      659060556,
      883997877,
      958139571,
      1322822218,
      1537002063,
      1747873779,
      1955562222,
      2024104815,
      2227730452,
      2361852424,
      2428436474,
      2756734187,
      3204031479,
      3329325298
    ]);
    const h = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]);
    const w = new Uint32Array(64);
    const rotr = (value, shift) => value >>> shift | value << 32 - shift;
    for (let offset = 0; offset < message.length; offset += 64) {
      for (let index = 0; index < 16; index++) w[index] = view.getUint32(offset + index * 4, false);
      for (let index = 16; index < 64; index++) {
        const s0 = rotr(w[index - 15], 7) ^ rotr(w[index - 15], 18) ^ w[index - 15] >>> 3;
        const s1 = rotr(w[index - 2], 17) ^ rotr(w[index - 2], 19) ^ w[index - 2] >>> 10;
        w[index] = w[index - 16] + s0 + w[index - 7] + s1 >>> 0;
      }
      let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (let index = 0; index < 64; index++) {
        const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = e & f ^ ~e & g;
        const t1 = hh + s1 + ch + constants[index] + w[index] >>> 0;
        const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = a & b ^ a & c ^ b & c;
        const t2 = s0 + maj >>> 0;
        hh = g;
        g = f;
        f = e;
        e = d + t1 >>> 0;
        d = c;
        c = b;
        b = a;
        a = t1 + t2 >>> 0;
      }
      h[0] = h[0] + a >>> 0;
      h[1] = h[1] + b >>> 0;
      h[2] = h[2] + c >>> 0;
      h[3] = h[3] + d >>> 0;
      h[4] = h[4] + e >>> 0;
      h[5] = h[5] + f >>> 0;
      h[6] = h[6] + g >>> 0;
      h[7] = h[7] + hh >>> 0;
    }
    return [...h].map((value) => value.toString(16).padStart(8, "0")).join("");
  }
  function sha256Hex(text) {
    return sha256Bytes(new TextEncoder().encode(text));
  }
  function cryptographicHash(value) {
    return sha256Hex(canonicalize(value));
  }

  // packages/spatial-reality-3d/src/asset-streaming.ts
  var VSR_SPATIAL_ASSET_STREAMING_FORMAT = "vsr.spatial-asset-streaming.v0.1";
  var VSR_SPATIAL_ASSET_STREAMING_VERSION = "0.1.0";
  var orderedUnique = (values) => [...new Set((values ?? []).filter((value) => typeof value === "string" && value.length > 0))];
  var unique = (values) => orderedUnique(values).sort((a, b) => a.localeCompare(b));
  var finiteBudget = (value, fallback) => value === void 0 || !Number.isFinite(value) ? fallback : Math.max(0, Math.floor(value));
  var assetView = (asset) => ({ id: asset.id, uri: asset.uri, sha256: asset.sha256, byteLength: asset.byteLength, kind: asset.kind, dependencies: unique(asset.dependencies), cellIds: unique(asset.cellIds), priority: asset.priority ?? 0 });
  var assertAsset = (asset) => {
    if (!asset.id || !asset.uri || !/^[a-f0-9]{64}$/i.test(asset.sha256) || !Number.isInteger(asset.byteLength) || asset.byteLength < 0) throw new Error(`Invalid spatial asset record ${asset.id || "unknown"}.`);
  };
  function catalogMap(catalog) {
    const map = /* @__PURE__ */ new Map();
    for (const asset of catalog) {
      assertAsset(asset);
      if (map.has(asset.id)) throw new Error(`Duplicate spatial asset ${asset.id}.`);
      map.set(asset.id, asset);
    }
    return map;
  }
  function catalogRoot(catalog) {
    return cryptographicHash(catalog.map(assetView).sort((a, b) => a.id.localeCompare(b.id)));
  }
  function dependencyClosure(catalog, roots, diagnostics) {
    const required = /* @__PURE__ */ new Set(), missing = /* @__PURE__ */ new Set(), visiting = /* @__PURE__ */ new Set();
    const visit = (id) => {
      if (required.has(id)) return;
      const asset = catalog.get(id);
      if (!asset) {
        missing.add(id);
        required.add(id);
        return;
      }
      if (visiting.has(id)) {
        diagnostics.push(`dependency-cycle:${id}`);
        return;
      }
      visiting.add(id);
      for (const dependency of unique(asset.dependencies)) visit(dependency);
      visiting.delete(id);
      required.add(id);
    };
    for (const root of roots) visit(root);
    return { required, missing };
  }
  function dependencyFirstOrder(catalog, roots, diagnostics) {
    const visited = /* @__PURE__ */ new Set(), visiting = /* @__PURE__ */ new Set(), ordered = [];
    const visit = (id) => {
      if (visited.has(id) || !catalog.has(id)) return;
      if (visiting.has(id)) {
        diagnostics.push(`dependency-cycle:${id}`);
        return;
      }
      visiting.add(id);
      for (const dependency of unique(catalog.get(id).dependencies)) visit(dependency);
      visiting.delete(id);
      visited.add(id);
      ordered.push(id);
    };
    for (const id of roots) visit(id);
    return ordered;
  }
  function resolveSpatialAssetStreaming(catalog, request = {}) {
    const map = catalogMap(catalog), activeCellIds = unique(request.activeCellIds), explicit = unique(request.requestedAssetIds), cellRoots = [...map.values()].filter((asset) => asset.cellIds?.length && asset.cellIds.some((cellId) => activeCellIds.includes(cellId))).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.id.localeCompare(b.id)).map((asset) => asset.id), requestedAssetIds = unique([...explicit, ...cellRoots]), diagnostics = [];
    const { required, missing } = dependencyClosure(map, requestedAssetIds, diagnostics), ordered = dependencyFirstOrder(map, requestedAssetIds, diagnostics), requiredAssetIds = [...required].sort((a, b) => {
      const ai = ordered.indexOf(a), bi = ordered.indexOf(b);
      return (ai < 0 ? Number.MAX_SAFE_INTEGER : ai) - (bi < 0 ? Number.MAX_SAFE_INTEGER : bi) || a.localeCompare(b);
    }), residentCandidates = new Set(unique(request.residentAssetIds)), maxAssets = finiteBudget(request.maxAssets, Number.MAX_SAFE_INTEGER), maxBytes = finiteBudget(request.maxBytes, Number.MAX_SAFE_INTEGER);
    const residentAssetIds = [], queuedAssetIds = [], deferredAssetIds = [], evictedAssetIds = [];
    let bytesResident = 0, bytesQueued = 0, usedAssets = 0, usedBytes = 0;
    for (const id of ordered) {
      const asset = map.get(id);
      if (missing.has(id)) continue;
      const dependencies = unique(asset.dependencies);
      if (dependencies.some((dependency) => missing.has(dependency))) {
        diagnostics.push(`blocked-by-missing:${id}`);
        continue;
      }
      const fits = usedAssets + 1 <= maxAssets && usedBytes + asset.byteLength <= maxBytes;
      if (fits) {
        usedAssets++;
        usedBytes += asset.byteLength;
        if (residentCandidates.has(id)) {
          residentAssetIds.push(id);
          bytesResident += asset.byteLength;
        } else {
          queuedAssetIds.push(id);
          bytesQueued += asset.byteLength;
        }
      } else if (residentCandidates.has(id)) {
        evictedAssetIds.push(id);
      } else deferredAssetIds.push(id);
    }
    for (const id of residentCandidates) if (!required.has(id) && map.has(id)) evictedAssetIds.push(id);
    const base = { format: VSR_SPATIAL_ASSET_STREAMING_FORMAT, version: VSR_SPATIAL_ASSET_STREAMING_VERSION, activeCellIds, requestedAssetIds, requiredAssetIds, residentAssetIds: unique(residentAssetIds), queuedAssetIds: unique(queuedAssetIds), deferredAssetIds: unique(deferredAssetIds), missingAssetIds: unique([...missing]), evictedAssetIds: unique(evictedAssetIds), bytesResident, bytesQueued, maxAssets, maxBytes, catalogRoot: catalogRoot(catalog), requestRoot: cryptographicHash({ requestedAssetIds, activeCellIds, residentAssetIds: unique([...residentCandidates]), maxAssets, maxBytes }), diagnostics: unique(diagnostics) };
    return { ...base, residentAssetIds: orderedUnique(residentAssetIds), queuedAssetIds: orderedUnique(queuedAssetIds), deferredAssetIds: orderedUnique(deferredAssetIds), root: cryptographicHash({ ...base, residentAssetIds: orderedUnique(residentAssetIds), queuedAssetIds: orderedUnique(queuedAssetIds), deferredAssetIds: orderedUnique(deferredAssetIds) }) };
  }
  var payloadBytes = (payload) => payload instanceof Uint8Array ? new Uint8Array(payload) : new Uint8Array(payload);
  var errorInfo = (error) => {
    const value = error;
    return { code: typeof value?.code === "string" ? value.code : "VSR_ASSET_LOAD_FAILED", message: typeof value?.message === "string" ? value.message : String(error) };
  };
  var VSRSpatialAssetStreamer = class {
    catalog;
    loader;
    maxConcurrent;
    states = /* @__PURE__ */ new Map();
    constructor(catalog, loader, { maxConcurrent = 4 } = {}) {
      this.catalog = catalogMap(catalog);
      this.loader = loader;
      this.maxConcurrent = Math.max(1, Math.floor(maxConcurrent));
      for (const id of this.catalog.keys()) this.states.set(id, { status: "idle", attempts: 0, leases: 0 });
    }
    state(assetId) {
      return this.states.get(assetId)?.status ?? "evicted";
    }
    get(assetId) {
      const bytes = this.states.get(assetId)?.bytes;
      return bytes ? new Uint8Array(bytes) : void 0;
    }
    inspect() {
      const ready = [...this.states.entries()].filter(([, state]) => state.status === "ready").map(([id]) => id).sort((a, b) => a.localeCompare(b));
      return { format: VSR_SPATIAL_ASSET_STREAMING_FORMAT, catalogRoot: catalogRoot([...this.catalog.values()]), maxConcurrent: this.maxConcurrent, readyAssetIds: ready, bytesResident: ready.reduce((sum, id) => sum + (this.catalog.get(id)?.byteLength ?? 0), 0), states: Object.fromEntries([...this.states.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, state]) => [id, state.status])) };
    }
    async acquire(request = {}) {
      const resolution = resolveSpatialAssetStreaming([...this.catalog.values()], { ...request, residentAssetIds: [...this.states.entries()].filter(([, state]) => state.status === "ready").map(([id]) => id) }), operations = [];
      for (const id of resolution.queuedAssetIds) {
        const state = this.states.get(id);
        if (state.status === "failed" || state.status === "blocked" || state.status === "evicted") state.status = "idle";
      }
      const pending = new Set(resolution.queuedAssetIds), blocked = /* @__PURE__ */ new Set();
      let bytesLoaded = 0;
      while (pending.size) {
        const newlyBlocked = [...pending].filter((id) => unique(this.catalog.get(id)?.dependencies).some((dependency) => resolution.missingAssetIds.includes(dependency) || this.states.get(dependency)?.status === "failed" || blocked.has(dependency)));
        for (const id of newlyBlocked) {
          pending.delete(id);
          blocked.add(id);
          const state = this.states.get(id);
          state.status = "blocked";
          operations.push({ assetId: id, status: "blocked", errorCode: "VSR_ASSET_DEPENDENCY_BLOCKED", errorMessage: "Dependency failed or is missing." });
        }
        const loadable = [...pending].filter((id) => unique(this.catalog.get(id)?.dependencies).every((dependency) => this.states.get(dependency)?.status === "ready")).slice(0, this.maxConcurrent);
        if (!loadable.length) {
          for (const id of pending) {
            blocked.add(id);
            const state = this.states.get(id);
            state.status = "blocked";
            operations.push({ assetId: id, status: "blocked", errorCode: "VSR_ASSET_DEPENDENCY_UNRESOLVED", errorMessage: "Dependency did not become ready." });
          }
          pending.clear();
          break;
        }
        for (const id of loadable) {
          pending.delete(id);
          this.states.get(id).status = "loading";
        }
        const results = await Promise.all(loadable.map(async (id) => {
          const state = this.states.get(id), asset = this.catalog.get(id);
          state.attempts++;
          const controller = new AbortController();
          try {
            const bytes = payloadBytes(await this.loader(asset, { asset, signal: controller.signal, attempt: state.attempts })), actual = sha256Bytes(bytes);
            if (actual.toLowerCase() !== asset.sha256.toLowerCase()) {
              const error = Object.assign(new Error(`SHA-256 mismatch for ${id}.`), { code: "VSR_ASSET_HASH_MISMATCH" });
              throw error;
            }
            state.bytes = bytes;
            state.status = "ready";
            return { assetId: id, status: "loaded", byteLength: bytes.byteLength, sha256: actual, attempt: state.attempts };
          } catch (error) {
            const info = errorInfo(error);
            state.status = "failed";
            state.bytes = void 0;
            state.errorCode = info.code;
            state.errorMessage = info.message;
            return { assetId: id, status: "failed", errorCode: info.code, errorMessage: info.message, attempt: state.attempts };
          }
        }));
        for (const result of results) {
          operations.push(result);
          if (result.status === "loaded") bytesLoaded += result.byteLength ?? 0;
        }
      }
      const finalResolution = resolveSpatialAssetStreaming([...this.catalog.values()], { ...request, residentAssetIds: [...this.states.entries()].filter(([, state]) => state.status === "ready").map(([id]) => id) });
      const leasedAssetIds = finalResolution.residentAssetIds.filter((id) => {
        const state = this.states.get(id);
        state.leases++;
        return true;
      }), failedAssetIds = operations.filter((operation) => operation.status === "failed").map((operation) => operation.assetId).sort((a, b) => a.localeCompare(b)), blockedAssetIds = operations.filter((operation) => operation.status === "blocked").map((operation) => operation.assetId).sort((a, b) => a.localeCompare(b)), base = { format: VSR_SPATIAL_ASSET_STREAMING_FORMAT, version: VSR_SPATIAL_ASSET_STREAMING_VERSION, resolution: finalResolution, operations, readyAssetIds: finalResolution.residentAssetIds, failedAssetIds, blockedAssetIds, leasedAssetIds, bytesLoaded };
      return { ...base, receiptRoot: cryptographicHash(base) };
    }
    release(assetIds) {
      const { required } = dependencyClosure(this.catalog, unique(assetIds), []), released = [];
      for (const id of required) {
        const state = this.states.get(id);
        if (state && state.leases > 0) {
          state.leases--;
          released.push(id);
        }
      }
      return released.sort((a, b) => a.localeCompare(b));
    }
    evict(assetIds) {
      const candidates = assetIds ? unique(assetIds) : [...this.states.keys()].sort((a, b) => a.localeCompare(b)), evicted = [];
      for (const id of candidates) {
        const state = this.states.get(id);
        if (!state || state.status !== "ready" || state.leases > 0) continue;
        state.status = "evicted";
        state.bytes = void 0;
        evicted.push(id);
      }
      return evicted;
    }
  };
  function verifySpatialAssetStreamingReceipt(receipt) {
    const { receiptRoot, ...base } = receipt;
    return cryptographicHash(base) === receiptRoot && receipt.resolution.root === cryptographicHash({ ...receipt.resolution, ...{ root: void 0 } });
  }

  // packages/spatial-reality-3d/src/index.ts
  function parseColor(color) {
    const input = color.trim(), hex = input.match(/^#([0-9a-f]{3,8})$/i);
    if (hex) {
      const value = hex[1], c0 = value[0], c1 = value[1], c2 = value[2], c3 = value[3];
      if (value.length === 3 || value.length === 4) return [parseInt(c0 + c0, 16), parseInt(c1 + c1, 16), parseInt(c2 + c2, 16), value.length === 4 ? parseInt(`${c3}${c3}`, 16) : 255];
      if (value.length === 6 || value.length === 8) return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16), value.length === 8 ? parseInt(value.slice(6, 8), 16) : 255];
    }
    const rgb = input.match(/^rgba?\(([^)]+)\)$/i);
    if (rgb) {
      const values = rgb[1].split(",").map(Number);
      return [Math.max(0, Math.min(255, Math.round(values[0] ?? 0))), Math.max(0, Math.min(255, Math.round(values[1] ?? 0))), Math.max(0, Math.min(255, Math.round(values[2] ?? 0))), values.length > 3 ? Math.max(0, Math.min(255, Math.round((values[3] ?? 1) * 255))) : 255];
    }
    const named = { transparent: [0, 0, 0, 0], black: [0, 0, 0, 255], white: [255, 255, 255, 255], red: [255, 0, 0, 255], green: [0, 128, 0, 255], blue: [0, 0, 255, 255], yellow: [255, 255, 0, 255] };
    return named[input.toLowerCase()] ?? [255, 0, 255, 255];
  }
  var PixelSurface = class {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.data = new Uint8Array(width * height * 4);
    }
    width;
    height;
    data;
  };
  var CRC32_TABLE = Array.from({ length: 256 }, (_, seed) => {
    let value = seed;
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 3988292384 ^ value >>> 1 : value >>> 1;
    return value >>> 0;
  });
  function crc32(bytes) {
    let value = 4294967295;
    for (const byte of bytes) value = CRC32_TABLE[(value ^ byte) & 255] ^ value >>> 8;
    return (value ^ 4294967295) >>> 0;
  }
  function adler32(bytes) {
    let a = 1, b = 0;
    for (const byte of bytes) {
      a = (a + byte) % 65521;
      b = (b + a) % 65521;
    }
    return b << 16 | a;
  }
  function concatBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.byteLength, 0), out = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
      out.set(part, offset);
      offset += part.byteLength;
    }
    return out;
  }
  function pngChunk(type, payload) {
    const typeBytes = new TextEncoder().encode(type), out = new Uint8Array(payload.byteLength + 12), view = new DataView(out.buffer);
    view.setUint32(0, payload.byteLength, false);
    out.set(typeBytes, 4);
    out.set(payload, 8);
    view.setUint32(payload.byteLength + 8, crc32(out.subarray(4, payload.byteLength + 8)), false);
    return out;
  }
  function encodePng(surface, _options) {
    const stride = surface.width * 4, raw = new Uint8Array((stride + 1) * surface.height);
    for (let y = 0; y < surface.height; y++) {
      const row = y * (stride + 1);
      raw[row] = 0;
      raw.set(surface.data.subarray(y * stride, (y + 1) * stride), row + 1);
    }
    const compressed = [new Uint8Array([120, 1])];
    for (let offset = 0; offset < raw.length; ) {
      const length = Math.min(65535, raw.length - offset), last = offset + length === raw.length, header2 = new Uint8Array([last ? 1 : 0, length & 255, length >>> 8 & 255, ~length & 255, ~length >>> 8 & 255]);
      compressed.push(header2, raw.subarray(offset, offset + length));
      offset += length;
    }
    const checksum = adler32(raw), adler = new Uint8Array([checksum >>> 24 & 255, checksum >>> 16 & 255, checksum >>> 8 & 255, checksum & 255]);
    compressed.push(adler);
    const header = new Uint8Array(13), view = new DataView(header.buffer);
    view.setUint32(0, surface.width, false);
    view.setUint32(4, surface.height, false);
    header[8] = 8;
    header[9] = 6;
    const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    return concatBytes([signature, pngChunk("IHDR", header), pngChunk("IDAT", concatBytes(compressed)), pngChunk("IEND", new Uint8Array())]);
  }
  var VSR_SPATIAL_REALITY_VERSION = "0.8.0-alpha.1";
  var VSR_SPATIAL_SCENE_FORMAT = "vsr.spatial-scene.v0.4";
  var VSR_SPATIAL_FRAME_FORMAT = "vsr.spatial-frame-plan.v0.4";
  var VSR_SPATIAL_STREAMING_FORMAT = "vsr.spatial-streaming-resolution.v0.1";
  var VSR_SPATIAL_VISUAL_INTENT_FORMAT = "taowind.rcl-rncs-visual-intent.v0.1";
  var VSR_SPATIAL_VISUAL_INTENT_VERSION = "0.1.0";
  var EPS = 1e-9;
  var clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  var add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  var sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  var scale3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  var dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  var cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  var length3 = (a) => Math.hypot(a[0], a[1], a[2]);
  var normalize3 = (a) => {
    const l = length3(a);
    return l < EPS ? [0, 0, 0] : [a[0] / l, a[1] / l, a[2] / l];
  };
  var distance3 = (a, b) => length3(sub3(a, b));
  var radians = (deg) => deg * Math.PI / 180;
  var dot4 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  var normalizeQuaternion = (value) => {
    const length = Math.hypot(value[0], value[1], value[2], value[3]);
    return length < EPS ? [0, 0, 0, 1] : [value[0] / length, value[1] / length, value[2] / length, value[3] / length];
  };
  function quaternionSlerp(a, b, t) {
    let end = normalizeQuaternion(b), start = normalizeQuaternion(a), cosine = dot4(start, end);
    if (cosine < 0) {
      end = [-end[0], -end[1], -end[2], -end[3]];
      cosine = -cosine;
    }
    if (cosine > 0.9995) return normalizeQuaternion([start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t, start[2] + (end[2] - start[2]) * t, start[3] + (end[3] - start[3]) * t]);
    const angle = Math.acos(clamp(cosine, -1, 1)), sinAngle = Math.sin(angle), aWeight = Math.sin((1 - t) * angle) / sinAngle, bWeight = Math.sin(t * angle) / sinAngle;
    return normalizeQuaternion([start[0] * aWeight + end[0] * bWeight, start[1] * aWeight + end[1] * bWeight, start[2] * aWeight + end[2] * bWeight, start[3] * aWeight + end[3] * bWeight]);
  }
  function quaternionToMat4(value) {
    const [x, y, z, w] = normalizeQuaternion(value), xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
    return [1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0, 2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0, 2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0, 0, 0, 0, 1];
  }
  function identityMat4() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }
  function multiplyMat4(a, b) {
    const out = new Array(16).fill(0);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) for (let k = 0; k < 4; k++) out[r * 4 + c] += a[r * 4 + k] * b[k * 4 + c];
    return out;
  }
  function transformVec4(m, v) {
    return [
      m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3] * v[3],
      m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7] * v[3],
      m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11] * v[3],
      m[12] * v[0] + m[13] * v[1] + m[14] * v[2] + m[15] * v[3]
    ];
  }
  function transformPoint3(m, p) {
    const v = transformVec4(m, [p[0], p[1], p[2], 1]), w = Math.abs(v[3]) < EPS ? 1 : v[3];
    return [v[0] / w, v[1] / w, v[2] / w];
  }
  function transformDirection3(m, p) {
    return normalize3([m[0] * p[0] + m[1] * p[1] + m[2] * p[2], m[4] * p[0] + m[5] * p[1] + m[6] * p[2], m[8] * p[0] + m[9] * p[1] + m[10] * p[2]]);
  }
  function transformToMat4(transform = {}) {
    const [tx, ty, tz] = transform.translation ?? [0, 0, 0], [sx, sy, sz] = transform.scale ?? [1, 1, 1];
    const [rx, ry, rz] = (transform.rotationEulerDeg ?? [0, 0, 0]).map(radians);
    const cx = Math.cos(rx), sxv = Math.sin(rx), cy = Math.cos(ry), syv = Math.sin(ry), cz = Math.cos(rz), szv = Math.sin(rz);
    const mx = [1, 0, 0, 0, 0, cx, -sxv, 0, 0, sxv, cx, 0, 0, 0, 0, 1];
    const my = [cy, 0, syv, 0, 0, 1, 0, 0, -syv, 0, cy, 0, 0, 0, 0, 1];
    const mz = [cz, -szv, 0, 0, szv, cz, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const scale = [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
    const translation = [1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz, 0, 0, 0, 1];
    const rotation = transform.rotationQuaternion ? quaternionToMat4(transform.rotationQuaternion) : multiplyMat4(mz, multiplyMat4(my, mx));
    return multiplyMat4(translation, multiplyMat4(rotation, scale));
  }
  function perspectiveMat4(fovYDeg, aspect, near, far) {
    const f = 1 / Math.tan(radians(fovYDeg) / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, 2 * far * near * nf, 0, 0, -1, 0];
  }
  function orthographicMat4(height, aspect, near, far) {
    const width = height * aspect;
    return [2 / width, 0, 0, 0, 0, 2 / height, 0, 0, 0, 0, -2 / (far - near), -(far + near) / (far - near), 0, 0, 0, 1];
  }
  function lookAtMat4(eye, target, up = [0, 1, 0]) {
    const z = normalize3(sub3(eye, target)), x = normalize3(cross3(up, z)), y = cross3(z, x);
    return [x[0], x[1], x[2], -dot3(x, eye), y[0], y[1], y[2], -dot3(y, eye), z[0], z[1], z[2], -dot3(z, eye), 0, 0, 0, 1];
  }
  function cameraWorldMatrix(camera) {
    return transformToMat4(camera.transform);
  }
  function cameraPosition(camera) {
    return camera.transform.translation ?? [0, 0, 0];
  }
  function cameraForward(camera) {
    return transformDirection3(cameraWorldMatrix(camera), [0, 0, -1]);
  }
  function cameraViewMatrix(camera) {
    const eye = cameraPosition(camera), target = add3(eye, cameraForward(camera));
    return lookAtMat4(eye, target, [0, 1, 0]);
  }
  function validateMesh(mesh) {
    if (mesh.positions.length < 9 || mesh.positions.length % 3 !== 0) throw new Error(`Mesh ${mesh.id} positions must contain XYZ triples.`);
    if (mesh.indices.length < 3 || mesh.indices.length % 3 !== 0) throw new Error(`Mesh ${mesh.id} indices must contain triangle triples.`);
    const vertices = mesh.positions.length / 3;
    for (const index of mesh.indices) if (!Number.isInteger(index) || index < 0 || index >= vertices) throw new Error(`Mesh ${mesh.id} has invalid index ${index}.`);
    if (mesh.normals && mesh.normals.length !== mesh.positions.length) throw new Error(`Mesh ${mesh.id} normals length mismatch.`);
    if (mesh.uvs && mesh.uvs.length !== vertices * 2) throw new Error(`Mesh ${mesh.id} UV length mismatch.`);
    if (mesh.jointIndices && mesh.jointIndices.length !== vertices * 4) throw new Error(`Mesh ${mesh.id} joint index length mismatch.`);
    if (mesh.jointWeights && mesh.jointWeights.length !== vertices * 4) throw new Error(`Mesh ${mesh.id} joint weight length mismatch.`);
    for (const index of mesh.jointIndices ?? []) if (!Number.isInteger(index) || index < 0) throw new Error(`Mesh ${mesh.id} has invalid joint index ${index}.`);
    for (const weight of mesh.jointWeights ?? []) if (!Number.isFinite(weight) || weight < 0) throw new Error(`Mesh ${mesh.id} has invalid joint weight ${weight}.`);
    if ((mesh.morphTargets?.length ?? 0) > 4) throw new Error(`Mesh ${mesh.id} supports at most four morph targets.`);
    for (const target of mesh.morphTargets ?? []) {
      if (target.positions.length !== mesh.positions.length) throw new Error(`Mesh ${mesh.id} morph target ${target.id ?? "unnamed"} position length mismatch.`);
      if (target.normals && target.normals.length !== mesh.positions.length) throw new Error(`Mesh ${mesh.id} morph target ${target.id ?? "unnamed"} normal length mismatch.`);
    }
  }
  function calculateMeshNormals(mesh) {
    validateMesh({ ...mesh, normals: void 0 });
    const normals = new Array(mesh.positions.length).fill(0);
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const ia = mesh.indices[i] * 3, ib = mesh.indices[i + 1] * 3, ic = mesh.indices[i + 2] * 3;
      const a = [mesh.positions[ia], mesh.positions[ia + 1], mesh.positions[ia + 2]], b = [mesh.positions[ib], mesh.positions[ib + 1], mesh.positions[ib + 2]], c = [mesh.positions[ic], mesh.positions[ic + 1], mesh.positions[ic + 2]], n = cross3(sub3(b, a), sub3(c, a));
      for (const base of [ia, ib, ic]) {
        normals[base] += n[0];
        normals[base + 1] += n[1];
        normals[base + 2] += n[2];
      }
    }
    for (let i = 0; i < normals.length; i += 3) {
      const n = normalize3([normals[i], normals[i + 1], normals[i + 2]]);
      normals[i] = n[0];
      normals[i + 1] = n[1];
      normals[i + 2] = n[2];
    }
    return normals;
  }
  function meshBounds(mesh) {
    validateMesh(mesh);
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < mesh.positions.length; i += 3) {
      const x = mesh.positions[i], y = mesh.positions[i + 1], z = mesh.positions[i + 2];
      min = [Math.min(min[0], x), Math.min(min[1], y), Math.min(min[2], z)];
      max = [Math.max(max[0], x), Math.max(max[1], y), Math.max(max[2], z)];
    }
    const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    let radius = 0;
    for (let i = 0; i < mesh.positions.length; i += 3) radius = Math.max(radius, distance3(center, [mesh.positions[i], mesh.positions[i + 1], mesh.positions[i + 2]]));
    return { min, max, center, radius };
  }
  function transformBounds(bounds, world) {
    const corners = [];
    for (const x of [bounds.min[0], bounds.max[0]]) for (const y of [bounds.min[1], bounds.max[1]]) for (const z of [bounds.min[2], bounds.max[2]]) corners.push(transformPoint3(world, [x, y, z]));
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (const point of corners) {
      min = [Math.min(min[0], point[0]), Math.min(min[1], point[1]), Math.min(min[2], point[2])];
      max = [Math.max(max[0], point[0]), Math.max(max[1], point[1]), Math.max(max[2], point[2])];
    }
    const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2], radius = Math.max(...corners.map((point) => distance3(point, center)));
    return { min, max, center, radius };
  }
  function createCubeMesh(id = "mesh:cube", size = 1) {
    const h = size / 2, faces = [
      { normal: [0, 0, 1], vertices: [[-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]] },
      { normal: [0, 0, -1], vertices: [[h, -h, -h], [-h, -h, -h], [-h, h, -h], [h, h, -h]] },
      { normal: [0, 1, 0], vertices: [[-h, h, h], [h, h, h], [h, h, -h], [-h, h, -h]] },
      { normal: [0, -1, 0], vertices: [[-h, -h, -h], [h, -h, -h], [h, -h, h], [-h, -h, h]] },
      { normal: [1, 0, 0], vertices: [[h, -h, h], [h, -h, -h], [h, h, -h], [h, h, h]] },
      { normal: [-1, 0, 0], vertices: [[-h, -h, -h], [-h, -h, h], [-h, h, h], [-h, h, -h]] }
    ];
    const positions = [], normals = [], uvs = [], indices = [];
    for (const face of faces) {
      const offset = positions.length / 3;
      for (const vertex of face.vertices) {
        positions.push(...vertex);
        normals.push(...face.normal);
      }
      uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
      indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
    }
    return { id, positions, normals, uvs, indices };
  }
  function createPlaneMesh(id = "mesh:plane", width = 10, depth = 10) {
    return { id, positions: [-width / 2, 0, -depth / 2, width / 2, 0, -depth / 2, width / 2, 0, depth / 2, -width / 2, 0, depth / 2], normals: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], uvs: [0, 0, 1, 0, 1, 1, 0, 1], indices: [0, 2, 1, 0, 3, 2] };
  }
  function createUVSphereMesh(id = "mesh:sphere", radius = 1, segments = 20, rings = 12) {
    segments = Math.max(3, Math.floor(segments));
    rings = Math.max(2, Math.floor(rings));
    const positions = [], normals = [], uvs = [], indices = [];
    for (let y = 0; y <= rings; y++) {
      const v = y / rings, phi = v * Math.PI;
      for (let x = 0; x <= segments; x++) {
        const u = x / segments, theta = u * Math.PI * 2, n = [Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];
        positions.push(n[0] * radius, n[1] * radius, n[2] * radius);
        normals.push(...n);
        uvs.push(u, 1 - v);
      }
    }
    for (let y = 0; y < rings; y++) for (let x = 0; x < segments; x++) {
      const a = y * (segments + 1) + x, b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    return { id, positions, normals, uvs, indices };
  }
  function sanitizeMaterial(material) {
    return {
      id: material.id,
      baseColor: material.baseColor ?? "#b8c7e6",
      metallic: clamp(material.metallic ?? 0, 0, 1),
      roughness: clamp(material.roughness ?? 0.6, 0.04, 1),
      emissive: material.emissive ?? "#000000",
      emissiveStrength: Math.max(0, material.emissiveStrength ?? 0),
      doubleSided: material.doubleSided ?? false,
      opacity: clamp(material.opacity ?? 1, 0, 1),
      occlusionStrength: clamp(material.occlusionStrength ?? 1, 0, 1),
      clearcoat: clamp(material.clearcoat ?? 0, 0, 1),
      clearcoatRoughness: clamp(material.clearcoatRoughness ?? 0.12, 0.04, 1),
      ior: clamp(material.ior ?? 1.5, 1, 2.5),
      baseColorTextureId: material.baseColorTextureId,
      metallicRoughnessTextureId: material.metallicRoughnessTextureId,
      normalTextureId: material.normalTextureId,
      occlusionTextureId: material.occlusionTextureId,
      emissiveTextureId: material.emissiveTextureId,
      normalScale: Math.max(0, material.normalScale ?? 1),
      alphaMode: material.alphaMode ?? "OPAQUE",
      alphaCutoff: clamp(material.alphaCutoff ?? 0.5, 0, 1)
    };
  }
  function sanitizeSpatialEnvironment(environment) {
    const intensity = environment?.intensity;
    return { diffuseColor: environment?.diffuseColor ?? "#000000", specularColor: environment?.specularColor ?? "#000000", intensity: Number.isFinite(intensity) ? clamp(intensity, 0, 32) : 1, ...environment?.textureId ? { textureId: environment.textureId } : {} };
  }
  function resolveSpatialBudget(options = {}) {
    const qualityTier = options.qualityTier ?? "balanced", defaults = { economy: { width: 640, height: 360, maxLights: 4, shadowMapSize: 128, shadows: false, lodBias: 0.8 }, balanced: { width: 960, height: 540, maxLights: 8, shadowMapSize: 256, shadows: true, lodBias: 1 }, quality: { width: 1280, height: 720, maxLights: 16, shadowMapSize: 512, shadows: true, lodBias: 1.2 }, cinematic: { width: 1920, height: 1080, maxLights: 32, shadowMapSize: 1024, shadows: true, lodBias: 1.5 } }[qualityTier];
    return { qualityTier, width: Math.max(16, Math.floor(options.width ?? defaults.width)), height: Math.max(16, Math.floor(options.height ?? defaults.height)), maxLights: Math.max(1, Math.floor(options.maxLights ?? defaults.maxLights)), shadowMapSize: Math.max(32, Math.floor(options.shadowMapSize ?? defaults.shadowMapSize)), shadows: options.enableShadows ?? defaults.shadows, lodBias: Math.max(0.1, options.lodBias ?? defaults.lodBias) };
  }
  function validateScene(scene) {
    if (scene.format !== VSR_SPATIAL_SCENE_FORMAT) throw new Error(`Unsupported spatial scene format ${String(scene.format)}.`);
    const ids = /* @__PURE__ */ new Set();
    for (const mesh of scene.meshes) {
      if (ids.has(mesh.id)) throw new Error(`Duplicate mesh ${mesh.id}.`);
      ids.add(mesh.id);
      validateMesh(mesh);
    }
    for (const material of scene.materials) if (ids.has(material.id)) throw new Error(`Duplicate id ${material.id}.`);
    else ids.add(material.id);
    for (const texture of scene.textures ?? []) {
      if (ids.has(texture.id)) throw new Error(`Duplicate id ${texture.id}.`);
      ids.add(texture.id);
      if (texture.width < 1 || texture.height < 1 || texture.pixels.length !== texture.width * texture.height * 4) throw new Error(`Texture ${texture.id} RGBA length mismatch.`);
    }
    for (const skin of scene.skins ?? []) {
      if (ids.has(skin.id)) throw new Error(`Duplicate id ${skin.id}.`);
      ids.add(skin.id);
      if (!skin.joints.length) throw new Error(`Skin ${skin.id} must contain joints.`);
      if (skin.inverseBindMatrices && skin.inverseBindMatrices.length !== skin.joints.length) throw new Error(`Skin ${skin.id} inverse bind matrix length mismatch.`);
    }
    for (const node of scene.nodes) if (ids.has(node.id)) throw new Error(`Duplicate id ${node.id}.`);
    else ids.add(node.id);
    if (!scene.cameras.some((camera) => camera.id === scene.activeCameraId)) throw new Error(`Missing active camera ${scene.activeCameraId}.`);
    const nodeIds = new Set(scene.nodes.map((node) => node.id)), textureIds = new Set((scene.textures ?? []).map((texture) => texture.id)), skinIds = new Set((scene.skins ?? []).map((skin) => skin.id));
    if (scene.streaming) {
      if (!scene.streaming.worldId) throw new Error("Spatial streaming worldId is required.");
      const cellIds = /* @__PURE__ */ new Set();
      for (const cell of scene.streaming.cells) {
        if (!cell.id || cellIds.has(cell.id)) throw new Error(`Duplicate streaming cell ${cell.id}.`);
        cellIds.add(cell.id);
        if (!validVec3(cell.center) || !Number.isFinite(cell.radius) || cell.radius <= 0) throw new Error(`Streaming cell ${cell.id} bounds are invalid.`);
        for (const radius of [cell.loadRadius, cell.unloadRadius]) if (radius !== void 0 && (!Number.isFinite(radius) || radius < 0)) throw new Error(`Streaming cell ${cell.id} radius is invalid.`);
        if (cell.unloadRadius !== void 0 && cell.loadRadius !== void 0 && cell.unloadRadius < cell.loadRadius) throw new Error(`Streaming cell ${cell.id} unloadRadius must be >= loadRadius.`);
        for (const nodeId of cell.nodeIds) if (!nodeIds.has(nodeId)) throw new Error(`Streaming cell ${cell.id} missing node ${nodeId}.`);
      }
      for (const nodeId of scene.streaming.persistentNodeIds ?? []) if (!nodeIds.has(nodeId)) throw new Error(`Streaming persistent node ${nodeId} is missing.`);
    }
    if (scene.environment?.textureId && !textureIds.has(scene.environment.textureId)) throw new Error(`Environment missing texture ${scene.environment.textureId}.`);
    for (const skin of scene.skins ?? []) for (const joint of skin.joints) if (!nodeIds.has(joint)) throw new Error(`Skin ${skin.id} missing joint ${joint}.`);
    for (const material of scene.materials) {
      const bindings = [material.baseColorTextureId, material.metallicRoughnessTextureId, material.normalTextureId, material.occlusionTextureId, material.emissiveTextureId].filter((value) => Boolean(value));
      for (const textureId of bindings) if (!textureIds.has(textureId)) throw new Error(`Material ${material.id} missing texture ${textureId}.`);
    }
    for (const node of scene.nodes) {
      if (node.parentId && !nodeIds.has(node.parentId)) throw new Error(`Node ${node.id} missing parent ${node.parentId}.`);
      if (node.meshId && !scene.meshes.some((mesh) => mesh.id === node.meshId)) throw new Error(`Node ${node.id} missing mesh ${node.meshId}.`);
      if (node.materialId && !scene.materials.some((material) => material.id === node.materialId)) throw new Error(`Node ${node.id} missing material ${node.materialId}.`);
      if (node.skinId && !skinIds.has(node.skinId)) throw new Error(`Node ${node.id} missing skin ${node.skinId}.`);
    }
    const animationIds = /* @__PURE__ */ new Set();
    for (const clip of scene.animations ?? []) {
      if (animationIds.has(clip.id)) throw new Error(`Duplicate animation ${clip.id}.`);
      animationIds.add(clip.id);
      if (!Number.isFinite(clip.duration) || clip.duration < 0) throw new Error(`Animation ${clip.id} duration must be non-negative.`);
      for (const channel of clip.channels) {
        if (!nodeIds.has(channel.nodeId)) throw new Error(`Animation ${clip.id} missing node ${channel.nodeId}.`);
        const dimension = channel.path === "rotationQuaternion" ? 4 : 3;
        if (channel.times.length !== channel.values.length || !channel.times.length) throw new Error(`Animation ${clip.id} channel length mismatch.`);
        if (channel.interpolation === "CUBICSPLINE" && (channel.inTangents?.length !== channel.values.length || channel.outTangents?.length !== channel.values.length)) throw new Error(`Animation ${clip.id} cubic channel tangent length mismatch.`);
        for (let index = 0; index < channel.times.length; index++) {
          if (!Number.isFinite(channel.times[index]) || index > 0 && channel.times[index] < channel.times[index - 1]) throw new Error(`Animation ${clip.id} channel times must be finite and ordered.`);
          const value = channel.values[index];
          if (value.length !== dimension || value.some((component) => !Number.isFinite(component))) throw new Error(`Animation ${clip.id} channel value dimension mismatch.`);
          for (const tangent of [channel.inTangents?.[index], channel.outTangents?.[index]]) if (tangent && (tangent.length !== dimension || tangent.some((component) => !Number.isFinite(component)))) throw new Error(`Animation ${clip.id} channel tangent dimension mismatch.`);
        }
      }
    }
  }
  function resolveSpatialStreaming(scene, observerPosition, options = {}) {
    const config = scene.streaming;
    if (!config) return void 0;
    const defaultLoadRadius = Math.max(0, options.loadRadius ?? 64), defaultUnloadRadius = Math.max(defaultLoadRadius, options.unloadRadius ?? defaultLoadRadius * 1.25), cells = [...config.cells].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.id.localeCompare(b.id)), cellIds = new Set(cells.map((cell) => cell.id));
    const previousActiveCellIds = [...options.previousActiveCellIds ?? []].filter((id, index, array) => cellIds.has(id) && array.indexOf(id) === index).sort(), forcedCellIds = [...options.forcedCellIds ?? []].filter((id, index, array) => cellIds.has(id) && array.indexOf(id) === index).sort(), previous = new Set(previousActiveCellIds), forced = new Set(forcedCellIds), activeCellIds = [];
    for (const cell of cells) {
      const loadRadius = Math.max(0, cell.loadRadius ?? defaultLoadRadius), unloadRadius = Math.max(loadRadius, cell.unloadRadius ?? defaultUnloadRadius), threshold = previous.has(cell.id) ? unloadRadius : loadRadius;
      if (forced.has(cell.id) || distance3(observerPosition, cell.center) <= cell.radius + threshold) activeCellIds.push(cell.id);
    }
    const active = new Set(activeCellIds), enteredCellIds = activeCellIds.filter((id) => !previous.has(id)).sort(), exitedCellIds = previousActiveCellIds.filter((id) => !active.has(id)).sort(), persistentNodeIds = [...config.persistentNodeIds ?? []].filter((id, index, array) => array.indexOf(id) === index).sort(), streamedNodeSet = new Set(persistentNodeIds);
    for (const cell of cells) if (active.has(cell.id)) for (const nodeId of cell.nodeIds) streamedNodeSet.add(nodeId);
    const nodeIds = scene.nodes.filter((node) => streamedNodeSet.has(node.id)).map((node) => node.id), catalogRoot2 = cryptographicHash({ worldId: config.worldId, cells: config.cells, persistentNodeIds: config.persistentNodeIds ?? [] }), base = { format: VSR_SPATIAL_STREAMING_FORMAT, worldId: config.worldId, observerPosition: [...observerPosition], loadRadius: defaultLoadRadius, unloadRadius: defaultUnloadRadius, previousActiveCellIds, forcedCellIds, activeCellIds: [...activeCellIds].sort(), enteredCellIds, exitedCellIds, persistentNodeIds, nodeIds, catalogRoot: catalogRoot2 };
    return { ...base, root: cryptographicHash(base) };
  }
  function lerpVec3(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function hermiteVec3(a, b, outTangent, inTangent, t, span) {
    const t2 = t * t, t3 = t2 * t, h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
    return [h00 * a[0] + h10 * span * outTangent[0] + h01 * b[0] + h11 * span * inTangent[0], h00 * a[1] + h10 * span * outTangent[1] + h01 * b[1] + h11 * span * inTangent[1], h00 * a[2] + h10 * span * outTangent[2] + h01 * b[2] + h11 * span * inTangent[2]];
  }
  function hermiteVec4(a, b, outTangent, inTangent, t, span) {
    const t2 = t * t, t3 = t2 * t, h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
    return [h00 * a[0] + h10 * span * outTangent[0] + h01 * b[0] + h11 * span * inTangent[0], h00 * a[1] + h10 * span * outTangent[1] + h01 * b[1] + h11 * span * inTangent[1], h00 * a[2] + h10 * span * outTangent[2] + h01 * b[2] + h11 * span * inTangent[2], h00 * a[3] + h10 * span * outTangent[3] + h01 * b[3] + h11 * span * inTangent[3]];
  }
  function sampleAnimationValue(channel, index, nextIndex, alpha, span) {
    const a = channel.values[index], b = channel.values[nextIndex];
    if (channel.interpolation === "STEP") return channel.path === "rotationQuaternion" ? normalizeQuaternion(a) : a;
    if (channel.path === "rotationQuaternion") {
      if (channel.interpolation === "CUBICSPLINE" && channel.outTangents?.[index] && channel.inTangents?.[nextIndex]) return normalizeQuaternion(hermiteVec4(a, b, channel.outTangents[index], channel.inTangents[nextIndex], alpha, span));
      return quaternionSlerp(a, b, alpha);
    }
    if (channel.interpolation === "CUBICSPLINE" && channel.outTangents?.[index] && channel.inTangents?.[nextIndex]) return hermiteVec3(a, b, channel.outTangents[index], channel.inTangents[nextIndex], alpha, span);
    return lerpVec3(a, b, alpha);
  }
  function sampleSpatialAnimation(scene, clipId, timeSeconds, loop = true) {
    const clip = (scene.animations ?? []).find((entry) => entry.id === clipId);
    if (!clip) throw new Error(`Missing animation ${clipId}.`);
    const t = clip.duration > 0 ? loop ? (timeSeconds % clip.duration + clip.duration) % clip.duration : clamp(timeSeconds, 0, clip.duration) : 0, out = /* @__PURE__ */ new Map();
    for (const channel of clip.channels) {
      let index = 0;
      while (index < channel.times.length - 2 && t >= channel.times[index + 1]) index++;
      const nextIndex = Math.min(index + 1, channel.times.length - 1), aTime = channel.times[index], bTime = channel.times[nextIndex], span = Math.max(EPS, bTime - aTime), alpha = channel.interpolation === "STEP" ? 0 : clamp((t - aTime) / span, 0, 1), value = sampleAnimationValue(channel, index, nextIndex, alpha, span), current = out.get(channel.nodeId) ?? {};
      if (channel.path === "translation") current.translation = value;
      else if (channel.path === "scale") current.scale = value;
      else if (channel.path === "rotationQuaternion") current.rotationQuaternion = value;
      else current.rotationEulerDeg = value;
      out.set(channel.nodeId, current);
    }
    return out;
  }
  var zero3 = [0, 0, 0];
  var one3 = [1, 1, 1];
  var identityQuaternion = [0, 0, 0, 1];
  function weightedVec3(accumulator, nodeId, path, value, weight) {
    const current = accumulator.get(nodeId) ?? {};
    const target = current[path] ?? { sum: [0, 0, 0], weight: 0 };
    target.sum = [target.sum[0] + value[0] * weight, target.sum[1] + value[1] * weight, target.sum[2] + value[2] * weight];
    target.weight += weight;
    current[path] = target;
    accumulator.set(nodeId, current);
  }
  function weightedQuaternion(accumulator, nodeId, value, weight) {
    const current = accumulator.get(nodeId) ?? {}, target = current.rotationQuaternion ?? { entries: [] };
    target.entries.push({ value: normalizeQuaternion(value), weight });
    current.rotationQuaternion = target;
    accumulator.set(nodeId, current);
  }
  function blendVec3(base, target, defaultValue) {
    if (!target || target.weight <= EPS) return void 0;
    const baseWeight = Math.max(0, 1 - target.weight), total = baseWeight + target.weight, source = base ?? defaultValue;
    return [(source[0] * baseWeight + target.sum[0]) / total, (source[1] * baseWeight + target.sum[1]) / total, (source[2] * baseWeight + target.sum[2]) / total];
  }
  function blendQuaternion(base, target) {
    if (!target || !target.entries.length) return void 0;
    const weight = target.entries.reduce((sum, entry) => sum + entry.weight, 0), entries = [{ value: normalizeQuaternion(base ?? identityQuaternion), weight: Math.max(0, 1 - weight) }, ...target.entries].filter((entry) => entry.weight > EPS);
    if (!entries.length) return void 0;
    let result = entries[0].value, total = entries[0].weight;
    for (const entry of entries.slice(1)) {
      const alpha = entry.weight / (total + entry.weight);
      result = quaternionSlerp(result, entry.value, alpha);
      total += entry.weight;
    }
    return normalizeQuaternion(result);
  }
  function quaternionMultiply(a, b) {
    return normalizeQuaternion([a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]]);
  }
  function quaternionInverse(value) {
    const normalized = normalizeQuaternion(value);
    return [-normalized[0], -normalized[1], -normalized[2], normalized[3]];
  }
  function masked(layer, nodeId) {
    return !layer.nodeIds || layer.nodeIds.includes(nodeId);
  }
  function applyAdditiveTransform(result, sample, reference, weight) {
    if (sample.translation) {
      const base = result.translation ?? zero3, rest = reference.translation ?? zero3;
      result.translation = [base[0] + (sample.translation[0] - rest[0]) * weight, base[1] + (sample.translation[1] - rest[1]) * weight, base[2] + (sample.translation[2] - rest[2]) * weight];
    }
    if (sample.scale) {
      const base = result.scale ?? one3, rest = reference.scale ?? one3;
      result.scale = base.map((value, index) => value * (sample.scale[index] / (Math.abs(rest[index]) < EPS ? 1 : rest[index])) ** weight);
    }
    if (sample.rotationEulerDeg) {
      const base = result.rotationEulerDeg ?? [0, 0, 0], rest = reference.rotationEulerDeg ?? [0, 0, 0];
      result.rotationEulerDeg = [base[0] + (sample.rotationEulerDeg[0] - rest[0]) * weight, base[1] + (sample.rotationEulerDeg[1] - rest[1]) * weight, base[2] + (sample.rotationEulerDeg[2] - rest[2]) * weight];
      delete result.rotationQuaternion;
    }
    if (sample.rotationQuaternion) {
      const base = result.rotationQuaternion ?? identityQuaternion, rest = reference.rotationQuaternion ?? identityQuaternion, delta = quaternionMultiply(quaternionInverse(rest), sample.rotationQuaternion);
      result.rotationQuaternion = quaternionMultiply(base, quaternionSlerp(identityQuaternion, delta, weight));
      delete result.rotationEulerDeg;
    }
  }
  function sampleSpatialAnimationLayers(scene, layers) {
    const overrides = /* @__PURE__ */ new Map(), additives = /* @__PURE__ */ new Map();
    for (const layer of layers) {
      const weight = clamp(layer.weight ?? 1, 0, 1);
      if (weight <= EPS) continue;
      const sample = sampleSpatialAnimation(scene, layer.clipId, layer.timeSeconds, layer.loop ?? true), reference = layer.mode === "additive" ? sampleSpatialAnimation(scene, layer.clipId, 0, false) : void 0;
      for (const [nodeId, transform] of sample) {
        if (!masked(layer, nodeId)) continue;
        if (layer.mode === "additive") {
          const list = additives.get(nodeId) ?? [];
          list.push({ sample: transform, reference: reference?.get(nodeId) ?? {}, weight });
          additives.set(nodeId, list);
          continue;
        }
        if (transform.translation) weightedVec3(overrides, nodeId, "translation", transform.translation, weight);
        if (transform.rotationEulerDeg) weightedVec3(overrides, nodeId, "rotationEulerDeg", transform.rotationEulerDeg, weight);
        if (transform.rotationQuaternion) weightedQuaternion(overrides, nodeId, transform.rotationQuaternion, weight);
        if (transform.scale) weightedVec3(overrides, nodeId, "scale", transform.scale, weight);
      }
    }
    const nodeById = new Map(scene.nodes.map((node) => [node.id, node])), nodeIds = /* @__PURE__ */ new Set([...overrides.keys(), ...additives.keys()]), result = /* @__PURE__ */ new Map();
    for (const nodeId of nodeIds) {
      const base = nodeById.get(nodeId)?.transform ?? {}, accumulator = overrides.get(nodeId), transform = { ...base };
      const translation = blendVec3(base.translation, accumulator?.translation, zero3), rotationEulerDeg = blendVec3(base.rotationEulerDeg, accumulator?.rotationEulerDeg, zero3), scale = blendVec3(base.scale, accumulator?.scale, one3), rotationQuaternion = blendQuaternion(base.rotationQuaternion, accumulator?.rotationQuaternion);
      if (translation) transform.translation = translation;
      if (scale) transform.scale = scale;
      if (rotationQuaternion) {
        transform.rotationQuaternion = rotationQuaternion;
        delete transform.rotationEulerDeg;
      } else if (rotationEulerDeg) {
        transform.rotationEulerDeg = rotationEulerDeg;
        delete transform.rotationQuaternion;
      }
      for (const additive of additives.get(nodeId) ?? []) applyAdditiveTransform(transform, additive.sample, additive.reference, additive.weight);
      result.set(nodeId, transform);
    }
    return result;
  }
  function sampleSpatialAnimationGraph(scene, input) {
    const states = new Map(input.graph.states.map((state2) => [state2.id, state2])), transition = input.transition;
    if (transition) {
      const from = states.get(transition.fromStateId), to = states.get(transition.toStateId);
      if (!from || !to) throw new Error("Animation graph transition references an unknown state.");
      const progress = clamp(transition.progress, 0, 1), time = input.timeSeconds;
      return sampleSpatialAnimationLayers(scene, [{ clipId: from.clipId, timeSeconds: time * (from.speed ?? 1), loop: from.loop ?? true, weight: 1 - progress, nodeIds: from.nodeIds }, { clipId: to.clipId, timeSeconds: time * (to.speed ?? 1), loop: to.loop ?? true, weight: progress, nodeIds: to.nodeIds }]);
    }
    const state = states.get(input.stateId ?? input.graph.initialState);
    if (!state) throw new Error(`Animation graph state ${input.stateId ?? input.graph.initialState} is missing.`);
    return sampleSpatialAnimationLayers(scene, [{ clipId: state.clipId, timeSeconds: input.timeSeconds * (state.speed ?? 1), loop: state.loop ?? true, nodeIds: state.nodeIds }]);
  }
  function cloneSpatialTransform(transform = {}) {
    return {
      ...transform,
      ...transform.translation ? { translation: [...transform.translation] } : {},
      ...transform.rotationEulerDeg ? { rotationEulerDeg: [...transform.rotationEulerDeg] } : {},
      ...transform.rotationQuaternion ? { rotationQuaternion: [...transform.rotationQuaternion] } : {},
      ...transform.scale ? { scale: [...transform.scale] } : {}
    };
  }
  function quaternionFromRotationMatrix(matrix) {
    const x = normalize3([matrix[0], matrix[4], matrix[8]]), y = normalize3([matrix[1], matrix[5], matrix[9]]), z = normalize3([matrix[2], matrix[6], matrix[10]]), m00 = x[0], m01 = y[0], m02 = z[0], m10 = x[1], m11 = y[1], m12 = z[1], m20 = x[2], m21 = y[2], m22 = z[2], trace = m00 + m11 + m22;
    if (trace > 0) {
      const scale2 = Math.sqrt(trace + 1) * 2;
      return normalizeQuaternion([(m21 - m12) / scale2, (m02 - m20) / scale2, (m10 - m01) / scale2, 0.25 * scale2]);
    }
    if (m00 > m11 && m00 > m22) {
      const scale2 = Math.sqrt(1 + m00 - m11 - m22) * 2;
      return normalizeQuaternion([0.25 * scale2, (m01 + m10) / scale2, (m02 + m20) / scale2, (m21 - m12) / scale2]);
    }
    if (m11 > m22) {
      const scale2 = Math.sqrt(1 + m11 - m00 - m22) * 2;
      return normalizeQuaternion([(m01 + m10) / scale2, 0.25 * scale2, (m12 + m21) / scale2, (m02 - m20) / scale2]);
    }
    const scale = Math.sqrt(1 + m22 - m00 - m11) * 2;
    return normalizeQuaternion([(m02 + m20) / scale, (m12 + m21) / scale, 0.25 * scale, (m10 - m01) / scale]);
  }
  function quaternionFromBasis(right, up, back) {
    return quaternionFromRotationMatrix([right[0], up[0], back[0], 0, right[1], up[1], back[1], 0, right[2], up[2], back[2], 0, 0, 0, 0, 1]);
  }
  function quaternionFromAxisAngle(axis, angle) {
    const half = angle / 2, s = Math.sin(half), unit = normalize3(axis);
    return normalizeQuaternion([unit[0] * s, unit[1] * s, unit[2] * s, Math.cos(half)]);
  }
  function quaternionFromTo(fromValue, toValue) {
    const from = normalize3(fromValue), to = normalize3(toValue), cosine = clamp(dot3(from, to), -1, 1);
    if (length3(from) < EPS || length3(to) < EPS || cosine > 1 - EPS) return identityQuaternion;
    if (cosine < -1 + EPS) {
      const axis2 = normalize3(cross3(from, Math.abs(from[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]));
      return quaternionFromAxisAngle(axis2, Math.PI);
    }
    const axis = cross3(from, to), scale = Math.sqrt((1 + cosine) * 2), inverseScale = 1 / scale;
    return normalizeQuaternion([axis[0] * inverseScale, axis[1] * inverseScale, axis[2] * inverseScale, scale * 0.5]);
  }
  function effectiveNodeTransform(scene, overrides, nodeId) {
    const node = scene.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) throw new Error(`Animation constraint references missing node ${nodeId}.`);
    return cloneSpatialTransform({ ...node.transform, ...overrides.get(nodeId) ?? {} });
  }
  function setWorldRotation(scene, overrides, nodeId, desiredWorldRotation, weight) {
    if (weight <= EPS) return;
    const node = scene.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) throw new Error(`Animation constraint references missing node ${nodeId}.`);
    const matrices = worldMatrices(scene, overrides), currentWorldRotation = quaternionFromRotationMatrix(matrices.get(nodeId)), blendedWorldRotation = quaternionSlerp(currentWorldRotation, desiredWorldRotation, clamp(weight, 0, 1)), parentWorldRotation = node.parentId ? quaternionFromRotationMatrix(matrices.get(node.parentId)) : identityQuaternion, next = effectiveNodeTransform(scene, overrides, nodeId);
    next.rotationQuaternion = quaternionMultiply(quaternionInverse(parentWorldRotation), blendedWorldRotation);
    delete next.rotationEulerDeg;
    overrides.set(nodeId, next);
  }
  function applyLookAtConstraint(scene, overrides, constraint) {
    const matrices = worldMatrices(scene, overrides), nodeWorld = matrices.get(constraint.nodeId), position = transformPoint3(nodeWorld, [0, 0, 0]), direction = normalize3(sub3(constraint.target, position));
    if (length3(direction) < EPS) return;
    const requestedUp = normalize3(constraint.up ?? [0, 1, 0]);
    let right = normalize3(cross3(direction, requestedUp));
    if (length3(right) < EPS) right = normalize3(cross3(direction, Math.abs(direction[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
    const up = normalize3(cross3(right, direction)), desiredWorldRotation = quaternionFromBasis(right, up, scale3(direction, -1));
    setWorldRotation(scene, overrides, constraint.nodeId, desiredWorldRotation, constraint.weight ?? 1);
  }
  function applyTwoBoneIKConstraint(scene, overrides, constraint) {
    const nodeById = new Map(scene.nodes.map((node) => [node.id, node])), root = nodeById.get(constraint.rootNodeId), mid = nodeById.get(constraint.midNodeId), end = nodeById.get(constraint.endNodeId);
    if (!root || !mid || !end) throw new Error("Animation two-bone IK references a missing node.");
    if (mid.parentId !== root.id || end.parentId !== mid.id) throw new Error("Animation two-bone IK requires a root -> mid -> end chain.");
    const matrices = worldMatrices(scene, overrides), rootPosition = transformPoint3(matrices.get(root.id), [0, 0, 0]), midPosition = transformPoint3(matrices.get(mid.id), [0, 0, 0]), endPosition = transformPoint3(matrices.get(end.id), [0, 0, 0]), rootLength = distance3(rootPosition, midPosition), midLength = distance3(midPosition, endPosition);
    if (rootLength < EPS || midLength < EPS) throw new Error("Animation two-bone IK requires non-zero bone lengths.");
    const rawTargetVector = sub3(constraint.target, rootPosition), rawTargetDistance = length3(rawTargetVector), targetDirection = rawTargetDistance < EPS ? normalize3(sub3(endPosition, rootPosition)) : normalize3(rawTargetVector), minimumDistance = Math.abs(rootLength - midLength) + EPS, maximumDistance = Math.max(minimumDistance, rootLength + midLength - EPS), targetDistance = clamp(rawTargetDistance, minimumDistance, maximumDistance), solvedEnd = add3(rootPosition, scale3(targetDirection, targetDistance));
    const poleDirection = normalize3(sub3(constraint.pole ?? midPosition, rootPosition));
    let planeNormal = normalize3(cross3(targetDirection, poleDirection));
    if (length3(planeNormal) < EPS) planeNormal = normalize3(cross3(targetDirection, normalize3(sub3(midPosition, rootPosition))));
    if (length3(planeNormal) < EPS) planeNormal = normalize3(cross3(targetDirection, Math.abs(targetDirection[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
    const bendDirection = normalize3(cross3(planeNormal, targetDirection)), cosine = clamp((rootLength * rootLength + targetDistance * targetDistance - midLength * midLength) / (2 * rootLength * targetDistance), -1, 1), sine = Math.sqrt(Math.max(0, 1 - cosine * cosine)), solvedMid = add3(rootPosition, scale3(add3(scale3(targetDirection, cosine), scale3(bendDirection, sine)), rootLength)), currentRootDirection = normalize3(sub3(midPosition, rootPosition)), desiredRootDirection = normalize3(sub3(solvedMid, rootPosition));
    const rootDelta = quaternionFromTo(currentRootDirection, desiredRootDirection), rootWorldRotation = quaternionFromRotationMatrix(matrices.get(root.id));
    setWorldRotation(scene, overrides, root.id, quaternionMultiply(rootDelta, rootWorldRotation), constraint.weight ?? 1);
    const afterRoot = worldMatrices(scene, overrides), afterMidPosition = transformPoint3(afterRoot.get(mid.id), [0, 0, 0]), afterEndPosition = transformPoint3(afterRoot.get(end.id), [0, 0, 0]), currentEndDirection = normalize3(sub3(afterEndPosition, afterMidPosition)), desiredEndDirection = normalize3(sub3(solvedEnd, afterMidPosition));
    if (length3(currentEndDirection) >= EPS && length3(desiredEndDirection) >= EPS) {
      const midDelta = quaternionFromTo(currentEndDirection, desiredEndDirection), midWorldRotation = quaternionFromRotationMatrix(afterRoot.get(mid.id));
      setWorldRotation(scene, overrides, mid.id, quaternionMultiply(midDelta, midWorldRotation), constraint.weight ?? 1);
    }
  }
  function validVec3(value) {
    return Array.isArray(value) && value.length === 3 && value.every((component) => typeof component === "number" && Number.isFinite(component));
  }
  function validAnimationConstraint(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const constraint = value, weight = constraint.weight;
    if (weight !== void 0 && (typeof weight !== "number" || !Number.isFinite(weight) || weight < 0 || weight > 1) || !validVec3(constraint.target)) return false;
    if (constraint.type === "look-at") return typeof constraint.nodeId === "string" && constraint.nodeId.length > 0 && (constraint.up === void 0 || constraint.up === null || validVec3(constraint.up));
    return constraint.type === "two-bone-ik" && typeof constraint.rootNodeId === "string" && constraint.rootNodeId.length > 0 && typeof constraint.midNodeId === "string" && constraint.midNodeId.length > 0 && typeof constraint.endNodeId === "string" && constraint.endNodeId.length > 0 && (constraint.pole === void 0 || constraint.pole === null || validVec3(constraint.pole));
  }
  function validateAnimationConstraints(scene, constraints) {
    if (!Array.isArray(constraints)) throw new TypeError("animationConstraints must be an array.");
    const nodeIds = new Set(scene.nodes.map((node) => node.id));
    for (const constraint of constraints) {
      if (!validAnimationConstraint(constraint)) throw new TypeError("animation constraint is invalid.");
      const ids = constraint.type === "look-at" ? [constraint.nodeId] : [constraint.rootNodeId, constraint.midNodeId, constraint.endNodeId];
      for (const id of ids) if (!nodeIds.has(id)) throw new Error(`Animation constraint references missing node ${id}.`);
      if (constraint.type === "two-bone-ik") {
        const root = scene.nodes.find((node) => node.id === constraint.rootNodeId), mid = scene.nodes.find((node) => node.id === constraint.midNodeId), end = scene.nodes.find((node) => node.id === constraint.endNodeId);
        if (mid.parentId !== root.id || end.parentId !== mid.id) throw new Error("Animation two-bone IK requires a root -> mid -> end chain.");
      }
    }
  }
  function applySpatialAnimationConstraints(scene, baseOverrides, constraints = []) {
    validateAnimationConstraints(scene, constraints);
    const overrides = new Map([...baseOverrides.entries()].map(([nodeId, transform]) => [nodeId, cloneSpatialTransform(transform)]));
    for (const constraint of constraints) {
      if (constraint.type === "look-at") applyLookAtConstraint(scene, overrides, constraint);
      else applyTwoBoneIKConstraint(scene, overrides, constraint);
    }
    return overrides;
  }
  function verifySpatialVisualIntent(value) {
    const diagnostics = [];
    if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, diagnostics: ["visual intent must be an object"] };
    const intent = value;
    if (intent.format !== VSR_SPATIAL_VISUAL_INTENT_FORMAT) diagnostics.push("visual intent format mismatch");
    if (intent.version !== VSR_SPATIAL_VISUAL_INTENT_VERSION) diagnostics.push("visual intent version mismatch");
    if (typeof intent.sourceAssetId !== "string" || intent.sourceAssetId.trim() === "") diagnostics.push("visual intent sourceAssetId is required");
    if (typeof intent.root !== "string" || intent.root.length === 0) diagnostics.push("visual intent root is required");
    const hasAnimation = Boolean(intent.animation), hasLayers = Array.isArray(intent.animationLayers) && intent.animationLayers.length > 0, hasGraph = Boolean(intent.animationGraph), hasConstraints = Array.isArray(intent.animationConstraints) && intent.animationConstraints.length > 0;
    if (!hasAnimation && !hasLayers && !hasGraph && !hasConstraints) diagnostics.push("visual intent has no animation or constraint selection");
    if (intent.animation && !validAnimation(intent.animation)) diagnostics.push("visual intent animation is invalid");
    if (intent.animationLayers && !validLayers(intent.animationLayers)) diagnostics.push("visual intent animationLayers are invalid");
    if (intent.animationGraph && !validGraph(intent.animationGraph)) diagnostics.push("visual intent animationGraph is invalid");
    if (intent.animationConstraints && !intent.animationConstraints.every(validAnimationConstraint)) diagnostics.push("visual intent animationConstraints are invalid");
    if (intent.deformation && !validDeformation(intent.deformation)) diagnostics.push("visual intent deformation is invalid");
    let expectedRoot;
    if (diagnostics.length === 0) {
      const { root: actualRoot, ...payload } = intent;
      expectedRoot = cryptographicHash(payload);
      if (actualRoot !== expectedRoot) diagnostics.push("visual intent root mismatch");
    }
    return { ok: diagnostics.length === 0, diagnostics, expectedRoot, actualRoot: typeof intent.root === "string" ? intent.root : void 0 };
  }
  function compileSpatialFrameFromVisualIntent(scene, intent, options = {}) {
    const verification = verifySpatialVisualIntent(intent);
    if (!verification.ok) throw new Error(verification.diagnostics.join("; "));
    if (intent.sceneId && intent.sceneId !== scene.sceneId) throw new Error(`visual intent scene ${intent.sceneId} does not match ${scene.sceneId}`);
    const deformation = intent.deformation;
    if (deformation && !scene.nodes.some((node) => node.id === deformation.nodeId)) throw new Error(`visual intent deformation node ${deformation.nodeId} is missing`);
    if (deformation?.skinId && !scene.skins?.some((skin) => skin.id === deformation.skinId)) throw new Error(`visual intent skin ${deformation.skinId} is missing`);
    const sceneWithDeformation = deformation ? { ...scene, nodes: scene.nodes.map((node) => node.id === deformation.nodeId ? { ...node, ...deformation.skinId ? { skinId: deformation.skinId } : {}, ...deformation.morphWeights ? { morphWeights: [...deformation.morphWeights] } : {} } : node) } : scene;
    const animationLayers = intent.animationLayers ?? (intent.animation && intent.nodeIds?.length ? [{ ...intent.animation, weight: 1, mode: "override", nodeIds: [...intent.nodeIds] }] : void 0);
    return compileSpatialFrame(sceneWithDeformation, { ...options, animation: intent.animation ?? void 0, animationLayers, animationGraph: intent.animationGraph ?? void 0, animationConstraints: intent.animationConstraints ?? void 0, visualIntentRoot: intent.root });
  }
  function validAnimation(value) {
    return Boolean(value && typeof value.clipId === "string" && value.clipId.length > 0 && Number.isFinite(value.timeSeconds) && value.timeSeconds >= 0 && (value.loop === void 0 || typeof value.loop === "boolean"));
  }
  function validLayers(value) {
    return value.every((layer) => typeof layer.clipId === "string" && layer.clipId.length > 0 && Number.isFinite(layer.timeSeconds) && layer.timeSeconds >= 0 && (layer.weight === void 0 || Number.isFinite(layer.weight) && layer.weight >= 0 && layer.weight <= 1) && (layer.loop === void 0 || typeof layer.loop === "boolean") && (layer.mode === void 0 || layer.mode === "override" || layer.mode === "additive") && (layer.nodeIds === void 0 || layer.nodeIds.every((nodeId) => typeof nodeId === "string" && nodeId.length > 0)));
  }
  function validGraph(value) {
    return Boolean(value && Number.isFinite(value.timeSeconds) && value.timeSeconds >= 0 && value.graph && typeof value.graph.initialState === "string" && value.graph.states.length > 0 && value.graph.states.every((state) => typeof state.id === "string" && state.id.length > 0 && typeof state.clipId === "string" && state.clipId.length > 0 && (state.speed === void 0 || Number.isFinite(state.speed) && state.speed > 0)) && (value.transition === void 0 || Number.isFinite(value.transition.progress) && value.transition.progress >= 0 && value.transition.progress <= 1));
  }
  function validDeformation(value) {
    return typeof value.nodeId === "string" && value.nodeId.length > 0 && (value.skinId === void 0 || value.skinId === null || typeof value.skinId === "string" && value.skinId.length > 0) && (value.morphWeights === void 0 || value.morphWeights === null || value.morphWeights.length <= 4 && value.morphWeights.every((weight) => Number.isFinite(weight) && weight >= -1 && weight <= 1)) && (Boolean(value.skinId) || Boolean(value.morphWeights));
  }
  function worldMatrices(scene, overrides = /* @__PURE__ */ new Map()) {
    const byId = new Map(scene.nodes.map((node) => [node.id, node])), cache = /* @__PURE__ */ new Map(), visiting = /* @__PURE__ */ new Set();
    const resolve = (id) => {
      const cached = cache.get(id);
      if (cached) return cached;
      if (visiting.has(id)) throw new Error(`Node hierarchy cycle at ${id}.`);
      visiting.add(id);
      const node = byId.get(id), override = overrides.get(id) ?? {}, effective = { ...node.transform, ...override }, local = transformToMat4(effective), world = node.parentId ? multiplyMat4(resolve(node.parentId), local) : local;
      cache.set(id, world);
      visiting.delete(id);
      return world;
    };
    for (const node of scene.nodes) resolve(node.id);
    return cache;
  }
  function resolveSpatialMorphWeights(mesh, node) {
    return (mesh.morphTargets ?? []).slice(0, 4).map((target, index) => clamp(node.morphWeights?.[index] ?? target.defaultWeight ?? 0, -1, 1));
  }
  function resolveSpatialDeformation(mesh, node, skinById, world) {
    const skin = node.skinId ? skinById.get(node.skinId) : void 0, jointMatrices = skin ? skin.joints.map((joint, index) => multiplyMat4(world.get(joint), skin.inverseBindMatrices?.[index] ?? identityMat4())) : [identityMat4()], morphWeights = resolveSpatialMorphWeights(mesh, node), base = { skinId: skin?.id ?? null, jointMatrices, morphWeights };
    return { skinId: skin?.id, jointMatrices, morphWeights, deformationRoot: cryptographicHash(base) };
  }
  function deformSpatialMesh(mesh, packet) {
    const targets = mesh.morphTargets?.slice(0, 4) ?? [], weights = packet.morphWeights, hasMorph = targets.some((target, index) => Math.abs(weights[index] ?? 0) > EPS), hasSkin = Boolean(packet.skinId), hasDeformation = hasMorph || hasSkin;
    if (!hasDeformation) return mesh;
    const positions = mesh.positions.slice(), normals = (mesh.normals ?? calculateMeshNormals({ ...mesh, morphTargets: void 0 })).slice();
    for (let targetIndex = 0; targetIndex < targets.length; targetIndex++) {
      const weight = weights[targetIndex] ?? 0;
      if (Math.abs(weight) < EPS) continue;
      const target = targets[targetIndex];
      for (let index = 0; index < positions.length; index++) positions[index] += target.positions[index] * weight;
      for (let index = 0; index < (target.normals?.length ?? 0); index++) normals[index] += target.normals[index] * weight;
    }
    if (hasSkin) {
      for (let vertex = 0; vertex < positions.length / 3; vertex++) {
        const position = [positions[vertex * 3], positions[vertex * 3 + 1], positions[vertex * 3 + 2]], normal = [normals[vertex * 3], normals[vertex * 3 + 1], normals[vertex * 3 + 2]], indices = mesh.jointIndices?.slice(vertex * 4, vertex * 4 + 4) ?? [0, 0, 0, 0], jointWeights = mesh.jointWeights?.slice(vertex * 4, vertex * 4 + 4) ?? [1, 0, 0, 0];
        let skinnedPosition = [0, 0, 0], skinnedNormal = [0, 0, 0];
        for (let influence = 0; influence < 4; influence++) {
          const weight = jointWeights[influence] ?? 0, matrix = packet.jointMatrices[indices[influence] ?? 0] ?? identityMat4();
          if (weight <= EPS) continue;
          skinnedPosition = add3(skinnedPosition, scale3(transformPoint3(matrix, position), weight));
          skinnedNormal = add3(skinnedNormal, scale3(transformDirection3(matrix, normal), weight));
        }
        positions[vertex * 3] = skinnedPosition[0];
        positions[vertex * 3 + 1] = skinnedPosition[1];
        positions[vertex * 3 + 2] = skinnedPosition[2];
        normals[vertex * 3] = skinnedNormal[0];
        normals[vertex * 3 + 1] = skinnedNormal[1];
        normals[vertex * 3 + 2] = skinnedNormal[2];
      }
    }
    return { ...mesh, positions, normals, morphTargets: void 0 };
  }
  function chooseLOD(node, distance, bias) {
    const lods = [...node.lods ?? []].sort((a, b) => a.maxDistance - b.maxDistance);
    for (let i = 0; i < lods.length; i++) if (distance <= lods[i].maxDistance * bias) return { meshId: lods[i].meshId, level: i };
    return { meshId: node.meshId ?? lods.at(-1)?.meshId, level: lods.length };
  }
  function sphereInFrustum(bounds, viewProjection) {
    const clip = transformVec4(viewProjection, [bounds.center[0], bounds.center[1], bounds.center[2], 1]);
    if (clip[3] <= 0) return false;
    const margin = bounds.radius * Math.max(Math.abs(viewProjection[0]), Math.abs(viewProjection[5]), 1);
    return clip[0] >= -clip[3] - margin && clip[0] <= clip[3] + margin && clip[1] >= -clip[3] - margin && clip[1] <= clip[3] + margin && clip[2] >= -clip[3] - margin && clip[2] <= clip[3] + margin;
  }
  function packetInstances(packet) {
    return packet.instances?.length ? packet.instances : [{ nodeId: packet.nodeId, worldMatrix: packet.worldMatrix, worldBounds: packet.worldBounds, distanceToCamera: packet.distanceToCamera }];
  }
  function packetInstanceCount(packet) {
    return packet.instanceCount ?? packetInstances(packet).length;
  }
  function mergeSpatialBounds(a, b) {
    const min = [Math.min(a.min[0], b.min[0]), Math.min(a.min[1], b.min[1]), Math.min(a.min[2], b.min[2])], max = [Math.max(a.max[0], b.max[0]), Math.max(a.max[1], b.max[1]), Math.max(a.max[2], b.max[2])], center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    return { min, max, center, radius: Math.max(distance3(min, center), distance3(max, center)) };
  }
  var VSR_SPATIAL_VERTEX_WGSL_V04 = `struct Camera { viewProjection: mat4x4<f32>, cameraPosition:vec4<f32>, ambient:vec4<f32>, sunDirection:vec4<f32>, sunColor:vec4<f32>, environmentDiffuse:vec4<f32>, environmentSpecular:vec4<f32>, environmentParams:vec4<f32> }; @group(0) @binding(0) var<uniform> camera: Camera; struct Object { world:mat4x4<f32> }; @group(1) @binding(0) var<uniform> object:Object; @group(1) @binding(1) var<storage,read> jointMatrices:array<mat4x4<f32>>; struct Deformation { skinEnabled:f32, vertexCount:f32, morphCount:f32, _pad:f32, morphWeights:vec4<f32> }; @group(1) @binding(2) var<uniform> deformation:Deformation; @group(1) @binding(3) var<storage,read> morphDeltas:array<vec4<f32>>; @group(1) @binding(4) var<storage,read> instanceMatrices:array<mat4x4<f32>>; @group(1) @binding(5) var<storage,read> visibleInstanceIndices:array<u32>; struct VSIn { @location(0) position:vec3<f32>, @location(1) normal:vec3<f32>, @location(2) uv:vec2<f32>, @location(3) joints:vec4<f32>, @location(4) weights:vec4<f32>, @builtin(vertex_index) vertexIndex:u32, @builtin(instance_index) instanceIndex:u32 }; struct VSOut { @builtin(position) position:vec4<f32>, @location(0) worldPosition:vec3<f32>, @location(1) normal:vec3<f32>, @location(2) uv:vec2<f32> }; fn morphPosition(position:vec3<f32>,vertexIndex:u32)->vec3<f32>{var result=position;let vertexCount=u32(deformation.vertexCount);for(var morph:u32=0u;morph<4u;morph=morph+1u){if(morph<u32(deformation.morphCount)){result=result+morphDeltas[morph*vertexCount+vertexIndex].xyz*deformation.morphWeights[morph];}}return result;} fn skinPosition(position:vec3<f32>,joints:vec4<f32>,weights:vec4<f32>)->vec3<f32>{if(deformation.skinEnabled<0.5){return position;}let total=weights.x+weights.y+weights.z+weights.w;if(total<=0.0001){return position;}return(jointMatrices[u32(joints.x)]*vec4<f32>(position,1.0)*weights.x+jointMatrices[u32(joints.y)]*vec4<f32>(position,1.0)*weights.y+jointMatrices[u32(joints.z)]*vec4<f32>(position,1.0)*weights.z+jointMatrices[u32(joints.w)]*vec4<f32>(position,1.0)*weights.w).xyz/total;} fn skinNormal(normal:vec3<f32>,joints:vec4<f32>,weights:vec4<f32>)->vec3<f32>{if(deformation.skinEnabled<0.5){return normal;}let total=weights.x+weights.y+weights.z+weights.w;if(total<=0.0001){return normal;}return normalize((jointMatrices[u32(joints.x)]*vec4<f32>(normal,0.0)*weights.x+jointMatrices[u32(joints.y)]*vec4<f32>(normal,0.0)*weights.y+jointMatrices[u32(joints.z)]*vec4<f32>(normal,0.0)*weights.z+jointMatrices[u32(joints.w)]*vec4<f32>(normal,0.0)*weights.w).xyz);} @vertex fn vs_main(input:VSIn)->VSOut{var out:VSOut;let localPosition=skinPosition(morphPosition(input.position,input.vertexIndex),input.joints,input.weights);let instanceWorld=object.world*instanceMatrices[visibleInstanceIndices[input.instanceIndex]];let worldPosition=instanceWorld*vec4<f32>(localPosition,1.0);out.position=camera.viewProjection*worldPosition;out.worldPosition=worldPosition.xyz;out.normal=normalize((instanceWorld*vec4<f32>(skinNormal(input.normal,input.joints,input.weights),0.0)).xyz);out.uv=input.uv;return out;}`;
  var VSR_SPATIAL_FRAGMENT_WGSL_V04 = `
 struct ShadowCamera { lightViewProjection:mat4x4<f32>, params:vec4<f32> };
 @group(0) @binding(1) var shadowSampler:sampler;
 @group(0) @binding(2) var shadowMap:texture_depth_2d;
 @group(0) @binding(3) var<uniform> shadowCamera:ShadowCamera;
 @group(0) @binding(4) var environmentSampler:sampler;
 @group(0) @binding(5) var environmentTexture:texture_2d<f32>;
 struct Material { baseColor: vec4<f32>, params:vec4<f32>, emissive:vec4<f32>, advanced:vec4<f32> };
 @group(2) @binding(0) var<uniform> material:Material;
 @group(2) @binding(1) var baseColorSampler:sampler;
 @group(2) @binding(2) var baseColorTexture:texture_2d<f32>;
 @group(2) @binding(3) var metallicRoughnessSampler:sampler;
 @group(2) @binding(4) var metallicRoughnessTexture:texture_2d<f32>;
 @group(2) @binding(5) var normalSampler:sampler;
 @group(2) @binding(6) var normalTexture:texture_2d<f32>;
 @group(2) @binding(7) var occlusionSampler:sampler;
 @group(2) @binding(8) var occlusionTexture:texture_2d<f32>;
 @group(2) @binding(9) var emissiveSampler:sampler;
 @group(2) @binding(10) var emissiveTexture:texture_2d<f32>;
 const PI:f32=3.14159265359;
fn distributionGGX(nDotH:f32,roughness:f32)->f32{let a=roughness*roughness;let a2=a*a;let d=nDotH*nDotH*(a2-1.0)+1.0;return a2/max(PI*d*d,0.000001);}
fn geometrySchlickGGX(nDotV:f32,roughness:f32)->f32{let r=roughness+1.0;let k=(r*r)/8.0;return nDotV/max(nDotV*(1.0-k)+k,0.000001);}
fn geometrySmith(nDotV:f32,nDotL:f32,roughness:f32)->f32{return geometrySchlickGGX(nDotV,roughness)*geometrySchlickGGX(nDotL,roughness);}
fn fresnelSchlick(cosTheta:f32,f0:vec3<f32>)->vec3<f32>{return f0+(vec3<f32>(1.0)-f0)*pow(clamp(1.0-cosTheta,0.0,1.0),5.0);}
fn environmentUv(direction:vec3<f32>)->vec2<f32>{let d=normalize(direction);return vec2<f32>(0.5+atan2(d.z,d.x)/(PI*2.0),0.5+asin(clamp(d.y,-1.0,1.0))/PI);}
fn environmentSample(direction:vec3<f32>,fallback:vec3<f32>)->vec3<f32>{return select(fallback,textureSample(environmentTexture,environmentSampler,environmentUv(direction)).rgb,camera.environmentParams.x>0.5);}
 fn shadowVisibility(worldPosition:vec3<f32>)->f32{
   if(shadowCamera.params.x<0.5){return 1.0;}
   let clip=shadowCamera.lightViewProjection*vec4<f32>(worldPosition,1.0);if(clip.w<=0.0){return 1.0;}
   let uv=vec2<f32>(clip.x/clip.w*0.5+0.5,1.0-(clip.y/clip.w*0.5+0.5));if(any(uv<vec2<f32>(0.0))||any(uv>vec2<f32>(1.0))){return 1.0;}
   let depth=clip.z/clip.w*0.5+0.5;let shadowDepth=textureSampleLevel(shadowMap,shadowSampler,uv,0u);let visible=select(0.0,1.0,depth-shadowCamera.params.y<=shadowDepth);return mix(0.2,1.0,visible);
 }
 @fragment fn fs_main(@location(0) worldPosition:vec3<f32>,@location(1) normal:vec3<f32>,@location(2) uv:vec2<f32>)->@location(0) vec4<f32>{
   let n0=normalize(normal);let tangent=normalize(cross(select(vec3<f32>(1.0,0.0,0.0),vec3<f32>(0.0,1.0,0.0),abs(n0.y)>0.9),n0));let bitangent=normalize(cross(n0,tangent));let normalSample=textureSample(normalTexture,normalSampler,uv);let n=normalize(tangent*((normalSample.x*2.0-1.0))+bitangent*((normalSample.y*2.0-1.0))+n0*(normalSample.z*2.0-1.0));
   let baseSample=textureSample(baseColorTexture,baseColorSampler,uv);let baseColor=material.baseColor*baseSample;let metallicRoughness=textureSample(metallicRoughnessTexture,metallicRoughnessSampler,uv);let metallic=clamp(material.params.x*metallicRoughness.b,0.0,1.0);let roughness=max(material.params.y*metallicRoughness.g,0.04);let emissiveSample=textureSample(emissiveTexture,emissiveSampler,uv);let aoSample=textureSample(occlusionTexture,occlusionSampler,uv);
   let l=normalize(-camera.sunDirection.xyz);let v=normalize(camera.cameraPosition.xyz-worldPosition);let h=normalize(l+v);let emissiveStrength=material.params.z;let opacity=material.params.w*baseColor.a;
   let ao=mix(1.0,aoSample.r,material.advanced.x);let clearcoat=material.advanced.y;let clearcoatRoughness=max(material.advanced.z,0.04);let ior=max(material.advanced.w,1.0);
   let nDotL=max(dot(n,l),0.0);let nDotV=max(dot(n,v),0.0001);let nDotH=max(dot(n,h),0.0);let vDotH=max(dot(v,h),0.0);
   let dielectric=pow((ior-1.0)/(ior+1.0),2.0);let f0=mix(vec3<f32>(dielectric),baseColor.rgb,vec3<f32>(metallic));
   let f=fresnelSchlick(vDotH,f0);let environmentF=fresnelSchlick(nDotV,f0);let environmentKd=(vec3<f32>(1.0)-environmentF)*(1.0-metallic);let reflection=normalize(2.0*nDotV*n-v);let environmentDiffuseColor=environmentSample(n,camera.environmentDiffuse.rgb);let environmentSpecularColor=mix(environmentSample(reflection,camera.environmentSpecular.rgb),environmentDiffuseColor,roughness*roughness);let environmentDiffuse=environmentKd*baseColor.rgb/PI*environmentDiffuseColor*camera.environmentDiffuse.a*ao;let environmentSpecular=environmentSpecularColor*camera.environmentSpecular.a*environmentF*(0.35+0.65*(1.0-roughness));let d=distributionGGX(nDotH,roughness);let g=geometrySmith(nDotV,nDotL,roughness);
   let specular=f*(d*g/max(4.0*nDotV*nDotL,0.0001));let kd=(vec3<f32>(1.0)-f)*(1.0-metallic);let diffuse=kd*baseColor.rgb/PI;
   let coatF=fresnelSchlick(vDotH,vec3<f32>(0.04));let coatD=distributionGGX(nDotH,clearcoatRoughness);let coatG=geometrySmith(nDotV,nDotL,clearcoatRoughness);let coat=coatF*(coatD*coatG/max(4.0*nDotV*nDotL,0.0001))*clearcoat;
   let direct=(diffuse+specular+coat)*camera.sunColor.rgb*camera.sunColor.a*nDotL*shadowVisibility(worldPosition);
   let ambient=baseColor.rgb*camera.ambient.rgb*camera.ambient.a*ao;
   return vec4<f32>(environmentDiffuse+environmentSpecular+ambient+direct+material.emissive.rgb*emissiveSample.rgb*emissiveStrength,opacity);
 }`;
  var VSR_SPATIAL_SHADOW_WGSL_V04 = `struct ShadowCamera { lightViewProjection:mat4x4<f32> }; @group(0) @binding(0) var<uniform> shadowCamera:ShadowCamera; struct Object { world:mat4x4<f32> }; @group(1) @binding(0) var<uniform> object:Object; @group(1) @binding(1) var<storage,read> jointMatrices:array<mat4x4<f32>>; struct Deformation { skinEnabled:f32, vertexCount:f32, morphCount:f32, _pad:f32, morphWeights:vec4<f32> }; @group(1) @binding(2) var<uniform> deformation:Deformation; @group(1) @binding(3) var<storage,read> morphDeltas:array<vec4<f32>>; @group(1) @binding(4) var<storage,read> instanceMatrices:array<mat4x4<f32>>; @group(1) @binding(5) var<storage,read> visibleInstanceIndices:array<u32>; struct ShadowIn { @location(0) position:vec3<f32>, @location(3) joints:vec4<f32>, @location(4) weights:vec4<f32>, @builtin(vertex_index) vertexIndex:u32, @builtin(instance_index) instanceIndex:u32 }; fn morphPosition(position:vec3<f32>,vertexIndex:u32)->vec3<f32>{var result=position;let vertexCount=u32(deformation.vertexCount);for(var morph:u32=0u;morph<4u;morph=morph+1u){if(morph<u32(deformation.morphCount)){result=result+morphDeltas[morph*vertexCount+vertexIndex].xyz*deformation.morphWeights[morph];}}return result;} fn skinPosition(position:vec3<f32>,joints:vec4<f32>,weights:vec4<f32>)->vec3<f32>{if(deformation.skinEnabled<0.5){return position;}let total=weights.x+weights.y+weights.z+weights.w;if(total<=0.0001){return position;}return(jointMatrices[u32(joints.x)]*vec4<f32>(position,1.0)*weights.x+jointMatrices[u32(joints.y)]*vec4<f32>(position,1.0)*weights.y+jointMatrices[u32(joints.z)]*vec4<f32>(position,1.0)*weights.z+jointMatrices[u32(joints.w)]*vec4<f32>(position,1.0)*weights.w).xyz/total;} @vertex fn vs_shadow(input:ShadowIn)->@builtin(position) vec4<f32>{let localPosition=skinPosition(morphPosition(input.position,input.vertexIndex),input.joints,input.weights);return shadowCamera.lightViewProjection*object.world*instanceMatrices[visibleInstanceIndices[input.instanceIndex]]*vec4<f32>(localPosition,1.0);}`;
  var VSR_SPATIAL_CULL_WGSL_V04 = `struct CullCamera { viewProjection:mat4x4<f32> };
@group(0) @binding(0) var<uniform> camera:CullCamera;
struct Bounds { centerRadius:vec4<f32> };
@group(0) @binding(1) var<storage,read> bounds:array<Bounds>;
@group(0) @binding(2) var<storage,read_write> visibleIndices:array<u32>;
@group(0) @binding(3) var<storage,read_write> visibleCount:atomic<u32>;
@group(0) @binding(4) var<storage,read_write> indirectArgs:array<u32>;
fn visible(centerRadius:vec4<f32>)->bool{let clip=camera.viewProjection*vec4<f32>(centerRadius.xyz,1.0);let margin=centerRadius.w*max(max(abs(camera.viewProjection[0][0]),abs(camera.viewProjection[1][1])),1.0);return clip.w>0.0&&clip.x>=-clip.w-margin&&clip.x<=clip.w+margin&&clip.y>=-clip.w-margin&&clip.y<=clip.w+margin&&clip.z>=-margin&&clip.z<=clip.w+margin;}
@compute @workgroup_size(64) fn cs_reset(@builtin(global_invocation_id) id:vec3<u32>){if(id.x==0u){atomicStore(&visibleCount,0u);indirectArgs[1]=0u;}}
@compute @workgroup_size(64) fn cs_cull(@builtin(global_invocation_id) id:vec3<u32>){if(id.x>=arrayLength(&bounds)){return;}if(visible(bounds[id.x].centerRadius)){let destination=atomicAdd(&visibleCount,1u);visibleIndices[destination]=id.x;}}
@compute @workgroup_size(64) fn cs_finalize(@builtin(global_invocation_id) id:vec3<u32>){if(id.x==0u){indirectArgs[1]=atomicLoad(&visibleCount);}}`;
  function compileSpatialFrame(scene, options = {}) {
    validateScene(scene);
    const budget = resolveSpatialBudget(options), baseAnimationOverrides = options.animationGraph ? sampleSpatialAnimationGraph(scene, options.animationGraph) : options.animationLayers ? sampleSpatialAnimationLayers(scene, options.animationLayers) : options.animation ? sampleSpatialAnimation(scene, options.animation.clipId, options.animation.timeSeconds, options.animation.loop ?? true) : /* @__PURE__ */ new Map(), animationConstraints = options.animationConstraints ?? [], animationOverrides = applySpatialAnimationConstraints(scene, baseAnimationOverrides, animationConstraints), visualIntentRoot = options.visualIntentRoot ?? null, animationRoot = cryptographicHash({ selection: options.animation ?? null, layers: options.animationLayers ?? null, graph: options.animationGraph ?? null, ...animationConstraints.length ? { animationConstraints } : {}, ...visualIntentRoot ? { visualIntentRoot } : {}, overrides: [...animationOverrides.entries()] }), camera = scene.cameras.find((entry) => entry.id === scene.activeCameraId), aspect = budget.width / budget.height, near = Math.max(1e-3, camera.near ?? 0.1), far = Math.max(near + 0.01, camera.far ?? 1e3), view = cameraViewMatrix(camera), projection = camera.projection === "orthographic" ? orthographicMat4(camera.orthoHeight ?? 10, aspect, near, far) : perspectiveMat4(camera.fovYDeg ?? 60, aspect, near, far), viewProjection = multiplyMat4(projection, view), cameraPos = cameraPosition(camera), streaming = scene.streaming ? resolveSpatialStreaming(scene, cameraPos, options.streaming) : void 0, streamedNodeIds = streaming ? new Set(streaming.nodeIds) : void 0, world = worldMatrices(scene, animationOverrides), meshById = new Map(scene.meshes.map((mesh) => [mesh.id, mesh])), materialById = new Map(scene.materials.map((material) => [material.id, sanitizeMaterial(material)])), skinById = new Map((scene.skins ?? []).map((skin) => [skin.id, skin]));
    const visiblePackets = [];
    let culled = 0;
    const streamingCulledCells = streaming ? scene.streaming.cells.length - streaming.activeCellIds.length : 0, lodHistogram = {};
    for (const node of scene.nodes) {
      if (streamedNodeIds && !streamedNodeIds.has(node.id)) continue;
      if (node.visible === false || !node.meshId && !node.lods?.length) continue;
      const matrix = world.get(node.id), baseMeshId = node.meshId ?? node.lods?.[0]?.meshId, baseMesh = baseMeshId ? meshById.get(baseMeshId) : void 0;
      if (!baseMesh) {
        culled++;
        continue;
      }
      const baseWorldBounds = transformBounds(meshBounds(baseMesh), matrix), distance = distance3(cameraPos, baseWorldBounds.center), selected = chooseLOD(node, distance, budget.lodBias), mesh = selected.meshId ? meshById.get(selected.meshId) : void 0;
      if (!mesh) {
        culled++;
        continue;
      }
      const bounds = transformBounds(meshBounds(mesh), matrix);
      if (!options.gpuDrivenCulling && !sphereInFrustum(bounds, viewProjection)) {
        culled++;
        continue;
      }
      const materialId = node.materialId ?? scene.materials[0]?.id ?? "material:default";
      if (!materialById.has(materialId)) materialById.set(materialId, sanitizeMaterial({ id: materialId }));
      lodHistogram[String(selected.level)] = (lodHistogram[String(selected.level)] ?? 0) + 1;
      const material = materialById.get(materialId), textureBindings = { baseColor: material.baseColorTextureId, metallicRoughness: material.metallicRoughnessTextureId, normal: material.normalTextureId, occlusion: material.occlusionTextureId, emissive: material.emissiveTextureId }, deformation = resolveSpatialDeformation(mesh, node, skinById, world), instance = { nodeId: node.id, worldMatrix: matrix, worldBounds: bounds, distanceToCamera: distance }, packetBase = { nodeId: node.id, meshId: mesh.id, materialId, worldMatrix: matrix, worldBounds: bounds, distanceToCamera: distance, lodLevel: selected.level, indexCount: mesh.indices.length, castShadow: node.castShadow ?? true, receiveShadow: node.receiveShadow ?? true, textureBindings, ...deformation, instances: [instance], instanceCount: 1 };
      visiblePackets.push({ ...packetBase, packetRoot: cryptographicHash(packetBase) });
    }
    const groupedPackets = /* @__PURE__ */ new Map();
    for (const packet of visiblePackets) {
      const key = cryptographicHash({ meshId: packet.meshId, materialId: packet.materialId, lodLevel: packet.lodLevel, castShadow: packet.castShadow, receiveShadow: packet.receiveShadow, textureBindings: packet.textureBindings, deformationRoot: packet.deformationRoot }), existing = groupedPackets.get(key);
      if (!existing) {
        groupedPackets.set(key, packet);
        continue;
      }
      const instances = [...packetInstances(existing), ...packetInstances(packet)];
      existing.instances = instances;
      existing.instanceCount = instances.length;
      existing.worldBounds = mergeSpatialBounds(existing.worldBounds, packet.worldBounds);
      existing.distanceToCamera = Math.min(existing.distanceToCamera, packet.distanceToCamera);
    }
    const drawPackets = [...groupedPackets.values()].map((packet) => {
      const { packetRoot: _packetRoot, ...base2 } = packet;
      return { ...base2, packetRoot: cryptographicHash(base2) };
    });
    const lights = scene.lights.slice(0, budget.maxLights).map((light) => ({ ...light, color: light.color ?? "#ffffff", intensity: Math.max(0, light.intensity ?? 1), range: Math.max(1e-3, light.range ?? 10) })), environment = sanitizeSpatialEnvironment(scene.environment);
    const shadowCasterCount = drawPackets.reduce((sum, packet) => sum + (packet.castShadow ? packetInstanceCount(packet) : 0), 0), passes = [];
    if (budget.shadows && lights.some((light) => light.kind === "directional" && light.castShadow) && shadowCasterCount) passes.push({ id: "shadow-depth", kind: "shadow-depth", dependsOn: [], resourceIds: ["shadow-depth"] });
    passes.push({ id: "scene-depth-color", kind: "scene-depth-color", dependsOn: passes.length ? ["shadow-depth"] : [], resourceIds: ["scene-color", "scene-depth", ...passes.length ? ["shadow-depth"] : []] }, { id: "tone-map", kind: "tone-map", dependsOn: ["scene-depth-color"], resourceIds: ["scene-color", "present-color"] });
    const resources = [], activeSkinIds = new Set(drawPackets.map((packet) => packet.skinId).filter((id) => Boolean(id)));
    for (const mesh of scene.meshes) {
      const vertexCount = mesh.positions.length / 3;
      resources.push({ id: `mesh:${mesh.id}:vertices`, kind: "vertex-buffer", byteLength: vertexCount * 16 * 4, resourceRoot: cryptographicHash({ positions: mesh.positions, normals: mesh.normals ?? calculateMeshNormals(mesh), uvs: mesh.uvs ?? [], jointIndices: mesh.jointIndices ?? [], jointWeights: mesh.jointWeights ?? [], morphTargets: mesh.morphTargets ?? [] }) }, { id: `mesh:${mesh.id}:indices`, kind: "index-buffer", byteLength: mesh.indices.length * 4, resourceRoot: cryptographicHash(mesh.indices) });
      if (mesh.morphTargets?.length) resources.push({ id: `mesh:${mesh.id}:morphs`, kind: "morph-buffer", byteLength: mesh.morphTargets.length * vertexCount * 4 * 4, resourceRoot: cryptographicHash(mesh.morphTargets) });
    }
    for (const skin of scene.skins ?? []) if (activeSkinIds.has(skin.id)) resources.push({ id: `skin:${skin.id}:joints`, kind: "joint-buffer", byteLength: skin.joints.length * 64, resourceRoot: cryptographicHash(skin) });
    for (const packet of drawPackets) {
      const instanceCount = packetInstanceCount(packet);
      resources.push({ id: `instances:${packet.nodeId}`, kind: "instance-buffer", byteLength: instanceCount * 64, resourceRoot: cryptographicHash(packetInstances(packet)) });
      if (options.gpuDrivenCulling) resources.push({ id: `indirect:${packet.nodeId}`, kind: "indirect-buffer", byteLength: 20, format: "draw-indexed-indirect", resourceRoot: cryptographicHash(packSpatialIndirectDrawCommand(packet)) }, { id: `culling-bounds:${packet.nodeId}`, kind: "culling-bounds-buffer", byteLength: instanceCount * 16, format: "vec4-center-radius", resourceRoot: cryptographicHash(packSpatialInstanceBoundsBuffer(packet)) }, { id: `visible-indices:${packet.nodeId}`, kind: "visible-index-buffer", byteLength: instanceCount * 4, format: "u32", resourceRoot: cryptographicHash(packSpatialVisibleInstanceIndices(packet)) }, { id: `culling-counter:${packet.nodeId}`, kind: "culling-counter-buffer", byteLength: 4, format: "atomic-u32", resourceRoot: cryptographicHash({ packet: packet.nodeId, kind: "visible-counter" }) });
    }
    for (const texture of scene.textures ?? []) resources.push({ id: `texture:${texture.id}`, kind: "texture-2d", byteLength: texture.pixels.length, format: "rgba8unorm", resourceRoot: cryptographicHash(texture) });
    resources.push({ id: "materials", kind: "material-buffer", byteLength: materialById.size * 64, resourceRoot: cryptographicHash([...materialById.values()]) }, { id: "lights", kind: "light-buffer", byteLength: lights.length * 64, resourceRoot: cryptographicHash(lights) }, { id: "scene-depth", kind: "depth-texture", byteLength: budget.width * budget.height * 4, format: "depth24plus", resourceRoot: cryptographicHash({ width: budget.width, height: budget.height, format: "depth24plus" }) }, { id: "scene-color", kind: "color-texture", byteLength: budget.width * budget.height * 8, format: "rgba16float", resourceRoot: cryptographicHash({ width: budget.width, height: budget.height, format: "rgba16float" }) }, { id: "present-color", kind: "color-texture", byteLength: budget.width * budget.height * 4, format: "bgra8unorm", resourceRoot: cryptographicHash({ width: budget.width, height: budget.height, format: "bgra8unorm" }) });
    if (passes.some((pass) => pass.id === "shadow-depth")) resources.push({ id: "shadow-depth", kind: "shadow-texture", byteLength: budget.shadowMapSize ** 2 * 4, format: "depth32float", resourceRoot: cryptographicHash({ size: budget.shadowMapSize, format: "depth32float" }) });
    const sourceRealityRoot = cryptographicHash({ format: scene.format, sceneId: scene.sceneId, reality: scene.reality ?? null }), geometryRoot = cryptographicHash(scene.meshes.map((mesh) => ({ id: mesh.id, positions: mesh.positions, normals: mesh.normals ?? null, uvs: mesh.uvs ?? null, indices: mesh.indices, jointIndices: mesh.jointIndices ?? null, jointWeights: mesh.jointWeights ?? null, morphTargets: mesh.morphTargets ?? null }))), materialRoot = cryptographicHash([...materialById.values()]), textureRoot = cryptographicHash(scene.textures ?? []), environmentRoot = cryptographicHash(environment), commandRoot = cryptographicHash({ drawPackets, passes, lights, budget, textureRoot, environmentRoot, animationRoot, streaming: streaming ?? null, gpuDrivenCulling: Boolean(options.gpuDrivenCulling), assetStreaming: options.assetStreaming ?? null }), shaders = { vertex: VSR_SPATIAL_VERTEX_WGSL_V04, fragment: VSR_SPATIAL_FRAGMENT_WGSL_V04, shadowVertex: VSR_SPATIAL_SHADOW_WGSL_V04, ...options.gpuDrivenCulling ? { compute: VSR_SPATIAL_CULL_WGSL_V04 } : {}, sourceRoot: cryptographicHash([VSR_SPATIAL_VERTEX_WGSL_V04, VSR_SPATIAL_FRAGMENT_WGSL_V04, VSR_SPATIAL_SHADOW_WGSL_V04, ...options.gpuDrivenCulling ? [VSR_SPATIAL_CULL_WGSL_V04] : []]) };
    const stats = { meshCount: scene.meshes.length, nodeCount: scene.nodes.length, textureCount: (scene.textures ?? []).length, materialTextureBindings: drawPackets.reduce((sum, packet) => sum + Object.values(packet.textureBindings).filter(Boolean).length, 0), animationClipCount: (scene.animations ?? []).length, visibleDraws: drawPackets.length, visibleInstances: visiblePackets.length, instancedDraws: drawPackets.filter((packet) => packetInstanceCount(packet) > 1).length, gpuDrivenDraws: options.gpuDrivenCulling ? drawPackets.length : 0, activeCells: streaming?.activeCellIds.length ?? 0, streamedNodes: streaming?.nodeIds.length ?? scene.nodes.length, streamingCulledCells, culledDraws: culled, triangleCount: drawPackets.reduce((sum, packet) => sum + packet.indexCount / 3 * packetInstanceCount(packet), 0), lightCount: lights.length, shadowCasterCount, skinnedDraws: drawPackets.reduce((sum, packet) => sum + (packet.skinId ? packetInstanceCount(packet) : 0), 0), morphedDraws: drawPackets.reduce((sum, packet) => sum + (packet.morphWeights.some((weight) => Math.abs(weight) > EPS) ? packetInstanceCount(packet) : 0), 0), lodHistogram };
    const base = { format: VSR_SPATIAL_FRAME_FORMAT, version: VSR_SPATIAL_REALITY_VERSION, sceneId: scene.sceneId, viewport: { width: budget.width, height: budget.height }, budget, camera: { id: camera.id, viewMatrix: view, projectionMatrix: projection, viewProjectionMatrix: viewProjection, position: cameraPos }, environment, drawPackets, lights, passes, resources, shaders, stats, sourceRealityRoot, geometryRoot, materialRoot, textureRoot, animationRoot, environmentRoot, ...streaming ? { streaming } : {}, ...options.gpuDrivenCulling ? { gpuDrivenCulling: true } : {}, ...options.assetStreaming ? { assetStreaming: options.assetStreaming } : {}, ...visualIntentRoot ? { visualIntentRoot } : {}, commandRoot };
    return { ...base, frameRoot: cryptographicHash(base) };
  }
  function verifySpatialFrame(plan) {
    const diagnostics = [];
    if (plan.format !== VSR_SPATIAL_FRAME_FORMAT) diagnostics.push("frame format mismatch");
    if (plan.streaming) {
      const { root, ...streamingBase } = plan.streaming;
      if (cryptographicHash(streamingBase) !== root) diagnostics.push("streaming root mismatch");
    }
    if (plan.assetStreaming) {
      const { root, ...assetStreamingBase } = plan.assetStreaming;
      if (cryptographicHash(assetStreamingBase) !== root) diagnostics.push("asset streaming root mismatch");
    }
    const resourceIds = new Set(plan.resources.map((resource) => resource.id));
    for (const pass of plan.passes) {
      for (const dep of pass.dependsOn) if (!plan.passes.some((candidate) => candidate.id === dep)) diagnostics.push(`pass ${pass.id} missing dependency ${dep}`);
      for (const id of pass.resourceIds) if (!resourceIds.has(id)) diagnostics.push(`pass ${pass.id} missing resource ${id}`);
    }
    for (const packet of plan.drawPackets) {
      const instances = packetInstances(packet);
      if (packet.instanceCount !== void 0 && packet.instanceCount !== instances.length) diagnostics.push(`draw packet ${packet.nodeId} instance count mismatch`);
      if (!instances.length) diagnostics.push(`draw packet ${packet.nodeId} has no instances`);
      const { packetRoot, ...base2 } = packet;
      if (cryptographicHash(base2) !== packetRoot) diagnostics.push(`draw packet ${packet.nodeId} root mismatch`);
    }
    const commandRoot = cryptographicHash({ drawPackets: plan.drawPackets, passes: plan.passes, lights: plan.lights, budget: plan.budget, textureRoot: plan.textureRoot, environmentRoot: plan.environmentRoot, animationRoot: plan.animationRoot, streaming: plan.streaming ?? null, gpuDrivenCulling: Boolean(plan.gpuDrivenCulling), assetStreaming: plan.assetStreaming ?? null });
    if (commandRoot !== plan.commandRoot) diagnostics.push("command root mismatch");
    const { frameRoot, ...base } = plan;
    if (cryptographicHash(base) !== frameRoot) diagnostics.push("frame root mismatch");
    return { ok: diagnostics.length === 0, diagnostics };
  }
  function materialColor(color) {
    const parsed = parseColor(color);
    return [parsed[0] / 255, parsed[1] / 255, parsed[2] / 255];
  }
  var mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  var mul3 = (a, b) => [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
  function distributionGGX(nDotH, roughness) {
    const a = Math.max(0.04, roughness) ** 2, a2 = a * a, d = nDotH * nDotH * (a2 - 1) + 1;
    return a2 / Math.max(Math.PI * d * d, 1e-9);
  }
  function geometrySchlickGGX(nDotV, roughness) {
    const r = Math.max(0.04, roughness) + 1, k = r * r / 8;
    return nDotV / Math.max(nDotV * (1 - k) + k, 1e-9);
  }
  function geometrySmith(nDotV, nDotL, roughness) {
    return geometrySchlickGGX(nDotV, roughness) * geometrySchlickGGX(nDotL, roughness);
  }
  function fresnelSchlick(cosTheta, f0) {
    const factor = Math.pow(clamp(1 - cosTheta, 0, 1), 5);
    return [f0[0] + (1 - f0[0]) * factor, f0[1] + (1 - f0[1]) * factor, f0[2] + (1 - f0[2]) * factor];
  }
  function evaluatePBRLighting(input) {
    const n = normalize3(input.normal), v = normalize3(input.view), l = normalize3(input.light), h = normalize3(add3(v, l)), nDotL = Math.max(0, dot3(n, l)), nDotV = Math.max(1e-4, dot3(n, v)), nDotH = Math.max(0, dot3(n, h)), vDotH = Math.max(0, dot3(v, h)), metallic = clamp(input.metallic, 0, 1), roughness = clamp(input.roughness, 0.04, 1), dielectric = Math.pow((clamp(input.ior, 1, 2.5) - 1) / (clamp(input.ior, 1, 2.5) + 1), 2), f0 = mix3([dielectric, dielectric, dielectric], input.baseColor, metallic), f = fresnelSchlick(vDotH, f0), d = distributionGGX(nDotH, roughness), g = geometrySmith(nDotV, nDotL, roughness), specular = scale3(f, d * g / Math.max(4 * nDotV * nDotL, 1e-4)), kd = scale3([1 - f[0], 1 - f[1], 1 - f[2]], 1 - metallic), diffuse = scale3(mul3(kd, input.baseColor), 1 / Math.PI), coatRoughness = clamp(input.clearcoatRoughness, 0.04, 1), coatF = fresnelSchlick(vDotH, [0.04, 0.04, 0.04]), coat = scale3(coatF, distributionGGX(nDotH, coatRoughness) * geometrySmith(nDotV, nDotL, coatRoughness) / Math.max(4 * nDotV * nDotL, 1e-4) * clamp(input.clearcoat, 0, 1));
    return scale3(mul3(add3(add3(diffuse, specular), coat), input.radiance), nDotL);
  }
  function linearToSrgb(value) {
    return value <= 31308e-7 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  }
  function aces(value) {
    const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
    return clamp(value * (a * value + b) / (value * (c * value + d) + e), 0, 1);
  }
  function edge(a, b, x, y) {
    return (x - a.x) * (b.y - a.y) - (y - a.y) * (b.x - a.x);
  }
  function projectVertex(position, normal, uv, world, viewProjection, width, height) {
    const world4 = transformVec4(world, [...position, 1]), clip = transformVec4(viewProjection, world4);
    if (clip[3] <= EPS) return null;
    const invW = 1 / clip[3], ndcX = clip[0] * invW, ndcY = clip[1] * invW, ndcZ = clip[2] * invW;
    return { x: (ndcX * 0.5 + 0.5) * (width - 1), y: (1 - (ndcY * 0.5 + 0.5)) * (height - 1), depth: ndcZ * 0.5 + 0.5, world: [world4[0], world4[1], world4[2]], normal: transformDirection3(world, normal), uv, invW };
  }
  function resolveSpatialShadowCamera(plan) {
    const light = plan.lights.find((entry) => entry.kind === "directional" && entry.castShadow), packets = plan.drawPackets.filter((packet) => packet.castShadow);
    if (!plan.budget.shadows || !light || !packets.length) return void 0;
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (const packet of packets) for (const instance of packetInstances(packet)) {
      min = [Math.min(min[0], instance.worldBounds.min[0]), Math.min(min[1], instance.worldBounds.min[1]), Math.min(min[2], instance.worldBounds.min[2])];
      max = [Math.max(max[0], instance.worldBounds.max[0]), Math.max(max[1], instance.worldBounds.max[1]), Math.max(max[2], instance.worldBounds.max[2])];
    }
    const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2], radius = Math.max(1, distance3(min, max) / 2), direction = normalize3(light.direction ?? [-0.5, -1, -0.35]), eye = sub3(center, scale3(direction, radius * 2.5)), view = lookAtMat4(eye, center, [0, 1, 0]), projection = orthographicMat4(radius * 2.4, 1, 0.01, radius * 6);
    return { size: plan.budget.shadowMapSize, viewProjection: multiplyMat4(projection, view), bias: 25e-4 };
  }
  function buildShadow(scene, plan, meshById) {
    const camera = resolveSpatialShadowCamera(plan);
    if (!camera) return void 0;
    const depth = new Float32Array(camera.size * camera.size);
    depth.fill(Infinity);
    for (const packet of plan.drawPackets.filter((entry) => entry.castShadow)) for (const instance of packetInstances(packet)) {
      const mesh = deformSpatialMesh(meshById.get(packet.meshId), packet);
      for (let i = 0; i < mesh.indices.length; i += 3) {
        const vertices = [];
        for (const index of [mesh.indices[i], mesh.indices[i + 1], mesh.indices[i + 2]]) {
          const base = index * 3, v = projectVertex([mesh.positions[base], mesh.positions[base + 1], mesh.positions[base + 2]], [0, 1, 0], [0, 0], instance.worldMatrix, camera.viewProjection, camera.size, camera.size);
          if (v) vertices.push(v);
        }
        if (vertices.length !== 3) continue;
        const [a, b, c] = vertices, area = edge(a, b, c.x, c.y);
        if (Math.abs(area) < EPS) continue;
        const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))), maxX = Math.min(camera.size - 1, Math.ceil(Math.max(a.x, b.x, c.x))), minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))), maxY = Math.min(camera.size - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
        for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5, py = y + 0.5, w0 = edge(b, c, px, py) / area, w1 = edge(c, a, px, py) / area, w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const z = w0 * a.depth + w1 * b.depth + w2 * c.depth, idx = y * camera.size + x;
          if (z < depth[idx]) depth[idx] = z;
        }
      }
    }
    return { size: camera.size, depth, viewProjection: camera.viewProjection, bias: camera.bias };
  }
  function shadowFactor(context, world) {
    if (!context) return 1;
    const clip = transformVec4(context.viewProjection, [...world, 1]);
    if (clip[3] <= 0) return 1;
    const x = (clip[0] / clip[3] * 0.5 + 0.5) * (context.size - 1), y = (1 - (clip[1] / clip[3] * 0.5 + 0.5)) * (context.size - 1), z = clip[2] / clip[3] * 0.5 + 0.5;
    if (x < 0 || y < 0 || x >= context.size || y >= context.size) return 1;
    let lit = 0, samples = 0;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const sx = Math.max(0, Math.min(context.size - 1, Math.round(x) + ox)), sy = Math.max(0, Math.min(context.size - 1, Math.round(y) + oy)), stored = context.depth[sy * context.size + sx];
      lit += z - context.bias <= stored ? 1 : 0.2;
      samples++;
    }
    return lit / samples;
  }
  function textureTexel(texture, x, y, colorSpace) {
    const ix = Math.max(0, Math.min(texture.width - 1, x)), iy = Math.max(0, Math.min(texture.height - 1, y)), index = (iy * texture.width + ix) * 4, toLinear = (value) => colorSpace === "linear" ? value : Math.pow(value, 2.2);
    return [toLinear((texture.pixels[index] ?? 255) / 255), toLinear((texture.pixels[index + 1] ?? 255) / 255), toLinear((texture.pixels[index + 2] ?? 255) / 255), (texture.pixels[index + 3] ?? 255) / 255];
  }
  function sampleSpatialTexture(texture, uv, colorSpace = texture.colorSpace ?? "srgb") {
    const wrap = (value, mode) => mode === "repeat" ? (value % 1 + 1) % 1 : clamp(value, 0, 1), u = wrap(uv[0], texture.wrapU ?? "repeat"), v = wrap(uv[1], texture.wrapV ?? "repeat"), fx = u * (texture.width - 1), fy = (1 - v) * (texture.height - 1);
    if ((texture.filter ?? "nearest") === "nearest") return textureTexel(texture, Math.round(fx), Math.round(fy), colorSpace);
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(texture.width - 1, x0 + 1), y1 = Math.min(texture.height - 1, y0 + 1), tx = fx - x0, ty = fy - y0;
    const a = textureTexel(texture, x0, y0, colorSpace), b = textureTexel(texture, x1, y0, colorSpace), c = textureTexel(texture, x0, y1, colorSpace), d = textureTexel(texture, x1, y1, colorSpace), mix = (p, q, t) => p + (q - p) * t;
    return [0, 1, 2, 3].map((channel) => mix(mix(a[channel], b[channel], tx), mix(c[channel], d[channel], tx), ty));
  }
  function spatialEnvironmentUV(direction) {
    const d = normalize3(direction);
    return [0.5 + Math.atan2(d[2], d[0]) / (Math.PI * 2), 0.5 + Math.asin(clamp(d[1], -1, 1)) / Math.PI];
  }
  function sampleSpatialEnvironment(texture, direction) {
    const sample = sampleSpatialTexture({ ...texture, wrapU: texture.wrapU ?? "repeat", wrapV: texture.wrapV ?? "clamp" }, spatialEnvironmentUV(direction));
    return [sample[0], sample[1], sample[2]];
  }
  function triangleTangentFrame(a, b, c, normal) {
    const edge1 = sub3(b.world, a.world), edge2 = sub3(c.world, a.world), du1 = b.uv[0] - a.uv[0], dv1 = b.uv[1] - a.uv[1], du2 = c.uv[0] - a.uv[0], dv2 = c.uv[1] - a.uv[1], det = du1 * dv2 - du2 * dv1;
    if (Math.abs(det) < EPS) {
      const axis = Math.abs(normal[1]) < 0.95 ? [0, 1, 0] : [1, 0, 0], tangent2 = normalize3(cross3(axis, normal));
      return { tangent: tangent2, bitangent: normalize3(cross3(normal, tangent2)) };
    }
    const inv = 1 / det, tangent = normalize3(sub3(scale3(edge1, dv2 * inv), scale3(edge2, dv1 * inv))), bitangent = normalize3(sub3(scale3(edge2, du1 * inv), scale3(edge1, du2 * inv)));
    return { tangent, bitangent };
  }
  function sampleSpatialMaterial(material, textures, uv, geometricNormal, tangent, bitangent) {
    const m = sanitizeMaterial(material), baseFactor = materialColor(m.baseColor), baseTexture = m.baseColorTextureId ? textures.get(m.baseColorTextureId) : void 0, baseSample = baseTexture ? sampleSpatialTexture(baseTexture, uv, "srgb") : [1, 1, 1, 1];
    let metallic = m.metallic, roughness = m.roughness;
    if (m.metallicRoughnessTextureId) {
      const texture = textures.get(m.metallicRoughnessTextureId);
      if (texture) {
        const sample = sampleSpatialTexture(texture, uv, "linear");
        roughness = clamp(roughness * sample[1], 0.04, 1);
        metallic = clamp(metallic * sample[2], 0, 1);
      }
    }
    let occlusion = 1;
    if (m.occlusionTextureId) {
      const texture = textures.get(m.occlusionTextureId);
      if (texture) {
        const sample = sampleSpatialTexture(texture, uv, "linear");
        occlusion = 1 - m.occlusionStrength * (1 - sample[0]);
      }
    }
    const emissiveFactor = materialColor(m.emissive), emissiveTexture = m.emissiveTextureId ? textures.get(m.emissiveTextureId) : void 0, emissiveSample = emissiveTexture ? sampleSpatialTexture(emissiveTexture, uv, "srgb") : [1, 1, 1, 1];
    let normal = normalize3(geometricNormal);
    if (m.normalTextureId) {
      const texture = textures.get(m.normalTextureId);
      if (texture) {
        const sample = sampleSpatialTexture(texture, uv, "linear"), local = normalize3([(sample[0] * 2 - 1) * m.normalScale, (sample[1] * 2 - 1) * m.normalScale, sample[2] * 2 - 1]);
        normal = normalize3(add3(add3(scale3(tangent, local[0]), scale3(bitangent, local[1])), scale3(normal, local[2])));
      }
    }
    const opacity = clamp(m.opacity * baseSample[3], 0, 1), discarded = m.alphaMode === "MASK" && opacity < m.alphaCutoff;
    return { baseColor: mul3(baseFactor, [baseSample[0], baseSample[1], baseSample[2]]), metallic, roughness, emissive: scale3(mul3(emissiveFactor, [emissiveSample[0], emissiveSample[1], emissiveSample[2]]), m.emissiveStrength), occlusion, normal, opacity: m.alphaMode === "MASK" ? 1 : opacity, discarded };
  }
  function shade(material, sample, world, camera, environment, textures, lights, shadow, receiveShadow) {
    const m = sanitizeMaterial(material), v = normalize3(sub3(camera, world)), n = normalize3(sample.normal), nDotV = Math.max(1e-4, dot3(n, v)), dielectric = Math.pow((m.ior - 1) / (m.ior + 1), 2), f0 = mix3([dielectric, dielectric, dielectric], sample.baseColor, sample.metallic), environmentF = fresnelSchlick(nDotV, f0), environmentKd = scale3([1 - environmentF[0], 1 - environmentF[1], 1 - environmentF[2]], 1 - sample.metallic), reflection = normalize3(sub3(scale3(n, 2 * nDotV), v)), environmentTexture = environment.textureId ? textures.get(environment.textureId) : void 0, environmentDiffuseColor = environmentTexture ? sampleSpatialEnvironment(environmentTexture, n) : materialColor(environment.diffuseColor), environmentSpecularColor = environmentTexture ? mix3(sampleSpatialEnvironment(environmentTexture, reflection), environmentDiffuseColor, sample.roughness * sample.roughness) : materialColor(environment.specularColor), environmentDiffuse = scale3(mul3(mul3(environmentKd, sample.baseColor), environmentDiffuseColor), environment.intensity * sample.occlusion / Math.PI), environmentSpecular = scale3(mul3(environmentSpecularColor, environmentF), environment.intensity * (0.35 + 0.65 * (1 - sample.roughness)));
    let color = add3([sample.emissive[0], sample.emissive[1], sample.emissive[2]], add3(environmentDiffuse, environmentSpecular));
    for (const light of lights) {
      const lc = materialColor(light.color ?? "#ffffff"), intensity = Math.max(0, light.intensity ?? 1);
      if (light.kind === "ambient") {
        color = add3(color, scale3(mul3(sample.baseColor, lc), intensity * sample.occlusion));
        continue;
      }
      let l, attenuation = 1;
      if (light.kind === "directional") l = normalize3(scale3(light.direction ?? [-0.4, -1, -0.3], -1));
      else {
        const delta = sub3(light.position ?? [0, 2, 0], world), distance = Math.max(1e-3, length3(delta));
        l = scale3(delta, 1 / distance);
        const range = Math.max(1e-3, light.range ?? 10);
        attenuation = Math.pow(clamp(1 - distance / range, 0, 1), 2);
      }
      const visibility = receiveShadow && light.kind === "directional" && light.castShadow ? shadowFactor(shadow, world) : 1, direct = evaluatePBRLighting({ baseColor: sample.baseColor, metallic: sample.metallic, roughness: sample.roughness, ior: m.ior, clearcoat: m.clearcoat, clearcoatRoughness: m.clearcoatRoughness, normal: sample.normal, view: v, light: l, radiance: scale3(lc, intensity * attenuation * visibility) });
      color = add3(color, direct);
    }
    return color;
  }
  function renderSpatialReference(scene, options = {}) {
    const plan = compileSpatialFrame(scene, options), verification = verifySpatialFrame(plan);
    if (!verification.ok) throw new Error(verification.diagnostics.join("; "));
    const width = plan.viewport.width, height = plan.viewport.height, color = new Float32Array(width * height * 4), depth = new Float32Array(width * height);
    depth.fill(Infinity);
    const bg = parseColor(scene.background ?? "#0b1020");
    for (let i = 0; i < width * height; i++) {
      color[i * 4] = bg[0] / 255;
      color[i * 4 + 1] = bg[1] / 255;
      color[i * 4 + 2] = bg[2] / 255;
      color[i * 4 + 3] = 1;
    }
    const meshById = new Map(scene.meshes.map((mesh) => [mesh.id, { ...mesh, normals: mesh.normals ?? calculateMeshNormals(mesh) }])), materialById = new Map(scene.materials.map((material) => [material.id, material])), textureById = new Map((scene.textures ?? []).map((texture) => [texture.id, texture])), shadow = buildShadow(scene, plan, new Map([...meshById.entries()].map(([id, mesh]) => [id, mesh])));
    for (const packet of [...plan.drawPackets].sort((a, b) => a.distanceToCamera - b.distanceToCamera || a.nodeId.localeCompare(b.nodeId))) {
      const mesh = deformSpatialMesh(meshById.get(packet.meshId), packet), material = materialById.get(packet.materialId) ?? { id: packet.materialId }, sanitized = sanitizeMaterial(material);
      for (const instance of packetInstances(packet)) {
        const worldMatrix = instance.worldMatrix;
        for (let i = 0; i < mesh.indices.length; i += 3) {
          const vertices = [];
          for (const index of [mesh.indices[i], mesh.indices[i + 1], mesh.indices[i + 2]]) {
            const p = index * 3, n = index * 3, v = projectVertex([mesh.positions[p], mesh.positions[p + 1], mesh.positions[p + 2]], [mesh.normals[n], mesh.normals[n + 1], mesh.normals[n + 2]], [mesh.uvs?.[index * 2] ?? 0, mesh.uvs?.[index * 2 + 1] ?? 0], worldMatrix, plan.camera.viewProjectionMatrix, width, height);
            if (v) vertices.push(v);
          }
          if (vertices.length !== 3) continue;
          const [a, b, c] = vertices, area = edge(a, b, c.x, c.y);
          if (Math.abs(area) < EPS) continue;
          if (area < 0 && !sanitized.doubleSided) continue;
          const faceNormal = normalize3(cross3(sub3(b.world, a.world), sub3(c.world, a.world))), basis = triangleTangentFrame(a, b, c, faceNormal), minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))), maxX = Math.min(width - 1, Math.ceil(Math.max(a.x, b.x, c.x))), minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))), maxY = Math.min(height - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
          for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
            const px = x + 0.5, py = y + 0.5, w0 = edge(b, c, px, py) / area, w1 = edge(c, a, px, py) / area, w2 = 1 - w0 - w1;
            if (w0 < 0 || w1 < 0 || w2 < 0) continue;
            const inv = w0 * a.invW + w1 * b.invW + w2 * c.invW;
            if (inv <= 0) continue;
            const p0 = w0 * a.invW / inv, p1 = w1 * b.invW / inv, p2 = w2 * c.invW / inv, z = p0 * a.depth + p1 * b.depth + p2 * c.depth, index = y * width + x;
            if (z < 0 || z > 1 || z >= depth[index]) continue;
            const world = [p0 * a.world[0] + p1 * b.world[0] + p2 * c.world[0], p0 * a.world[1] + p1 * b.world[1] + p2 * c.world[1], p0 * a.world[2] + p1 * b.world[2] + p2 * c.world[2]], normal = normalize3([p0 * a.normal[0] + p1 * b.normal[0] + p2 * c.normal[0], p0 * a.normal[1] + p1 * b.normal[1] + p2 * c.normal[1], p0 * a.normal[2] + p1 * b.normal[2] + p2 * c.normal[2]]), uv = [p0 * a.uv[0] + p1 * b.uv[0] + p2 * c.uv[0], p0 * a.uv[1] + p1 * b.uv[1] + p2 * c.uv[1]], sample = sampleSpatialMaterial(material, textureById, uv, normal, basis.tangent, basis.bitangent);
            if (sample.discarded) continue;
            depth[index] = z;
            const rgb = shade(material, sample, world, plan.camera.position, plan.environment, textureById, plan.lights, shadow, packet.receiveShadow), opacity = sample.opacity;
            color[index * 4] = rgb[0] * opacity + color[index * 4] * (1 - opacity);
            color[index * 4 + 1] = rgb[1] * opacity + color[index * 4 + 1] * (1 - opacity);
            color[index * 4 + 2] = rgb[2] * opacity + color[index * 4 + 2] * (1 - opacity);
            color[index * 4 + 3] = 1;
          }
        }
      }
    }
    const surface = new PixelSurface(width, height);
    let minDepth = Infinity, maxDepth = -Infinity;
    for (let i = 0; i < width * height; i++) {
      const d = depth[i];
      if (Number.isFinite(d)) {
        minDepth = Math.min(minDepth, d);
        maxDepth = Math.max(maxDepth, d);
      }
      surface.data[i * 4] = Math.round(clamp(linearToSrgb(aces(color[i * 4])), 0, 1) * 255);
      surface.data[i * 4 + 1] = Math.round(clamp(linearToSrgb(aces(color[i * 4 + 1])), 0, 1) * 255);
      surface.data[i * 4 + 2] = Math.round(clamp(linearToSrgb(aces(color[i * 4 + 2])), 0, 1) * 255);
      surface.data[i * 4 + 3] = 255;
    }
    const png = encodePng(surface, { compressionLevel: 6 });
    return { png, pixelRoot: cryptographicHash([...surface.data]), framePlan: plan, depthRange: { min: Number.isFinite(minDepth) ? minDepth : 1, max: Number.isFinite(maxDepth) ? maxDepth : 1 } };
  }
  function transposeMat4(matrix) {
    return new Float32Array([matrix[0], matrix[4], matrix[8], matrix[12], matrix[1], matrix[5], matrix[9], matrix[13], matrix[2], matrix[6], matrix[10], matrix[14], matrix[3], matrix[7], matrix[11], matrix[15]]);
  }
  function packSpatialVertexBuffer(mesh) {
    validateMesh(mesh);
    const normals = mesh.normals ?? calculateMeshNormals(mesh), uvs = mesh.uvs ?? new Array(mesh.positions.length / 3 * 2).fill(0), vertices = mesh.positions.length / 3, joints = mesh.jointIndices ?? new Array(vertices * 4).fill(0), weights = mesh.jointWeights ?? Array.from({ length: vertices * 4 }, (_, index) => index % 4 === 0 ? 1 : 0), out = new Float32Array(vertices * 16);
    for (let index = 0; index < vertices; index++) {
      const base = index * 16;
      out[base] = mesh.positions[index * 3];
      out[base + 1] = mesh.positions[index * 3 + 1];
      out[base + 2] = mesh.positions[index * 3 + 2];
      out[base + 3] = normals[index * 3];
      out[base + 4] = normals[index * 3 + 1];
      out[base + 5] = normals[index * 3 + 2];
      out[base + 6] = uvs[index * 2] ?? 0;
      out[base + 7] = uvs[index * 2 + 1] ?? 0;
      out[base + 8] = joints[index * 4] ?? 0;
      out[base + 9] = joints[index * 4 + 1] ?? 0;
      out[base + 10] = joints[index * 4 + 2] ?? 0;
      out[base + 11] = joints[index * 4 + 3] ?? 0;
      out[base + 12] = weights[index * 4] ?? 1;
      out[base + 13] = weights[index * 4 + 1] ?? 0;
      out[base + 14] = weights[index * 4 + 2] ?? 0;
      out[base + 15] = weights[index * 4 + 3] ?? 0;
    }
    return out;
  }
  function packSpatialIndexBuffer(mesh) {
    validateMesh(mesh);
    return new Uint32Array(mesh.indices);
  }
  function packSpatialObjectUniform(packet) {
    return transposeMat4(packet.worldMatrix);
  }
  function packSpatialInstanceBuffer(packet) {
    const instances = packetInstances(packet), out = new Float32Array(instances.length * 16);
    for (let index = 0; index < instances.length; index++) out.set(transposeMat4(instances[index].worldMatrix), index * 16);
    return out;
  }
  function packSpatialInstanceBoundsBuffer(packet) {
    const instances = packetInstances(packet), out = new Float32Array(instances.length * 4);
    for (let index = 0; index < instances.length; index++) {
      const bounds = instances[index].worldBounds;
      out.set([...bounds.center, bounds.radius], index * 4);
    }
    return out;
  }
  function packSpatialVisibleInstanceIndices(packet) {
    return Uint32Array.from(packetInstances(packet).map((_, index) => index));
  }
  function packSpatialIndirectDrawCommand(packet) {
    return new Uint32Array([packet.indexCount, packetInstanceCount(packet), 0, 0, 0]);
  }
  function packSpatialJointBuffer(packet) {
    const joints = packet.jointMatrices.length ? packet.jointMatrices : [identityMat4()], out = new Float32Array(joints.length * 16);
    for (let index = 0; index < joints.length; index++) out.set(transposeMat4(joints[index]), index * 16);
    return out;
  }
  function packSpatialMorphBuffer(mesh) {
    const targets = mesh.morphTargets ?? [], vertices = mesh.positions.length / 3, out = new Float32Array(Math.max(4, targets.length * vertices * 4));
    for (let targetIndex = 0; targetIndex < targets.length; targetIndex++) {
      const target = targets[targetIndex];
      for (let vertex = 0; vertex < vertices; vertex++) {
        const source = vertex * 3, destination = (targetIndex * vertices + vertex) * 4;
        out[destination] = target.positions[source] ?? 0;
        out[destination + 1] = target.positions[source + 1] ?? 0;
        out[destination + 2] = target.positions[source + 2] ?? 0;
        out[destination + 3] = 0;
      }
    }
    return out;
  }
  function packSpatialDeformationUniform(packet, vertexCount, morphCount) {
    return new Float32Array([packet.skinId ? 1 : 0, vertexCount, morphCount, 0, ...packet.morphWeights.slice(0, 4), ...new Array(Math.max(0, 4 - packet.morphWeights.length)).fill(0)]);
  }
  function packSpatialMaterialUniform(material) {
    const m = sanitizeMaterial(material), base = parseColor(m.baseColor), emissive = parseColor(m.emissive);
    return new Float32Array([base[0] / 255, base[1] / 255, base[2] / 255, base[3] / 255, m.metallic, m.roughness, m.emissiveStrength, m.opacity, emissive[0] / 255, emissive[1] / 255, emissive[2] / 255, emissive[3] / 255, m.occlusionStrength, m.clearcoat, m.clearcoatRoughness, m.ior]);
  }
  function packSpatialShadowUniform(camera) {
    const matrix = transposeMat4(camera?.viewProjection ?? identityMat4());
    return new Float32Array([...matrix, camera ? 1 : 0, camera?.bias ?? 0, camera ? 1 / camera.size : 0, 0]);
  }
  function packSpatialCameraUniform(plan) {
    const ambient = plan.lights.find((light) => light.kind === "ambient"), sun = plan.lights.find((light) => light.kind === "directional"), ambientColor = materialColor(ambient?.color ?? "#ffffff"), sunColor = materialColor(sun?.color ?? "#ffffff"), sunDirection = normalize3(sun?.direction ?? [-0.4, -1, -0.3]), environment = plan.environment ?? sanitizeSpatialEnvironment(void 0), environmentDiffuse = materialColor(environment.diffuseColor), environmentSpecular = materialColor(environment.specularColor), matrix = transposeMat4(plan.camera.viewProjectionMatrix), out = new Float32Array(44);
    out.set(matrix, 0);
    out.set([...plan.camera.position, 1], 16);
    out.set([...ambientColor, ambient?.intensity ?? 0.12], 20);
    out.set([...sunDirection, 0], 24);
    out.set([...sunColor, sun?.intensity ?? 1], 28);
    out.set([...environmentDiffuse, environment.intensity], 32);
    out.set([...environmentSpecular, environment.intensity], 36);
    out.set([environment.textureId ? 1 : 0, 0, 0, 0], 40);
    return out;
  }
  function spatialAdapterName(adapter) {
    const name = adapter?.info?.description ?? adapter?.info?.device ?? adapter?.name;
    return name === void 0 ? void 0 : String(name);
  }
  function spatialFeatureList(adapter) {
    const features = adapter?.features;
    if (!features) return [];
    return Array.from(features).map(String).sort();
  }
  function spatialLimitRecord(limits) {
    const result = {};
    if (!limits) return result;
    const keys = typeof limits.keys === "function" ? Array.from(limits.keys()).map(String) : Object.keys(limits);
    for (const key of keys) {
      const value = Number(typeof limits.get === "function" ? limits.get(key) : limits[key]);
      if (Number.isFinite(value)) result[key] = value;
    }
    return result;
  }
  function evaluateSpatialWebGPUCapabilities(adapter, requirements = {}, secureContext = true, reason) {
    const features = spatialFeatureList(adapter), limits = spatialLimitRecord(adapter?.limits), requiredFeatures = Array.from(new Set(requirements.requiredFeatures ?? [])).map(String).sort(), requiredLimits = {};
    for (const [key, value] of Object.entries(requirements.requiredLimits ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
      const numberValue = Number(value);
      if (Number.isFinite(numberValue) && numberValue >= 0) requiredLimits[key] = numberValue;
    }
    const missingFeatures = requiredFeatures.filter((feature) => !features.includes(feature)), missingLimits = {};
    for (const [key, required] of Object.entries(requiredLimits)) {
      const available = limits[key];
      if (available === void 0 || available < required) missingLimits[key] = available === void 0 ? { required } : { required, available };
    }
    const reasons = [];
    if (!adapter) reasons.push(reason ?? "adapter unavailable");
    if (!secureContext) reasons.push("insecure context");
    if (missingFeatures.length) reasons.push(`missing features: ${missingFeatures.join(",")}`);
    const limitNames = Object.keys(missingLimits);
    if (limitNames.length) reasons.push(`missing limits: ${limitNames.join(",")}`);
    return { format: "vsr.spatial-webgpu-capabilities.v0.4", available: Boolean(adapter) && secureContext && !missingFeatures.length && !limitNames.length, secureContext, adapterName: spatialAdapterName(adapter), features, limits, requiredFeatures, requiredLimits, missingFeatures, missingLimits, reason: reasons.length ? reasons.join("; ") : void 0 };
  }
  function probeSpatialWebGPU() {
    const secure = typeof window === "undefined" || window.isSecureContext, nav = typeof navigator === "undefined" ? {} : navigator;
    return { format: "vsr.spatial-webgpu-capabilities.v0.4", available: Boolean(nav.gpu) && secure, secureContext: secure, features: [], limits: {}, requiredFeatures: [], requiredLimits: {}, missingFeatures: [], missingLimits: {}, reason: nav.gpu ? secure ? void 0 : "insecure context" : "navigator.gpu unavailable" };
  }
  async function inspectSpatialWebGPU(options = {}) {
    const secure = typeof window === "undefined" || window.isSecureContext, nav = typeof navigator === "undefined" ? {} : navigator;
    if (!nav.gpu) return evaluateSpatialWebGPUCapabilities(void 0, options, secure, "navigator.gpu unavailable");
    try {
      const adapter = await nav.gpu.requestAdapter({ powerPreference: options.powerPreference ?? "high-performance" });
      return evaluateSpatialWebGPUCapabilities(adapter, options, secure, "adapter unavailable");
    } catch (error) {
      return evaluateSpatialWebGPUCapabilities(void 0, options, secure, `requestAdapter failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  var GPU_BUFFER_USAGE = { COPY_DST: 8, INDEX: 16, VERTEX: 32, UNIFORM: 64, STORAGE: 128, INDIRECT: 256 };
  var GPU_SHADER_STAGE = { COMPUTE: 4 };
  var GPU_TEXTURE_USAGE = { COPY_DST: 2, TEXTURE_BINDING: 4, RENDER_ATTACHMENT: 16 };
  var now = () => typeof performance !== "undefined" ? performance.now() : Date.now();
  var VSRSpatialWebGPUExecutor = class _VSRSpatialWebGPUExecutor {
    canvas;
    adapter;
    device;
    context;
    format;
    pipeline;
    shadowPipeline;
    cullingPipelines;
    cullingBindGroupLayout;
    depthTexture;
    shadowTexture;
    depthSize = "";
    shadowSize = 0;
    shadowSampler;
    shadowUniformBuffer;
    lost = false;
    lostReason;
    adapterName = "unknown";
    meshBuffers = /* @__PURE__ */ new Map();
    materialBuffers = /* @__PURE__ */ new Map();
    objectBuffers = /* @__PURE__ */ new Map();
    instanceBuffers = /* @__PURE__ */ new Map();
    identityIndexBuffers = /* @__PURE__ */ new Map();
    cullingBuffers = /* @__PURE__ */ new Map();
    shadowCullingBuffers = /* @__PURE__ */ new Map();
    deformationBuffers = /* @__PURE__ */ new Map();
    textures = /* @__PURE__ */ new Map();
    samplers = /* @__PURE__ */ new Map();
    cameraBuffer;
    shadowCullingCameraBuffer;
    constructor(canvas, adapter, device, context, format) {
      this.canvas = canvas;
      this.adapter = adapter;
      this.device = device;
      this.context = context;
      this.format = format;
      this.adapterName = String(adapter?.info?.description ?? adapter?.name ?? "unknown");
      void device.lost?.then?.((info) => {
        this.lost = true;
        const detail = info?.message ?? info?.reason;
        if (detail) this.lostReason = String(detail);
      });
    }
    static fromDevice(canvas, adapter, device, context, format) {
      return new _VSRSpatialWebGPUExecutor(canvas, adapter, device, context, format);
    }
    static async create(canvas, options = {}) {
      const nav = navigator;
      if (!nav.gpu) throw new Error("WebGPU unavailable: navigator.gpu is missing.");
      const secure = typeof window === "undefined" || window.isSecureContext, adapter = await nav.gpu.requestAdapter({ powerPreference: options.powerPreference ?? "high-performance" });
      if (!adapter) throw new Error("WebGPU adapter unavailable.");
      const capabilities = evaluateSpatialWebGPUCapabilities(adapter, options, secure);
      if (!capabilities.available) throw new Error(`WebGPU requirements unavailable: ${capabilities.reason ?? "unknown capability mismatch"}`);
      const device = await adapter.requestDevice({ requiredFeatures: options.requiredFeatures ?? [], requiredLimits: options.requiredLimits ?? {} }), context = canvas.getContext("webgpu");
      if (!context) throw new Error("Unable to acquire webgpu canvas context.");
      const format = nav.gpu.getPreferredCanvasFormat();
      context.configure({ device, format, alphaMode: options.alphaMode ?? "opaque" });
      return new _VSRSpatialWebGPUExecutor(canvas, adapter, device, context, format);
    }
    isLost() {
      return this.lost;
    }
    lossReason() {
      return this.lostReason;
    }
    ensurePipeline() {
      if (this.pipeline) return this.pipeline;
      const module = this.device.createShaderModule({ code: `${VSR_SPATIAL_VERTEX_WGSL_V04}
${VSR_SPATIAL_FRAGMENT_WGSL_V04}` });
      this.pipeline = this.device.createRenderPipeline({ layout: "auto", vertex: { module, entryPoint: "vs_main", buffers: [{ arrayStride: 64, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }, { shaderLocation: 1, offset: 12, format: "float32x3" }, { shaderLocation: 2, offset: 24, format: "float32x2" }, { shaderLocation: 3, offset: 32, format: "float32x4" }, { shaderLocation: 4, offset: 48, format: "float32x4" }] }] }, fragment: { module, entryPoint: "fs_main", targets: [{ format: this.format }] }, primitive: { topology: "triangle-list", frontFace: "ccw", cullMode: "back" }, depthStencil: { format: "depth24plus", depthWriteEnabled: true, depthCompare: "less" } });
      return this.pipeline;
    }
    ensureShadowPipeline() {
      if (this.shadowPipeline) return this.shadowPipeline;
      const module = this.device.createShaderModule({ code: VSR_SPATIAL_SHADOW_WGSL_V04 });
      this.shadowPipeline = this.device.createRenderPipeline({ layout: "auto", vertex: { module, entryPoint: "vs_shadow", buffers: [{ arrayStride: 64, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }, { shaderLocation: 3, offset: 32, format: "float32x4" }, { shaderLocation: 4, offset: 48, format: "float32x4" }] }] }, primitive: { topology: "triangle-list", frontFace: "ccw", cullMode: "back" }, depthStencil: { format: "depth32float", depthWriteEnabled: true, depthCompare: "less" } });
      return this.shadowPipeline;
    }
    ensureCullingPipelines() {
      if (this.cullingPipelines) return this.cullingPipelines;
      const module = this.device.createShaderModule({ code: VSR_SPATIAL_CULL_WGSL_V04 }), bindGroupLayout = this.device.createBindGroupLayout({ entries: [{ binding: 0, visibility: GPU_SHADER_STAGE.COMPUTE, buffer: { type: "uniform" } }, { binding: 1, visibility: GPU_SHADER_STAGE.COMPUTE, buffer: { type: "read-only-storage" } }, { binding: 2, visibility: GPU_SHADER_STAGE.COMPUTE, buffer: { type: "storage" } }, { binding: 3, visibility: GPU_SHADER_STAGE.COMPUTE, buffer: { type: "storage" } }, { binding: 4, visibility: GPU_SHADER_STAGE.COMPUTE, buffer: { type: "storage" } }] }), layout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }), make = (entryPoint) => this.device.createComputePipeline({ layout, compute: { module, entryPoint } });
      this.cullingBindGroupLayout = bindGroupLayout;
      this.cullingPipelines = { reset: make("cs_reset"), cull: make("cs_cull"), finalize: make("cs_finalize") };
      return this.cullingPipelines;
    }
    uploadBuffer(data, usage) {
      const size = Math.max(4, Math.ceil(data.byteLength / 4) * 4), buffer = this.device.createBuffer({ size, usage: usage | GPU_BUFFER_USAGE.COPY_DST });
      if (data.byteLength) this.device.queue.writeBuffer(buffer, 0, data.buffer, data.byteOffset, data.byteLength);
      return buffer;
    }
    mesh(scene, meshId) {
      const source = scene.meshes.find((mesh) => mesh.id === meshId);
      if (!source) throw new Error(`Missing mesh ${meshId}`);
      const root = cryptographicHash(source), cached = this.meshBuffers.get(meshId);
      if (cached?.root === root) return cached;
      cached?.vertex.destroy?.();
      cached?.index.destroy?.();
      const value = { vertex: this.uploadBuffer(packSpatialVertexBuffer(source), GPU_BUFFER_USAGE.VERTEX), index: this.uploadBuffer(packSpatialIndexBuffer(source), GPU_BUFFER_USAGE.INDEX), indexCount: source.indices.length, root };
      this.meshBuffers.set(meshId, value);
      return value;
    }
    material(scene, materialId) {
      const source = scene.materials.find((material) => material.id === materialId) ?? { id: materialId }, root = cryptographicHash(source), cached = this.materialBuffers.get(materialId);
      if (cached?.root === root) return cached.buffer;
      cached?.buffer.destroy?.();
      const buffer = this.uploadBuffer(packSpatialMaterialUniform(source), GPU_BUFFER_USAGE.UNIFORM);
      this.materialBuffers.set(materialId, { buffer, root });
      return buffer;
    }
    ensureFrameBuffers(plan) {
      const cameraBytes = packSpatialCameraUniform(plan);
      if (!this.cameraBuffer) this.cameraBuffer = this.uploadBuffer(cameraBytes, GPU_BUFFER_USAGE.UNIFORM);
      else this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraBytes.buffer, cameraBytes.byteOffset, cameraBytes.byteLength);
      const size = `${plan.viewport.width}x${plan.viewport.height}`;
      if (size !== this.depthSize) {
        this.depthTexture?.destroy?.();
        this.depthTexture = this.device.createTexture({ size: [plan.viewport.width, plan.viewport.height, 1], format: "depth24plus", usage: GPU_TEXTURE_USAGE.RENDER_ATTACHMENT | GPU_TEXTURE_USAGE.TEXTURE_BINDING });
        this.depthSize = size;
      }
      const shadowCamera = resolveSpatialShadowCamera(plan), shadowSize = shadowCamera?.size ?? Math.max(1, plan.budget.shadowMapSize);
      if (shadowSize !== this.shadowSize) {
        this.shadowTexture?.destroy?.();
        this.shadowTexture = this.device.createTexture({ size: [shadowSize, shadowSize, 1], format: "depth32float", usage: GPU_TEXTURE_USAGE.RENDER_ATTACHMENT | GPU_TEXTURE_USAGE.TEXTURE_BINDING });
        this.shadowSize = shadowSize;
      }
      const shadowBytes = packSpatialShadowUniform(shadowCamera);
      if (!this.shadowUniformBuffer) this.shadowUniformBuffer = this.uploadBuffer(shadowBytes, GPU_BUFFER_USAGE.UNIFORM);
      else this.device.queue.writeBuffer(this.shadowUniformBuffer, 0, shadowBytes.buffer, shadowBytes.byteOffset, shadowBytes.byteLength);
      if (!this.shadowSampler) this.shadowSampler = this.device.createSampler({ magFilter: "nearest", minFilter: "nearest", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" });
    }
    textureResource(scene, textureId, fallback) {
      const source = textureId ? scene.textures?.find((texture2) => texture2.id === textureId) : void 0, key = source ? `texture:${source.id}:${fallback}` : `fallback:${fallback}`, width = source?.width ?? 1, height = source?.height ?? 1, root = cryptographicHash(source ?? { fallback }), cached = this.textures.get(key);
      let texture = cached?.texture;
      if (!cached || cached.root !== root) {
        cached?.texture.destroy?.();
        texture = this.device.createTexture({ size: [width, height, 1], format: (fallback === "base" || fallback === "emissive" || fallback === "environment") && source?.colorSpace !== "linear" ? "rgba8unorm-srgb" : "rgba8unorm", usage: GPU_TEXTURE_USAGE.COPY_DST | GPU_TEXTURE_USAGE.TEXTURE_BINDING });
        const pixels = source ? source.pixels : fallback === "normal" ? [128, 128, 255, 255] : fallback === "metallic-roughness" ? [255, 255, 0, 255] : [255, 255, 255, 255], bytesPerRow = Math.max(256, Math.ceil(width * 4 / 256) * 256), data = new Uint8Array(bytesPerRow * height);
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
          const sourceIndex = (y * width + x) * 4, dataIndex = y * bytesPerRow + x * 4;
          data[dataIndex] = pixels[sourceIndex] ?? 255;
          data[dataIndex + 1] = pixels[sourceIndex + 1] ?? 255;
          data[dataIndex + 2] = pixels[sourceIndex + 2] ?? 255;
          data[dataIndex + 3] = pixels[sourceIndex + 3] ?? 255;
        }
        this.device.queue.writeTexture({ texture }, data, { bytesPerRow, rowsPerImage: height }, [width, height, 1]);
        this.textures.set(key, { texture, root });
      }
      const filter = source?.filter ?? (fallback === "environment" ? "linear" : "nearest"), samplerKey = source ? `${source.id}:${filter}:${source.wrapU ?? "repeat"}:${source.wrapV ?? (fallback === "environment" ? "clamp" : "repeat")}` : `fallback:${fallback}`;
      let sampler = this.samplers.get(samplerKey);
      if (!sampler) {
        sampler = this.device.createSampler({ magFilter: filter === "nearest" ? "nearest" : "linear", minFilter: filter === "nearest" ? "nearest" : "linear", addressModeU: source?.wrapU === "clamp" ? "clamp-to-edge" : "repeat", addressModeV: source?.wrapV === "clamp" || fallback === "environment" && source?.wrapV === void 0 ? "clamp-to-edge" : "repeat" });
        this.samplers.set(samplerKey, sampler);
      }
      return { view: texture.createView(), sampler };
    }
    objectBuffer(packet) {
      const data = transposeMat4(identityMat4());
      let buffer = this.objectBuffers.get(packet.nodeId);
      if (!buffer) {
        buffer = this.uploadBuffer(data, GPU_BUFFER_USAGE.UNIFORM);
        this.objectBuffers.set(packet.nodeId, buffer);
      }
      return buffer;
    }
    instanceBuffer(packet) {
      const data = packSpatialInstanceBuffer(packet), root = cryptographicHash(packetInstances(packet)), cached = this.instanceBuffers.get(packet.nodeId);
      if (!cached || cached.byteLength !== data.byteLength) {
        cached?.buffer.destroy?.();
        const buffer = this.uploadBuffer(data, GPU_BUFFER_USAGE.STORAGE);
        this.instanceBuffers.set(packet.nodeId, { buffer, root, byteLength: data.byteLength });
        return buffer;
      }
      if (cached.root !== root) this.device.queue.writeBuffer(cached.buffer, 0, data.buffer, data.byteOffset, data.byteLength);
      if (cached.root !== root) this.instanceBuffers.set(packet.nodeId, { ...cached, root });
      return cached.buffer;
    }
    identityIndexBuffer(packet) {
      const data = packSpatialVisibleInstanceIndices(packet), root = cryptographicHash(data), cached = this.identityIndexBuffers.get(packet.nodeId);
      if (!cached || cached.byteLength !== data.byteLength) {
        cached?.buffer.destroy?.();
        const buffer = this.uploadBuffer(data, GPU_BUFFER_USAGE.STORAGE);
        this.identityIndexBuffers.set(packet.nodeId, { buffer, root, byteLength: data.byteLength });
        return buffer;
      }
      return cached.buffer;
    }
    shadowCullingCamera(camera) {
      const data = transposeMat4(camera.viewProjection);
      if (!this.shadowCullingCameraBuffer) this.shadowCullingCameraBuffer = this.uploadBuffer(data, GPU_BUFFER_USAGE.UNIFORM);
      else this.device.queue.writeBuffer(this.shadowCullingCameraBuffer, 0, data.buffer, data.byteOffset, data.byteLength);
      return this.shadowCullingCameraBuffer;
    }
    culling(packet, buffers = this.cullingBuffers) {
      const boundsData = packSpatialInstanceBoundsBuffer(packet), identity = packSpatialVisibleInstanceIndices(packet), command = packSpatialIndirectDrawCommand(packet), root = cryptographicHash({ bounds: [...boundsData], command: [...command] }), cached = buffers.get(packet.nodeId);
      if (!cached || cached.byteLength !== boundsData.byteLength) {
        cached?.bounds.destroy?.();
        cached?.visible.destroy?.();
        cached?.counter.destroy?.();
        cached?.indirect.destroy?.();
        const value = { bounds: this.uploadBuffer(boundsData, GPU_BUFFER_USAGE.STORAGE), visible: this.uploadBuffer(identity, GPU_BUFFER_USAGE.STORAGE), counter: this.uploadBuffer(new Uint32Array([0]), GPU_BUFFER_USAGE.STORAGE), indirect: this.uploadBuffer(command, GPU_BUFFER_USAGE.STORAGE | GPU_BUFFER_USAGE.INDIRECT), root, byteLength: boundsData.byteLength };
        buffers.set(packet.nodeId, value);
        return value;
      }
      if (cached.root !== root) {
        this.device.queue.writeBuffer(cached.bounds, 0, boundsData.buffer, boundsData.byteOffset, boundsData.byteLength);
        this.device.queue.writeBuffer(cached.visible, 0, identity.buffer, identity.byteOffset, identity.byteLength);
        this.device.queue.writeBuffer(cached.counter, 0, new Uint32Array([0]).buffer, 0, 4);
        this.device.queue.writeBuffer(cached.indirect, 0, command.buffer, command.byteOffset, command.byteLength);
        buffers.set(packet.nodeId, { ...cached, root });
      }
      return cached;
    }
    deformation(scene, packet) {
      const mesh = scene.meshes.find((entry) => entry.id === packet.meshId);
      if (!mesh) throw new Error(`Missing mesh ${packet.meshId}`);
      const root = cryptographicHash({ deformation: packet.deformationRoot, morphTargets: mesh.morphTargets ?? [] }), cached = this.deformationBuffers.get(packet.nodeId);
      if (cached?.root === root) return cached;
      cached?.joint.destroy?.();
      cached?.morph.destroy?.();
      cached?.uniform.destroy?.();
      const joint = this.uploadBuffer(packSpatialJointBuffer(packet), GPU_BUFFER_USAGE.STORAGE), morph = this.uploadBuffer(packSpatialMorphBuffer(mesh), GPU_BUFFER_USAGE.STORAGE), uniform = this.uploadBuffer(packSpatialDeformationUniform(packet, mesh.positions.length / 3, mesh.morphTargets?.length ?? 0), GPU_BUFFER_USAGE.UNIFORM), value = { joint, morph, uniform, root };
      this.deformationBuffers.set(packet.nodeId, value);
      return value;
    }
    objectGroup(pipeline, buffer, instanceBuffer, deformation, visibleIndexBuffer) {
      return this.device.createBindGroup({ layout: pipeline.getBindGroupLayout(1), entries: [{ binding: 0, resource: { buffer } }, { binding: 1, resource: { buffer: deformation.joint } }, { binding: 2, resource: { buffer: deformation.uniform } }, { binding: 3, resource: { buffer: deformation.morph } }, { binding: 4, resource: { buffer: instanceBuffer } }, { binding: 5, resource: { buffer: visibleIndexBuffer } }] });
    }
    materialGroup(pipeline, scene, packet) {
      const material = scene.materials.find((entry) => entry.id === packet.materialId), base = this.textureResource(scene, material?.baseColorTextureId, "base"), metallicRoughness = this.textureResource(scene, material?.metallicRoughnessTextureId, "metallic-roughness"), normal = this.textureResource(scene, material?.normalTextureId, "normal"), occlusion = this.textureResource(scene, material?.occlusionTextureId, "occlusion"), emissive = this.textureResource(scene, material?.emissiveTextureId, "emissive");
      return this.device.createBindGroup({ layout: pipeline.getBindGroupLayout(2), entries: [{ binding: 0, resource: { buffer: this.material(scene, packet.materialId) } }, { binding: 1, resource: base.sampler }, { binding: 2, resource: base.view }, { binding: 3, resource: metallicRoughness.sampler }, { binding: 4, resource: metallicRoughness.view }, { binding: 5, resource: normal.sampler }, { binding: 6, resource: normal.view }, { binding: 7, resource: occlusion.sampler }, { binding: 8, resource: occlusion.view }, { binding: 9, resource: emissive.sampler }, { binding: 10, resource: emissive.view }] });
    }
    async render(scene, options = {}) {
      const compileStart = now(), plan = compileSpatialFrame(scene, options), verification = verifySpatialFrame(plan);
      if (!verification.ok) throw new Error(verification.diagnostics.join("; "));
      const compileMs = now() - compileStart;
      if (this.lost) throw new Error("WebGPU device is lost.");
      this.canvas.width = plan.viewport.width;
      this.canvas.height = plan.viewport.height;
      const pipeline = this.ensurePipeline(), shadowCamera = resolveSpatialShadowCamera(plan), gpuDriven = Boolean(plan.gpuDrivenCulling), uploadStart = now();
      this.ensureFrameBuffers(plan);
      const environmentResource = this.textureResource(scene, plan.environment.textureId, "environment"), cameraGroup = this.device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: this.cameraBuffer } }, { binding: 1, resource: this.shadowSampler }, { binding: 2, resource: this.shadowTexture.createView() }, { binding: 3, resource: { buffer: this.shadowUniformBuffer } }, { binding: 4, resource: environmentResource.sampler }, { binding: 5, resource: environmentResource.view }] }), shadowPackets = plan.drawPackets.filter((entry) => entry.castShadow), cullingRecords = /* @__PURE__ */ new Map(), shadowCullingRecords = /* @__PURE__ */ new Map();
      if (gpuDriven) for (const packet of plan.drawPackets) cullingRecords.set(packet.nodeId, this.culling(packet));
      if (gpuDriven && shadowCamera) for (const packet of shadowPackets) shadowCullingRecords.set(packet.nodeId, this.culling(packet, this.shadowCullingBuffers));
      const uploadMs = now() - uploadStart, encodeStart = now(), encoder = this.device.createCommandEncoder();
      const encodeCulling = (cameraBuffer, records, packets) => {
        const cullingPipelines = this.ensureCullingPipelines(), computePass = encoder.beginComputePass();
        for (const packet of packets) {
          const culling = records.get(packet.nodeId);
          const group = this.device.createBindGroup({ layout: this.cullingBindGroupLayout, entries: [{ binding: 0, resource: { buffer: cameraBuffer } }, { binding: 1, resource: { buffer: culling.bounds } }, { binding: 2, resource: { buffer: culling.visible } }, { binding: 3, resource: { buffer: culling.counter } }, { binding: 4, resource: { buffer: culling.indirect } }] });
          computePass.setBindGroup(0, group);
          computePass.setPipeline(cullingPipelines.reset);
          computePass.dispatchWorkgroups(1);
          computePass.setPipeline(cullingPipelines.cull);
          computePass.dispatchWorkgroups(Math.max(1, Math.ceil(packetInstanceCount(packet) / 64)));
          computePass.setPipeline(cullingPipelines.finalize);
          computePass.dispatchWorkgroups(1);
        }
        computePass.end();
      };
      if (gpuDriven && shadowCamera) encodeCulling(this.shadowCullingCamera(shadowCamera), shadowCullingRecords, shadowPackets);
      if (gpuDriven) encodeCulling(this.cameraBuffer, cullingRecords, plan.drawPackets);
      if (shadowCamera) {
        const shadowPipeline = this.ensureShadowPipeline(), shadowGroup = this.device.createBindGroup({ layout: shadowPipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: this.shadowUniformBuffer } }] }), shadowPass = encoder.beginRenderPass({ colorAttachments: [], depthStencilAttachment: { view: this.shadowTexture.createView(), depthClearValue: 1, depthLoadOp: "clear", depthStoreOp: "store" } });
        shadowPass.setPipeline(shadowPipeline);
        shadowPass.setBindGroup(0, shadowGroup);
        for (const packet of shadowPackets) {
          const mesh = this.mesh(scene, packet.meshId), objectBuffer = this.objectBuffer(packet), instanceBuffer = this.instanceBuffer(packet), deformation = this.deformation(scene, packet), culling = gpuDriven ? shadowCullingRecords.get(packet.nodeId) : void 0;
          shadowPass.setBindGroup(1, this.objectGroup(shadowPipeline, objectBuffer, instanceBuffer, deformation, culling?.visible ?? this.identityIndexBuffer(packet)));
          shadowPass.setVertexBuffer(0, mesh.vertex);
          shadowPass.setIndexBuffer(mesh.index, "uint32");
          if (culling) shadowPass.drawIndexedIndirect(culling.indirect, 0);
          else shadowPass.drawIndexed(mesh.indexCount, packetInstanceCount(packet), 0, 0, 0);
        }
        shadowPass.end();
      }
      const pass = encoder.beginRenderPass({ colorAttachments: [{ view: this.context.getCurrentTexture().createView(), clearValue: { r: 0.02, g: 0.035, b: 0.075, a: 1 }, loadOp: "clear", storeOp: "store" }], depthStencilAttachment: { view: this.depthTexture.createView(), depthClearValue: 1, depthLoadOp: "clear", depthStoreOp: "store" } });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, cameraGroup);
      for (const packet of plan.drawPackets) {
        const mesh = this.mesh(scene, packet.meshId), objectBuffer = this.objectBuffer(packet), instanceBuffer = this.instanceBuffer(packet), deformation = this.deformation(scene, packet), culling = gpuDriven ? cullingRecords.get(packet.nodeId) : void 0;
        pass.setBindGroup(1, this.objectGroup(pipeline, objectBuffer, instanceBuffer, deformation, culling?.visible ?? this.identityIndexBuffer(packet)));
        pass.setBindGroup(2, this.materialGroup(pipeline, scene, packet));
        pass.setVertexBuffer(0, mesh.vertex);
        pass.setIndexBuffer(mesh.index, "uint32");
        if (culling) pass.drawIndexedIndirect(culling.indirect, 0);
        else pass.drawIndexed(mesh.indexCount, packetInstanceCount(packet), 0, 0, 0);
      }
      pass.end();
      const commands = encoder.finish(), encodeMs = now() - encodeStart, submitStart = now();
      this.device.queue.submit([commands]);
      await this.device.queue.onSubmittedWorkDone?.();
      const submitMs = now() - submitStart, base = { format: "vsr.spatial-webgpu-receipt.v0.4", frameRoot: plan.frameRoot, sceneId: scene.sceneId, adapterName: this.adapterName, drawCalls: plan.drawPackets.length, triangles: plan.stats.triangleCount, submitted: true, deviceLost: this.lost, ...this.lostReason ? { deviceLostReason: this.lostReason } : {}, compileMs, uploadMs, encodeMs, submitMs, materialTextureBindings: plan.stats.materialTextureBindings, shadowPasses: shadowCamera ? 1 : 0, visibleInstances: plan.stats.visibleInstances ?? plan.drawPackets.reduce((sum, packet) => sum + packetInstanceCount(packet), 0), instancedDraws: plan.stats.instancedDraws ?? plan.drawPackets.filter((packet) => packetInstanceCount(packet) > 1).length, gpuDrivenDraws: gpuDriven ? plan.drawPackets.length : 0, gpuDrivenShadowDraws: gpuDriven && shadowCamera ? shadowPackets.length : 0 };
      return { ...base, receiptRoot: cryptographicHash(base) };
    }
    destroy() {
      for (const mesh of this.meshBuffers.values()) {
        mesh.vertex.destroy?.();
        mesh.index.destroy?.();
      }
      for (const material of this.materialBuffers.values()) material.buffer.destroy?.();
      for (const buffer of this.objectBuffers.values()) buffer.destroy?.();
      for (const instance of this.instanceBuffers.values()) instance.buffer.destroy?.();
      for (const identity of this.identityIndexBuffers.values()) identity.buffer.destroy?.();
      for (const records of [this.cullingBuffers, this.shadowCullingBuffers]) for (const culling of records.values()) {
        culling.bounds.destroy?.();
        culling.visible.destroy?.();
        culling.counter.destroy?.();
        culling.indirect.destroy?.();
      }
      for (const deformation of this.deformationBuffers.values()) {
        deformation.joint.destroy?.();
        deformation.morph.destroy?.();
        deformation.uniform.destroy?.();
      }
      for (const entry of this.textures.values()) entry.texture.destroy?.();
      this.cameraBuffer?.destroy?.();
      this.shadowCullingCameraBuffer?.destroy?.();
      this.shadowUniformBuffer?.destroy?.();
      this.depthTexture?.destroy?.();
      this.shadowTexture?.destroy?.();
      this.meshBuffers.clear();
      this.materialBuffers.clear();
      this.objectBuffers.clear();
      this.instanceBuffers.clear();
      this.identityIndexBuffers.clear();
      this.cullingBuffers.clear();
      this.shadowCullingBuffers.clear();
      this.deformationBuffers.clear();
      this.textures.clear();
      this.samplers.clear();
      this.pipeline = void 0;
      this.shadowPipeline = void 0;
      this.cullingPipelines = void 0;
      this.cullingBindGroupLayout = void 0;
    }
  };
  function verifySpatialWebGPUReceipt(receipt) {
    const { receiptRoot, ...base } = receipt;
    return cryptographicHash(base) === receiptRoot;
  }
  function createSpatialShowcaseScene() {
    return { format: VSR_SPATIAL_SCENE_FORMAT, sceneId: "spatial-showcase", title: "VSR v0.4 \u4E09\u7EF4\u7A7A\u95F4\u73B0\u5B9E", background: "#07101e", environment: { diffuseColor: "#243b5a", specularColor: "#d9e7ff", intensity: 0.65 }, activeCameraId: "camera:main", meshes: [createCubeMesh("mesh:cube", 1), createPlaneMesh("mesh:ground", 9, 9), createUVSphereMesh("mesh:sphere", 0.7, 24, 16), createCubeMesh("mesh:cube-low", 1)], materials: [{ id: "mat:blue-metal", baseColor: "#3b82f6", metallic: 0.72, roughness: 0.24 }, { id: "mat:red", baseColor: "#ef4444", metallic: 0.08, roughness: 0.45 }, { id: "mat:ground", baseColor: "#253449", metallic: 0.05, roughness: 0.85, doubleSided: true }, { id: "mat:emissive", baseColor: "#5eead4", metallic: 0.2, roughness: 0.3, emissive: "#14b8a6", emissiveStrength: 0.25 }], nodes: [{ id: "ground", meshId: "mesh:ground", materialId: "mat:ground", receiveShadow: true, castShadow: false }, { id: "cube-a", meshId: "mesh:cube", materialId: "mat:blue-metal", transform: { translation: [-1.5, 0.65, 0], rotationEulerDeg: [0, 28, 0] }, lods: [{ maxDistance: 8, meshId: "mesh:cube" }, { maxDistance: 100, meshId: "mesh:cube-low" }] }, { id: "sphere-a", meshId: "mesh:sphere", materialId: "mat:red", transform: { translation: [0, 0.8, -0.6] } }, { id: "cube-b", meshId: "mesh:cube", materialId: "mat:emissive", transform: { translation: [1.6, 0.55, 0.5], rotationEulerDeg: [10, -22, 8], scale: [0.8, 1.1, 0.8] } }, { id: "child-cube", parentId: "cube-b", meshId: "mesh:cube", materialId: "mat:blue-metal", transform: { translation: [0, 1.25, 0], scale: [0.35, 0.35, 0.35] } }], cameras: [{ id: "camera:main", projection: "perspective", fovYDeg: 52, near: 0.1, far: 100, transform: { translation: [4.8, 3.4, 6.4], rotationEulerDeg: [-18, 36, 0] } }], lights: [{ id: "light:ambient", kind: "ambient", color: "#7c9bc4", intensity: 0.16 }, { id: "light:sun", kind: "directional", color: "#fff2d6", intensity: 2.1, direction: [-0.55, -1, -0.35], castShadow: true }, { id: "light:fill", kind: "point", color: "#60a5fa", intensity: 5, position: [-2.8, 2.4, 2.5], range: 7 }], reality: { worldId: "world:spatial-showcase", generation: 1, realityRoot: cryptographicHash({ world: "spatial-showcase", generation: 1 }) } };
  }
  return __toCommonJS(index_exports);
})();
