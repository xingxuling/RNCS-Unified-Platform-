import {
  createRepresentationPortfolio,
  evaluateRepresentationPortfolioComposition,
  rootHash,
  verifyRepresentationPortfolio,
  verifyRepresentationSlot,
  REALITY_VISUAL_QUALITY_PROFILES
} from '@taowind/rncs-core-contract';

export const URRF_PORTFOLIO_RUNTIME_FORMAT = 'urrf.representation-portfolio-runtime.v0.3';
export const URRF_PORTFOLIO_RUNTIME_VERSION = '0.3.0';
export const URRF_VISUAL_EVIDENCE_FORMAT = 'urrf.visual-evidence.v0.3';
export const URRF_VISUAL_EVIDENCE_STATUSES = Object.freeze(['NOT_RUN', 'LOCAL_RENDERED', 'REMOTE_RENDERED', 'FAILED']);
export const URRF_VISUAL_QUALITY_STATUSES = Object.freeze(['OBSERVED_NOT_GRADED', 'CANDIDATE', 'VERIFIED']);

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new Error(code); };
const text = (value, code, fallback = '') => {
  const result = String(value ?? fallback).trim();
  fail(result.length > 0, code);
  return result;
};
const integer = (value, code, fallback = 0, {min = 0, max = Number.MAX_SAFE_INTEGER} = {}) => {
  const result = value === undefined || value === null ? fallback : Number(value);
  fail(Number.isSafeInteger(result) && result >= min && result <= max, code);
  return result;
};
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(value => String(value).trim()).filter(Boolean))].sort(keySort);

function normalizePortfolio(input) {
  const portfolio = input?.portfolio_root ? clone(input) : createRepresentationPortfolio(input);
  const verification = verifyRepresentationPortfolio(portfolio);
  fail(verification.valid, `URRF_PORTFOLIO_INVALID:${verification.errors.join(',')}`);
  return portfolio;
}

function resourceFits(slot, resourceBudget) {
  const budget = record(resourceBudget?.available ?? resourceBudget);
  const checks = [
    ['CPU_MILLI', ['CPU_MILLI', 'CPU']],
    ['GPU_MILLI', ['GPU_MILLI', 'GPU']],
    ['NPU_MILLI', ['NPU_MILLI', 'NPU']],
    ['VRAM_MB', ['VRAM_MB', 'VRAM']],
    ['RAM_MB', ['RAM_MB', 'RAM']],
    ['STORAGE_KB', ['STORAGE_KB', 'STORAGE']],
    ['NETWORK_KB', ['NETWORK_KB', 'NETWORK']],
    ['ENERGY_MILLI', ['ENERGY_MILLI', 'ENERGY']]
  ];
  return checks.every(([costKey, budgetKeys]) => {
    const availableKey = budgetKeys.find(key => budget[key] !== undefined);
    return availableKey === undefined || Number(budget[availableKey]) >= Number(slot.resource_costs?.[costKey] ?? 0);
  });
}

function qualityDistance(slot, requested) {
  if (!requested) return 0;
  const requestedRank = REALITY_VISUAL_QUALITY_PROFILES.indexOf(String(requested).toUpperCase());
  if (requestedRank < 0) return Number.MAX_SAFE_INTEGER;
  return Math.abs(slot.quality_rank - requestedRank);
}

function qualityRankForRequest(value, code) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).toUpperCase();
  const rank = REALITY_VISUAL_QUALITY_PROFILES.indexOf(normalized);
  fail(rank >= 0, code);
  return rank;
}

function selectComparator(request, diversity) {
  const requested = request.quality_profile ?? request.qualityProfile ?? null;
  const requestedRank = requested === null ? null : REALITY_VISUAL_QUALITY_PROFILES.indexOf(String(requested).toUpperCase());
  return (a, b) => {
    const aExact = requestedRank === null ? 0 : a.slot.quality_rank === requestedRank ? 1 : 0;
    const bExact = requestedRank === null ? 0 : b.slot.quality_rank === requestedRank ? 1 : 0;
    const aNotAbove = requestedRank === null ? 0 : a.slot.quality_rank <= requestedRank ? 1 : 0;
    const bNotAbove = requestedRank === null ? 0 : b.slot.quality_rank <= requestedRank ? 1 : 0;
    return b.exactDiversity - a.exactDiversity
      || bExact - aExact
      || bNotAbove - aNotAbove
      || (requestedRank === null ? b.slot.quality_rank - a.slot.quality_rank : qualityDistance(a.slot, requested) - qualityDistance(b.slot, requested))
      || Number(b.slot.required_for_minimum) - Number(a.slot.required_for_minimum)
      || keySort(a.slot.slot_id, b.slot.slot_id);
  };
}

