import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {CharacterGenomeSessionRegistry} from '../src/character-genome-studio.mjs';
import {AnimeForgeSessionRegistry} from '../src/anime-forge-studio.mjs';

const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'reality-studio-character-'));
const characterSource=fs.readFileSync(new URL('../../../packages/integration/rcl-character-genome-bridge/examples/lan-tianlin.character.rcl',import.meta.url),'utf8');
const animeSource=fs.readFileSync(new URL('../../../packages/integration/rcl-anime-production-bridge/examples/shenlinzhe-yanlv.rcl',import.meta.url),'utf8');
const registry=new CharacterGenomeSessionRegistry({dataDir,sampleSource:characterSource});
let session;

test.before(()=>{session=registry.create()});

test('Character Genome Studio exposes generated mesh, runtime roots and complete controls',()=>{const value=session.inspect();assert.ok(value.preview_mesh.positions.length>1000);assert.ok(value.preview_mesh.indices.length>1000);assert.equal(value.preview_mesh.regions.length,value.preview_mesh.parts.length);assert.ok(value.preview_mesh.regions.includes('hands'));assert.ok(value.preview_assets.anime.startsWith('data:image/png;base64,'));assert.equal(value.quality.valid,true);assert.equal(value.counts.identity_morphs,28);assert.equal(value.counts.expressions,8);assert.equal(value.counts.visemes,14);assert.ok(value.provider.receipt_root);assert.ok(value.evidence.ledger_root)});

test('Studio recolor, snapshot, compare and rollback preserve identity and geometry modules',()=>{const before=session.inspect(),snapshot=session.snapshot('baseline'),changed=session.patch('appearance_loadout.hair_color','#2b3956');assert.equal(changed.identity_root,before.identity_root);assert.equal(changed.impact.scope,'hair-material');assert.ok(changed.impact.rebuild_receipt.preserved_artifacts.includes('body.glb'));assert.equal(session.compare(snapshot.snapshot_id).pass,true);const restored=session.rollback(snapshot.snapshot_id);assert.equal(restored.asset_root,before.asset_root);assert.equal(restored.identity_signature_root,before.identity_signature_root)});

test('random candidate, undo and parameter locks are backed by the Genome runtime',()=>{const before=session.inspect(),locked=session.setLock('face.eye_spacing',true);assert.ok(locked.locked.includes('face.eye_spacing'));const randomized=session.randomize();assert.equal(randomized.parameters['face.eye_spacing'].value,before.parameters['face.eye_spacing'].value);assert.notEqual(randomized.genome_root,before.genome_root);const undone=session.undo();assert.equal(undone.genome_root,before.genome_root);assert.equal(undone.identity_root,before.identity_root)});

test('Studio sends the same character family into the Anime Forge Cut',()=>{const animeRegistry=new AnimeForgeSessionRegistry({dataDir}),anime=animeRegistry.create(animeSource),binding=anime.bindCharacter(session.animeBinding());assert.equal(binding.character_id,session.genome.character_id);assert.equal(binding.identity_root,session.genome.identity_root);const actor=anime.production.cut.character_layers[0].actor_id,asset=anime.production.asset_bindings.character[actor];assert.equal(asset.family_root,session.family().family_root);assert.equal(asset.authority.identity_mutation,'forbidden')});
