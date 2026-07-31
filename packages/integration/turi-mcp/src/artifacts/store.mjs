import fs from 'node:fs';
import path from 'node:path';
import { boundedText, randomId, safeFileStem, sha256 } from '../canonical.mjs';

export class ArtifactStore {
  constructor(dataDir, maxBytes = 20_000_000) {
    this.dir = path.resolve(dataDir, 'artifacts');
    this.maxBytes = maxBytes;
    fs.mkdirSync(this.dir, { recursive: true });
  }

  put(value, { mimeType = 'application/json', name = 'result.json' } = {}) {
    const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    const bytes = Buffer.byteLength(text, 'utf8');
    if (bytes > this.maxBytes) {
      const error = new Error(`Artifact exceeds ${this.maxBytes} bytes.`);
      error.code = 'ARTIFACT_TOO_LARGE';
      throw error;
    }
    const artifactId = randomId('artifact');
    const fileStem = safeFileStem(artifactId);
    const metadata = { artifactId, name, mimeType, sha256: sha256(text), size: bytes, createdAt: new Date().toISOString() };
    fs.writeFileSync(path.join(this.dir, `${fileStem}.data`), text, 'utf8');
    fs.writeFileSync(path.join(this.dir, `${fileStem}.json`), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
    return metadata;
  }

  metadata(artifactId) {
    if (typeof artifactId !== 'string' || !/^artifact:[0-9a-f-]+$/.test(artifactId)) return null;
    const file = path.join(this.dir, `${safeFileStem(artifactId)}.json`);
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  }

  read(artifactId, { maxBytes = this.maxBytes } = {}) {
    const metadata = this.metadata(artifactId);
    if (!metadata) return null;
    const file = path.join(this.dir, `${safeFileStem(artifactId)}.data`);
    if (!fs.existsSync(file)) return null;
    return { metadata, content: boundedText(fs.readFileSync(file, 'utf8'), maxBytes) };
  }
}