function selectionBody(portfolio, slot, request, {fallbackUsed = false, reasonCodes = []} = {}) {
  return {
    format: 'urrf.representation-slot-selection.v0.3',
    version: URRF_PORTFOLIO_RUNTIME_VERSION,
    portfolio_id: portfolio.portfolio_id,
    portfolio_root: portfolio.portfolio_root,
    object_id: portfolio.object_id,
    requested_quality_profile: request.quality_profile ?? request.qualityProfile ?? null,
    requested_diversity: clone(request.diversity ?? request.diversity_axes ?? request.diversityAxes ?? {}),
    selected_slot_id: slot?.slot_id ?? null,
    selected_slot_root: slot?.slot_root ?? null,
    fallback_used: fallbackUsed,
    reason_codes: strings(reasonCodes),
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false
  };
}

function normalizeVisualEvidence(input, portfolio, slot) {
  const value = record(input);
  const status = text(value.status, 'URRF_VISUAL_EVIDENCE_STATUS_REQUIRED', 'LOCAL_RENDERED').toUpperCase();
  fail(URRF_VISUAL_EVIDENCE_STATUSES.includes(status), 'URRF_VISUAL_EVIDENCE_STATUS_INVALID');
  const quality_status = text(value.quality_status ?? value.qualityStatus, 'URRF_VISUAL_QUALITY_STATUS_REQUIRED', 'OBSERVED_NOT_GRADED').toUpperCase();
  fail(URRF_VISUAL_QUALITY_STATUSES.includes(quality_status), 'URRF_VISUAL_QUALITY_STATUS_INVALID');
  const pixel_root = value.pixel_root ?? value.pixelRoot ?? null;
  const frame_root = value.frame_root ?? value.frameRoot ?? null;
  const environment_root = value.environment_root ?? value.environmentRoot ?? null;
  const animation_root = value.animation_root ?? value.animationRoot ?? null;
  if (pixel_root !== null) fail(hex64(pixel_root), 'URRF_VISUAL_PIXEL_ROOT_INVALID');
  if (frame_root !== null) fail(hex64(frame_root), 'URRF_VISUAL_FRAME_ROOT_INVALID');
  if (environment_root !== null) fail(hex64(environment_root), 'URRF_VISUAL_ENVIRONMENT_ROOT_INVALID');
  if (animation_root !== null) fail(hex64(animation_root), 'URRF_VISUAL_ANIMATION_ROOT_INVALID');
  if (status === 'LOCAL_RENDERED' || status === 'REMOTE_RENDERED') {
    fail(pixel_root !== null && frame_root !== null, 'URRF_VISUAL_RENDER_ROOTS_REQUIRED');
    fail(Number(value.png_bytes ?? value.pngBytes ?? 0) > 0, 'URRF_VISUAL_RENDER_BYTES_REQUIRED');
  }
  const base = {
    format: URRF_VISUAL_EVIDENCE_FORMAT,
    version: URRF_PORTFOLIO_RUNTIME_VERSION,
    evidence_id: text(value.evidence_id ?? value.evidenceId, 'URRF_VISUAL_EVIDENCE_ID_REQUIRED', `visual:${portfolio.portfolio_id}:${slot.slot_id}:${status.toLowerCase()}`),
    portfolio_id: portfolio.portfolio_id,
    portfolio_root: portfolio.portfolio_root,
    object_id: portfolio.object_id,
    slot_id: slot.slot_id,
    slot_root: slot.slot_root,
    status,
    quality_status,
    width: integer(value.width, 'URRF_VISUAL_EVIDENCE_WIDTH_INVALID', slot.render_profile.width, {min: 1, max: 16384}),
    height: integer(value.height, 'URRF_VISUAL_EVIDENCE_HEIGHT_INVALID', slot.render_profile.height, {min: 1, max: 16384}),
    pixel_root: pixel_root === null ? null : String(pixel_root).toLowerCase(),
    frame_root: frame_root === null ? null : String(frame_root).toLowerCase(),
    environment_root: environment_root === null ? null : String(environment_root).toLowerCase(),
    animation_root: animation_root === null ? null : String(animation_root).toLowerCase(),
    png_bytes: integer(value.png_bytes ?? value.pngBytes, 'URRF_VISUAL_EVIDENCE_PNG_BYTES_INVALID', 0),
    triangles: integer(value.triangles, 'URRF_VISUAL_EVIDENCE_TRIANGLES_INVALID', 0),
    draw_calls: integer(value.draw_calls ?? value.drawCalls, 'URRF_VISUAL_EVIDENCE_DRAW_CALLS_INVALID', 0),
    diversity_observation: clone(value.diversity_observation ?? value.diversityObservation ?? slot.diversity_axes),
    notes: value.notes ?? null,
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false
  };
  return {...base, evidence_root: rootHash(base)};
}

