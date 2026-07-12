import fs from 'node:fs';
import path from 'node:path';
import { atomicWriteJson, clone, DMLError } from './canonical.mjs';
import { normalizeWorkEvent, validateWorkEvent } from './contracts.mjs';

export class EventStore {
  constructor(root = 'state') {
    this.root = path.resolve(root);
    this.eventsFile = path.join(this.root, 'events.ndjson');
    this.projectionFile = path.join(this.root, 'projection.json');
    fs.mkdirSync(this.root, { recursive: true });
  }

  reset() {
    fs.rmSync(this.root, { recursive: true, force: true });
    fs.mkdirSync(this.root, { recursive: true });
  }

  readEvents() {
    if (!fs.existsSync(this.eventsFile)) return [];
    return fs.readFileSync(this.eventsFile, 'utf8').split(/\r?\n/).filter(Boolean).map((line, index) => {
      let event;
      try { event = JSON.parse(line); } catch (error) { throw new DMLError('EVENT_JOURNAL_PARSE_FAILED', `line ${index + 1}: ${error.message}`); }
      const result = validateWorkEvent(event);
      if (!result.valid) throw new DMLError('EVENT_JOURNAL_TAMPERED', `EVENT_JOURNAL_TAMPERED line ${index + 1}: ${result.errors.join(', ')}`);
      return event;
    });
  }

  append(raw) {
    const sequence = this.readEvents().length + 1;
    const event = normalizeWorkEvent({ ...clone(raw), sequence });
    fs.appendFileSync(this.eventsFile, `${JSON.stringify(event)}\n`, 'utf8');
    return event;
  }

  appendMany(rawEvents) {
    return rawEvents.map((event) => this.append(event));
  }

  saveProjection(projection) {
    atomicWriteJson(fs, this.projectionFile, projection);
    return projection;
  }

  readProjection() {
    return fs.existsSync(this.projectionFile) ? JSON.parse(fs.readFileSync(this.projectionFile, 'utf8')) : null;
  }
}
