import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {commitCharacterAsset,compileCharacterGenomeSource,compileCharacterSourceToAssets,parseCharacterGenomeSource,tryCompileCharacterGenomeSource} from '../src/index.mjs';

const source=fs.readFileSync(new URL('../examples/lan-tianlin.character.rcl',import.meta.url),'utf8');
const temp=name=>fs.mkdtempSync(path.join(os.tmpdir(),`rcl-character-${name}-`));

test('RCL character source parses with source locations',()=>{const ast=parseCharacterGenomeSource(source);assert.equal(ast.name,'蓝天临');assert.equal(ast.topology_family,'young-male-slim');assert.equal(ast.identity.jaw_definition,.62);assert.equal(ast.appearance.hair,'black-wavy-medium');assert.equal(ast.continuity.lock[0],'identity');assert.ok(ast.sourceMap['identity.jaw_definition'].line>0)});
test('RCL bridge emits schema-valid Genome, RAGF request and real bytecode',()=>{const result=compileCharacterGenomeSource(source);assert.equal(result.genome.identity_genome.name,'蓝天临');assert.equal(result.genome.identity_genome.identity_parameters['face.jaw_definition'],.62);assert.equal(result.genome.morphology_genome.body_parameters['body.head_body_ratio'],.58);assert.equal(result.ragf_request.provider_id,'ragf.character-genome-reference-provider');assert.ok(result.bytecode.length>16);assert.ok(result.shadow_program_root);assert.equal(result.compiler.provider_commit_authority,false)});
test('compile invokes the offline provider and commit remains explicit',()=>{const workspace=temp('workspace'),built=compileCharacterSourceToAssets(source,{outDir:workspace});assert.equal(built.generated.validation.valid,true);assert.equal(JSON.parse(fs.readFileSync(path.join(workspace,'family.json'),'utf8')).identity_root,built.compiled.genome.identity_root);assert.throws(()=>commitCharacterAsset({workspaceDir:workspace,libraryDir:temp('library')}),/CHARACTER_COMMIT_APPROVAL_REQUIRED/);const receipt=commitCharacterAsset({workspaceDir:workspace,libraryDir:temp('approved'),approved:true});assert.equal(receipt.status,'committed');assert.equal(receipt.authority,'RNCS Character Genome Authority')});
test('syntax and constraint failures carry diagnostics and locations',()=>{const syntax=tryCompileCharacterGenomeSource('character Broken { identity { jaw_definition } }');assert.equal(syntax.ok,false);assert.ok(syntax.diagnostics[0].location.line>0);const unsafe=tryCompileCharacterGenomeSource(source.replace('eye_spacing 0.48','eye_spacing 0.99'));assert.equal(unsafe.ok,false);assert.equal(unsafe.diagnostics[0].code,'CHARACTER_CONSTRAINTS_INVALID')});