export function verifyVisualEvidence(evidence) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!evidence || typeof evidence !== 'object') return {valid: false, errors: ['URRF_VISUAL_EVIDENCE_NOT_OBJECT']};
  try {
    const copy = clone(evidence);
    const evidenceRoot = copy.evidence_root;
    delete copy.evidence_root;
    check(evidence.format === URRF_VISUAL_EVIDENCE_FORMAT, 'URRF_VISUAL_EVIDENCE_FORMAT_INVALID');
    check(evidence.version === URRF_PORTFOLIO_RUNTIME_VERSION, 'URRF_VISUAL_EVIDENCE_VERSION_INVALID');
    for (const field of ['evidence_id', 'portfolio_id', 'object_id', 'slot_id']) check(typeof evidence[field] === 'string' && evidence[field].length > 0, `URRF_VISUAL_EVIDENCE_${field.toUpperCase()}_REQUIRED`);
    for (const field of ['portfolio_root', 'slot_root']) check(hex64(evidence[field]), `URRF_VISUAL_EVIDENCE_${field.toUpperCase()}_INVALID`);
    check(URRF_VISUAL_EVIDENCE_STATUSES.includes(evidence.status), 'URRF_VISUAL_EVIDENCE_STATUS_INVALID');
    check(URRF_VISUAL_QUALITY_STATUSES.includes(evidence.quality_status), 'URRF_VISUAL_QUALITY_STATUS_INVALID');
    for (const field of ['width', 'height', 'png_bytes', 'triangles', 'draw_calls']) check(Number.isSafeInteger(evidence[field]) && evidence[field] >= 0, `URRF_VISUAL_EVIDENCE_${field.toUpperCase()}_INVALID`);
    check(evidence.width > 0 && evidence.height > 0, 'URRF_VISUAL_EVIDENCE_DIMENSIONS_INVALID');
    check(evidence.pixel_root === null || hex64(evidence.pixel_root), 'URRF_VISUAL_PIXEL_ROOT_INVALID');
    check(evidence.frame_root === null || hex64(evidence.frame_root), 'URRF_VISUAL_FRAME_ROOT_INVALID');
    check(evidence.environment_root === null || hex64(evidence.environment_root), 'URRF_VISUAL_ENVIRONMENT_ROOT_INVALID');
    check(evidence.animation_root === null || hex64(evidence.animation_root), 'URRF_VISUAL_ANIMATION_ROOT_INVALID');
    if (evidence.status === 'LOCAL_RENDERED' || evidence.status === 'REMOTE_RENDERED') {
      check(hex64(evidence.pixel_root) && hex64(evidence.frame_root), 'URRF_VISUAL_RENDER_ROOTS_REQUIRED');
      check(evidence.png_bytes > 0, 'URRF_VISUAL_RENDER_BYTES_REQUIRED');
    }
    check(evidence.candidate_only === true && evidence.authoritative === false && evidence.canonical_write_authorized === false, 'URRF_VISUAL_EVIDENCE_AUTHORITY_BOUNDARY_INVALID');
    check(hex64(evidenceRoot) && rootHash(copy) === evidenceRoot, 'URRF_VISUAL_EVIDENCE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`URRF_VISUAL_EVIDENCE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, evidence_root: evidence.evidence_root ?? null};
}

export function verifyPortfolioRuntimeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || !hex64(snapshot.runtime_root)) return false;
  const copy = clone(snapshot);
  delete copy.runtime_root;
  return rootHash(copy) === snapshot.runtime_root;
}

export class RealityRepresentationPortfolioRuntime {
  constructor({fabric = null, portfolios = []} = {}) {
    this.fabric = fabric;
    this.portfolios = new Map();
    this.visualEvidence = new Map();
    for (const portfolio of portfolios) this.registerPortfolio(portfolio);
  }

  registerPortfolio(input = {}) {
    const portfolio = normalizePortfolio(input);
    const existing = this.portfolios.get(portfolio.portfolio_id);
    if (existing) {
      fail(existing.portfolio_root === portfolio.portfolio_root, 'URRF_PORTFOLIO_ROOT_CONFLICT');
      return clone(existing);
    }
    this.portfolios.set(portfolio.portfolio_id, portfolio);
    return clone(portfolio);
  }

