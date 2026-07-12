import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { ExperienceFabricWorld, experienceSnapshotToCausalDelta, replayExperience, type ExperienceFabricConfig, type ExperienceSnapshot } from '../../experience-fabric/src/index.js';
import { renderExperienceAudio } from '../../experience-fabric-audio/src/index.js';
import { ExperienceFabricVSRBridge, createExperienceObserverProfile, experienceSnapshotToDocument } from '../../experience-fabric-vsr/src/index.js';

function saveJson(path: string, value: unknown): void { writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); }
function encodeVideo(framesDir: string, fps: number, wavPath: string, outPath: string): { ok: boolean; stderr: string } {
  const result = spawnSync('ffmpeg', ['-y', '-framerate', String(fps), '-i', join(framesDir, 'frame_%06d.png'), '-i', wavPath, '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', outPath], { encoding: 'utf8' });
  return { ok: result.status === 0 && existsSync(outPath), stderr: String(result.stderr ?? '').slice(-3000) };
}
function renderFinalViews(config: ExperienceFabricConfig, snapshot: ExperienceSnapshot, outDir: string): Record<string, unknown> {
  const bridge = new ExperienceFabricVSRBridge(config, { width: 480, height: 270, maxParticles: 100, title: 'RNCS ANIMATION / AUDIO / EFFECTS' });
  const result = bridge.render(snapshot, [createExperienceObserverProfile('player'), createExperienceObserverProfile('debugger'), createExperienceObserverProfile('accessibility')]);
  const hashes: Record<string, string> = {};
  for (const view of result.views) { const kind = view.observer.observerId.split(':').at(-1)!; writeFileSync(join(outDir, `final-${kind}.png`), view.png); hashes[kind] = view.pngHash; }
  return { hashes, verification: result.verification, invariantHash: result.invariantHash, sourceDocumentHash: result.sourceDocumentHash };
}
function run(outDir: string): void {
  mkdirSync(outDir, { recursive: true }); const framesDir = join(outDir, 'frames'); mkdirSync(framesDir, { recursive: true });
  const config = JSON.parse(readFileSync('examples/experience-fabric/cinematic-showcase.experience.json', 'utf8')) as ExperienceFabricConfig;
  const world = new ExperienceFabricWorld(config); const bridge = new ExperienceFabricVSRBridge(config, { width: 480, height: 270, maxParticles: 100, title: 'RNCS TEMPORAL EXPERIENCE FABRIC' });
  const initial = world.snapshot(); let checkpoint = initial; let final = initial;
  let frameIndex = 0; const renderStart = performance.now(); const frameStride = 4;
  for (let i = 0; i < (config.durationTicks ?? 120); i++) {
    final = world.step(); if (final.tick === Math.floor((config.durationTicks ?? 120) / 2)) checkpoint = final;
    if (i % frameStride === 0) { const rendered = bridge.render(final, [createExperienceObserverProfile('player')]); writeFileSync(join(framesDir, `frame_${String(frameIndex++).padStart(6, '0')}.png`), rendered.views[0]!.png); }
  }
  const frameRenderElapsedMs = performance.now() - renderStart;
  const replay = replayExperience(config, config.durationTicks ?? 120); const restored = ExperienceFabricWorld.fromSnapshot(config, checkpoint); restored.run((config.durationTicks ?? 120) - checkpoint.tick); const recovered = restored.snapshot();
  const audio = renderExperienceAudio(config, final, { durationSeconds: (config.durationTicks ?? 120) / config.tickHz, sampleRate: 48_000, normalize: true }); const wavPath = join(outDir, 'experience-audio.wav'); writeFileSync(wavPath, audio.wav);
  const videoPath = join(outDir, 'experience-showcase.mp4'); const video = encodeVideo(framesDir, config.tickHz / 4, wavPath, videoPath);
  const finalViews = renderFinalViews(config, final, outDir); const delta = experienceSnapshotToCausalDelta(final, 'rfe:experience-showcase:base');
  saveJson(join(outDir, 'experience-config.json'), config); saveJson(join(outDir, 'initial-snapshot.json'), initial); saveJson(join(outDir, 'checkpoint-snapshot.json'), checkpoint); saveJson(join(outDir, 'final-snapshot.json'), final); saveJson(join(outDir, 'causal-delta.json'), delta); saveJson(join(outDir, 'final-render-document.vsr.json'), experienceSnapshotToDocument(config, final, { width: 480, height: 270, maxParticles: 100 }));
  const evidence = {
    format: 'rsr.experience-fabric-demo-evidence.v0.4', runtimeVersion: final.runtimeVersion, experienceId: final.experienceId,
    deterministicReplay: final.stateRoot === replay.stateRoot, deterministicRecovery: final.stateRoot === recovered.stateRoot,
    initialStateRoot: initial.stateRoot, checkpointStateRoot: checkpoint.stateRoot, finalStateRoot: final.stateRoot, replayStateRoot: replay.stateRoot, recoveredStateRoot: recovered.stateRoot,
    animationRoot: final.animationRoot, skeletonRoot: final.skeletonRoot, audioPlanRoot: final.audioPlanRoot, effectRoot: final.effectRoot, eventRoot: final.eventRoot, causalDeltaRoot: delta.deltaRoot,
    counts: { events: final.events.length, audioCueEvents: final.audioEvents.length, particlesAtFinal: final.particles.length, activeEffectsAtFinal: final.effectInstances.length, frames: Math.ceil((config.durationTicks ?? 120) / 4) },
    audio: { wavHash: audio.wavHash, bytes: audio.wav.length, diagnostics: audio.diagnostics }, video: { encoded: video.ok, path: videoPath, stderrTail: video.ok ? '' : video.stderr, frameRenderElapsedMs, averageMsPerFrame: frameRenderElapsedMs / Math.max(1, frameIndex), frameCount: frameIndex }, finalViews
  };
  saveJson(join(outDir, 'demo-evidence.json'), evidence);
  console.log(JSON.stringify({ outDir, deterministicReplay: evidence.deterministicReplay, deterministicRecovery: evidence.deterministicRecovery, finalStateRoot: final.stateRoot, roots: { animation: final.animationRoot, audio: final.audioPlanRoot, effects: final.effectRoot }, counts: evidence.counts, audio: audio.diagnostics, videoEncoded: video.ok }, null, 2));
}
const mode = process.argv[2] ?? 'demo'; const outDir = resolve(process.argv[3] ?? 'outputs/experience-fabric-demo'); if (mode !== 'demo' && mode !== 'verify') throw new Error(`未知模式：${mode}`); run(outDir);
if (mode === 'verify') { const evidence = JSON.parse(readFileSync(join(outDir, 'demo-evidence.json'), 'utf8')) as { deterministicReplay: boolean; deterministicRecovery: boolean; video: { encoded: boolean }; audio: { bytes: number }; finalViews: { verification: { ok: boolean } } }; if (!evidence.deterministicReplay || !evidence.deterministicRecovery || !evidence.video.encoded || evidence.audio.bytes <= 44 || evidence.finalViews.verification.ok !== true) process.exitCode = 1; }
