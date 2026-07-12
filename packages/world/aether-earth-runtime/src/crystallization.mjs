import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { compileRealityToBytecode, decodeBytecode, runNativeBytecode } from '@taowind/reality-computation-language';

function sanitizeIdentifier(value) {
  return String(value).replace(/[^a-zA-Z0-9_]/g, '_').replace(/^([0-9])/, '_$1').slice(0, 80);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function selectCrystalCandidate(observationLedger) {
  const candidates = [...observationLedger.values()]
    .filter(item => item.count >= 12)
    .map(item => ({
      ...item,
      averageReward: item.reward / item.count,
      score: item.count * Math.max(0.05, item.reward / item.count + 0.35),
    }))
    .sort((a, b) => b.score - a.score || b.count - a.count);
  return candidates[0] ?? null;
}

export function buildCrystalSource(candidate, epoch) {
  const confidence = Math.max(0.5, Math.min(0.999, 0.55 + Math.log10(candidate.count + 1) * 0.17));
  const crystalId = `crystal-${epoch}-${sanitizeIdentifier(candidate.climate)}-${sanitizeIdentifier(candidate.action)}`;
  const strategy = candidate.action === 'forage'
    ? `prefer_${candidate.climate}_biomass`
    : `investigate_${candidate.climate}_conditions`;
  const source = `reality CollectiveCrystal_${epoch} {
  facet crystal.id : Text = "${crystalId}"
  facet crystal.strategy : Text = "${strategy}"
  facet crystal.climate : Text = "${candidate.climate}"
  facet crystal.action : Text = "${candidate.action}"
  facet crystal.support : Number = ${candidate.count}
  facet crystal.average_reward : Number = ${Number(candidate.averageReward.toFixed(6))}
  facet crystal.confidence : Number = ${Number(confidence.toFixed(6))}
  facet crystal.candidate : Truth = true
}
`;
  return { crystalId, strategy, confidence, source };
}

export function crystallizeCollective({ observationLedger, epoch, artifactDir = null }) {
  const candidate = selectCrystalCandidate(observationLedger);
  if (!candidate) return null;
  const generated = buildCrystalSource(candidate, epoch);
  const bytecode = compileRealityToBytecode(generated.source);
  const decoded = decodeBytecode(bytecode);
  const execution = runNativeBytecode(bytecode);
  const crystal = {
    format: 'aether-earth.collective-crystal.v0.1',
    epoch,
    id: generated.crystalId,
    strategy: generated.strategy,
    source: generated.source,
    sourceHash: sha256(generated.source),
    bytecodeHash: sha256(bytecode),
    byteLength: bytecode.length,
    instructionCount: decoded.instructions.length,
    support: candidate.count,
    averageReward: Number(candidate.averageReward.toFixed(6)),
    confidence: Number(generated.confidence.toFixed(6)),
    status: 'candidate-verified-in-isolated-native-vm',
    nativeState: execution.state,
    promoted: false,
  };
  if (artifactDir) {
    fs.mkdirSync(artifactDir, { recursive: true });
    fs.writeFileSync(path.join(artifactDir, `${crystal.id}.rcl`), crystal.source);
    fs.writeFileSync(path.join(artifactDir, `${crystal.id}.rbc`), bytecode);
    fs.writeFileSync(path.join(artifactDir, `${crystal.id}.json`), `${JSON.stringify(crystal, null, 2)}\n`);
  }
  return crystal;
}