  getPortfolio(portfolioId) {
    return clone(this.portfolios.get(String(portfolioId)) ?? null);
  }

  listPortfolios() {
    return [...this.portfolios.values()].sort((a, b) => keySort(a.portfolio_id, b.portfolio_id)).map(clone);
  }

  evaluate(portfolioId) {
    const portfolio = this.portfolios.get(String(portfolioId));
    fail(portfolio, `URRF_PORTFOLIO_NOT_REGISTERED:${portfolioId}`);
    return evaluateRepresentationPortfolioComposition(portfolio.composition, portfolio.slots);
  }

  selectSlot(input = {}) {
    const request = record(input);
    const portfolioId = request.portfolio_id ?? request.portfolioId;
    const portfolio = this.portfolios.get(String(portfolioId));
    fail(portfolio, `URRF_PORTFOLIO_NOT_REGISTERED:${portfolioId}`);
    const requestedDiversity = record(request.diversity ?? request.diversity_axes ?? request.diversityAxes);
    const candidates = portfolio.slots.filter(slot => {
      const requestedQuality = request.quality_profile ?? request.qualityProfile;
      if (requestedQuality && !REALITY_VISUAL_QUALITY_PROFILES.includes(String(requestedQuality).toUpperCase())) return false;
      if (request.slot_id && slot.slot_id !== String(request.slot_id)) return false;
      if (request.representation_id && slot.representation_id !== String(request.representation_id)) return false;
      const minimumQualityRank = qualityRankForRequest(request.minimum_quality_profile ?? request.minimumQualityProfile, 'URRF_PORTFOLIO_MINIMUM_QUALITY_INVALID');
      const maximumQualityRank = qualityRankForRequest(request.maximum_quality_profile ?? request.maximumQualityProfile, 'URRF_PORTFOLIO_MAXIMUM_QUALITY_INVALID');
      if (minimumQualityRank !== null && slot.quality_rank < minimumQualityRank) return false;
      if (maximumQualityRank !== null && slot.quality_rank > maximumQualityRank) return false;
      if (!resourceFits(slot, request.resource_budget ?? request.resourceBudget)) return false;
      return true;
    }).map(slot => {
      const exactDiversity = Object.entries(requestedDiversity).filter(([axis, value]) => slot.diversity_axes?.[String(axis).toUpperCase()] === String(value).toUpperCase()).length;
      return {slot, exactDiversity};
    });
    const reasonCodes = [];
    let fallbackUsed = false;
    let selected = candidates.sort(selectComparator(request, requestedDiversity))[0]?.slot ?? null;
    if (!selected && request.preserve_minimum_reality !== false) {
      selected = portfolio.slots.filter(slot => slot.required_for_minimum).sort((a, b) => a.quality_rank - b.quality_rank || keySort(a.slot_id, b.slot_id))[0] ?? null;
      if (selected) {
        fallbackUsed = true;
        reasonCodes.push('MINIMUM_REALITY_FALLBACK');
      }
    }
    if (!selected && request.allow_unbudgeted_fallback !== false) {
      selected = portfolio.slots.slice().sort((a, b) => a.quality_rank - b.quality_rank || keySort(a.slot_id, b.slot_id))[0] ?? null;
      if (selected) {
        fallbackUsed = true;
        reasonCodes.push('UNBUDGETED_FALLBACK');
      }
    }
    if (!selected) reasonCodes.push('NO_PORTFOLIO_SLOT_AVAILABLE');
    const body = selectionBody(portfolio, selected, request, {fallbackUsed, reasonCodes});
    return {...body, selection_root: rootHash(body), slot: selected ? clone(selected) : null};
  }

  async materializeSlot(input = {}, options = {}) {
    const selection = this.selectSlot(input);
    if (!selection.slot) {
      return {
        status: 'NOT_EXECUTED',
        failure: {code: 'URRF_PORTFOLIO_NO_SLOT_AVAILABLE'},
        selection_root: selection.selection_root,
        portfolio_root: selection.portfolio_root,
        candidate_only: true,
        canonical_write_authorized: false
      };
    }
    if (!this.fabric || typeof this.fabric.materialize !== 'function') {
      return {
        status: 'NOT_EXECUTED',
        failure: {code: 'URRF_PORTFOLIO_FABRIC_NOT_BOUND'},
        selection_root: selection.selection_root,
        portfolio_root: selection.portfolio_root,
        slot_root: selection.slot_root,
        candidate_only: true,
        canonical_write_authorized: false
      };
    }
    const portfolio = this.portfolios.get(selection.portfolio_id);
    const request = record(input);
    const receipt = await this.fabric.materialize({
      object_id: portfolio.object_id,
      representation_id: selection.slot.representation_id,
      resource_budget: request.resource_budget ?? request.resourceBudget,
      detail_vector: request.detail_vector ?? request.detailVector
    }, options);
    return {
      status: receipt.status,
      portfolio_root: selection.portfolio_root,
      slot_root: selection.slot_root,
      slot_id: selection.selected_slot_id,
      selection_root: selection.selection_root,
      receipt,
      candidate_only: true,
      canonical_write_authorized: false
    };
  }

