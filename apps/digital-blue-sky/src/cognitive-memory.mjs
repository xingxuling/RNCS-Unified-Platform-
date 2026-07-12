import fs from 'node:fs';
import path from 'node:path';
import { hash } from './canonical.mjs';

function read(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, file);
}

function terms(value) {
  return [...new Set(String(value || '').toLowerCase().match(/[a-z0-9_-]{3,}|[\u4e00-\u9fff]{2,}/g) || [])];
}

export class CognitiveMemory {
  constructor({ stateDir, maxMessages = 240, maxFacts = 160 } = {}) {
    this.file = path.join(path.resolve(stateDir || 'state'), 'cognitive', 'memory.json');
    this.maxMessages = maxMessages;
    this.maxFacts = maxFacts;
    this.state = {
      format: 'dml.cognitive-memory.v0.5',
      messages: [],
      facts: [],
      summaries: [],
      updated_at: null,
      ...read(this.file, {}),
    };
  }

  save() {
    this.state.updated_at = new Date().toISOString();
    this.state.memory_root = hash({ messages: this.state.messages, facts: this.state.facts, summaries: this.state.summaries });
    write(this.file, this.state);
  }

  addMessage({ role, content, project_id = null, task_id = null, metadata = {} }) {
    const item = {
      message_id: `memory:${Date.now()}:${Math.random().toString(16).slice(2)}`,
      role,
      content: String(content || ''),
      project_id,
      task_id,
      metadata,
      created_at: new Date().toISOString(),
    };
    this.state.messages.push(item);
    this.state.messages = this.state.messages.slice(-this.maxMessages);
    this.save();
    return item;
  }

  rememberFact({ text, project_id = null, source = 'conversation', confidence = 0.7 }) {
    const normalized = String(text || '').trim();
    if (!normalized) return null;
    const root = hash({ text: normalized, project_id });
    const existing = this.state.facts.find((fact) => fact.fact_root === root);
    if (existing) {
      existing.last_seen_at = new Date().toISOString();
      existing.confidence = Math.max(existing.confidence || 0, confidence);
      this.save();
      return existing;
    }
    const fact = {
      fact_id: `fact:${root.slice(0, 24)}`,
      fact_root: root,
      text: normalized,
      project_id,
      source,
      confidence,
      created_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    };
    this.state.facts.push(fact);
    this.state.facts = this.state.facts.slice(-this.maxFacts);
    this.save();
    return fact;
  }

  recentMessages({ project_id = null, limit = 18 } = {}) {
    return this.state.messages
      .filter((message) => !project_id || !message.project_id || message.project_id === project_id)
      .slice(-limit);
  }

  recall(query, { project_id = null, limit = 8 } = {}) {
    const wanted = terms(query);
    const candidates = [
      ...this.state.facts.map((item) => ({ kind: 'fact', text: item.text, project_id: item.project_id, created_at: item.created_at, raw: item })),
      ...this.state.messages.map((item) => ({ kind: 'message', text: item.content, project_id: item.project_id, created_at: item.created_at, raw: item })),
    ];
    return candidates
      .filter((item) => !project_id || !item.project_id || item.project_id === project_id)
      .map((item) => {
        const contentTerms = terms(item.text);
        const score = wanted.reduce((sum, term) => sum + (contentTerms.includes(term) ? 3 : contentTerms.some((candidate) => candidate.includes(term) || term.includes(candidate)) ? 1 : 0), 0);
        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, limit);
  }

  publicState() {
    return {
      format: this.state.format,
      message_count: this.state.messages.length,
      fact_count: this.state.facts.length,
      summary_count: this.state.summaries.length,
      updated_at: this.state.updated_at,
      memory_root: this.state.memory_root || null,
    };
  }
}
