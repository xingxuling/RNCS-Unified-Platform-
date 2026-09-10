import {clone} from './protocol.mjs';
import {ClientPredictionRuntime} from './client.mjs';

function requireText(value, code) {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

function normalizeTicks(value) {
  const ticks = Number(value ?? 1);
  if (!Number.isSafeInteger(ticks) || ticks < 1) throw new Error('HTTP_AUTHORITY_TICKS_INVALID');
  return Math.min(120, ticks);
}

export class HttpAuthorityClient {
  constructor({baseUrl, fetchImpl = globalThis.fetch} = {}) {
    this.baseUrl = requireText(baseUrl, 'HTTP_AUTHORITY_BASE_URL_REQUIRED').replace(/\/+$/, '');
    if (typeof fetchImpl !== 'function') throw new Error('HTTP_AUTHORITY_FETCH_UNAVAILABLE');
    this.fetchImpl = fetchImpl;
    this.player = null;
    this.delegation = null;
    this.prediction = null;
    this.lastServerStateRoot = null;
    this.transportTick = 0;
  }

  async request(pathname, {method = 'GET', body} = {}) {
    const response = await this.fetchImpl(new URL(pathname, `${this.baseUrl}/`).toString(), {
      method,
      headers: body === undefined ? undefined : {'content-type': 'application/json'},
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      const failure = new Error(`HTTP_AUTHORITY_RESPONSE_INVALID:${error.message}`);
      failure.status = response.status;
      throw failure;
    }
    if (!response.ok) {
      const failure = new Error(payload?.message ?? payload?.error ?? `HTTP_AUTHORITY_REQUEST_FAILED:${response.status}`);
      failure.code = payload?.error ?? 'HTTP_AUTHORITY_REQUEST_FAILED';
      failure.status = response.status;
      failure.payload = payload;
      throw failure;
    }
    return payload;
  }

  requirePrediction() {
    if (!this.prediction) throw new Error('HTTP_AUTHORITY_CLIENT_NOT_JOINED');
    return this.prediction;
  }

  async join({slotId, subjectId} = {}) {
    const joined = await this.request('/network/authority/join', {
      method: 'POST',
      body: {slot_id: requireText(slotId, 'HTTP_AUTHORITY_SLOT_ID_REQUIRED'), ...(subjectId === undefined ? {} : {subject_id: requireText(subjectId, 'HTTP_AUTHORITY_SUBJECT_ID_REQUIRED')})}
    });
    const player = joined.player ?? {
      sessionId: joined.delegation?.constraints?.session_id,
      subjectId: joined.delegation?.delegate_id,
      playerId: joined.playerId,
      characterId: joined.delegation?.constraints?.character_id,
      bodyId: joined.bodyId
    };
    for (const [key, code] of [['sessionId', 'HTTP_AUTHORITY_SESSION_ID_MISSING'], ['subjectId', 'HTTP_AUTHORITY_SUBJECT_ID_MISSING'], ['playerId', 'HTTP_AUTHORITY_PLAYER_ID_MISSING'], ['characterId', 'HTTP_AUTHORITY_CHARACTER_ID_MISSING'], ['bodyId', 'HTTP_AUTHORITY_BODY_ID_MISSING']]) requireText(player[key], code);
    if (!joined.delegation || !joined.snapshot) throw new Error('HTTP_AUTHORITY_JOIN_PAYLOAD_INVALID');
    this.player = clone(player);
    this.delegation = clone(joined.delegation);
    this.prediction = await ClientPredictionRuntime.create({player: this.player, delegation: this.delegation, initialSnapshot: joined.snapshot});
    this.lastServerStateRoot = joined.snapshot.stateRoot;
    this.transportTick = joined.snapshot.tick;
    return clone(joined);
  }

  async submitInput(command, options = {}) {
    const prediction = this.requirePrediction();
    const input = prediction.createInput(command, options);
    const result = await this.request('/network/authority/input', {method: 'POST', body: {input}});
    this.transportTick += 1;
    prediction.markSent(input.inputSequence, this.transportTick);
    if (result.accepted === false && result.rejection) prediction.receiveRejection(result.rejection);
    return {...clone(result), input: clone(input)};
  }

  async tick(ticks = 1) {
    const prediction = this.requirePrediction();
    const result = await this.request('/network/authority/tick', {method: 'POST', body: {ticks: normalizeTicks(ticks)}});
    this.transportTick = Math.max(this.transportTick, Number(result.tick) || this.transportTick);
    this.lastServerStateRoot = result.snapshot?.stateRoot ?? this.lastServerStateRoot;
    const matchingAcks = (result.acks ?? []).filter(ack => ack.playerId === this.player.playerId);
    const reconciliations = matchingAcks.map(ack => prediction.receiveAck(ack, result.snapshot));
    if (!matchingAcks.length && result.delta) reconciliations.push(prediction.receiveDelta(result.delta));
    return {...clone(result), reconciliation: reconciliations.at(-1) ?? null};
  }

  async health() {
    const health = await this.request('/network/authority/health');
    this.lastServerStateRoot = health.server?.stateRoot ?? this.lastServerStateRoot;
    return health;
  }

  async snapshot() {
    const packet = await this.request('/network/authority/snapshot');
    const correction = this.prediction?.reconcile(packet) ?? null;
    this.lastServerStateRoot = packet.stateRoot ?? this.lastServerStateRoot;
    this.transportTick = Math.max(this.transportTick, Number(packet.tick) || this.transportTick);
    return {packet: clone(packet), correction};
  }

  async delta() {
    const packet = await this.request('/network/authority/delta');
    const applied = this.prediction?.receiveDelta(packet) ?? null;
    this.lastServerStateRoot = packet.stateRoot ?? this.lastServerStateRoot;
    this.transportTick = Math.max(this.transportTick, Number(packet.tick) || this.transportTick);
    return {packet: clone(packet), applied};
  }

  metrics() {
    return this.requirePrediction().metrics(this.lastServerStateRoot ?? '');
  }
}