  recordVisualEvidence(input = {}) {
    const value = record(input);
    const portfolioId = String(value.portfolio_id ?? value.portfolioId ?? '');
    const portfolio = this.portfolios.get(portfolioId);
    fail(portfolio, `URRF_PORTFOLIO_NOT_REGISTERED:${portfolioId}`);
    const slotId = String(value.slot_id ?? value.slotId ?? '');
    const slot = portfolio.slots.find(candidate => candidate.slot_id === slotId);
    fail(slot, `URRF_PORTFOLIO_SLOT_NOT_FOUND:${slotId}`);
    const evidence = normalizeVisualEvidence(value, portfolio, slot);
    fail(verifyVisualEvidence(evidence).valid, 'URRF_VISUAL_EVIDENCE_INVALID');
    const key = `${portfolioId}\u0000${slotId}`;
    const list = this.visualEvidence.get(key) ?? [];
    const existing = list.find(item => item.evidence_id === evidence.evidence_id);
    if (existing) fail(existing.evidence_root === evidence.evidence_root, 'URRF_VISUAL_EVIDENCE_ROOT_CONFLICT');
    else list.push(evidence);
    list.sort((a, b) => keySort(a.evidence_id, b.evidence_id));
    this.visualEvidence.set(key, list);
    return clone(evidence);
  }

  listVisualEvidence(portfolioId, slotId = null) {
    const prefix = slotId === null ? `${String(portfolioId)}\u0000` : `${String(portfolioId)}\u0000${String(slotId)}`;
    return [...this.visualEvidence.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .flatMap(([, values]) => values)
      .sort((a, b) => keySort(a.evidence_id, b.evidence_id))
      .map(clone);
  }

  snapshot() {
    const portfolios = this.listPortfolios().map(portfolio => ({
      portfolio_id: portfolio.portfolio_id,
      portfolio_root: portfolio.portfolio_root,
      object_id: portfolio.object_id,
      composition_status: portfolio.composition_result.composition_status,
      slot_count: portfolio.slots.length,
      slot_ids: portfolio.slots.map(slot => slot.slot_id),
      slot_roots: portfolio.slots.map(slot => slot.slot_root)
    }));
    const visual_evidence = [...this.visualEvidence.values()].flat().sort((a, b) => keySort(a.evidence_id, b.evidence_id)).map(evidence => ({
      evidence_id: evidence.evidence_id,
      evidence_root: evidence.evidence_root,
      portfolio_id: evidence.portfolio_id,
      slot_id: evidence.slot_id,
      status: evidence.status,
      quality_status: evidence.quality_status,
      pixel_root: evidence.pixel_root,
      frame_root: evidence.frame_root,
      environment_root: evidence.environment_root,
      animation_root: evidence.animation_root,
      width: evidence.width,
      height: evidence.height
    }));
    const base = {
      format: URRF_PORTFOLIO_RUNTIME_FORMAT,
      version: URRF_PORTFOLIO_RUNTIME_VERSION,
      portfolios,
      visual_evidence,
      candidate_only: true,
      authoritative: false,
      canonical_write_authorized: false
    };
    return {...base, runtime_root: rootHash(base)};
  }

  verify() {
    const snapshot = this.snapshot();
    return {
      valid: verifyPortfolioRuntimeSnapshot(snapshot) && this.listPortfolios().every(portfolio => verifyRepresentationPortfolio(portfolio).valid) && this.listVisualEvidenceAll().every(evidence => verifyVisualEvidence(evidence).valid),
      snapshot,
      candidate_only: true,
      canonical_write_authorized: false
    };
  }

  listVisualEvidenceAll() {
    return [...this.visualEvidence.values()].flat().map(clone).sort((a, b) => keySort(a.evidence_id, b.evidence_id));
  }
}

export function createRealityRepresentationPortfolioRuntime(options = {}) {
  return new RealityRepresentationPortfolioRuntime(options);
}
