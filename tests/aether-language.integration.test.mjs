import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('Aether bridge',()=>{const r=spawnSync('npm',['test','--workspace','@taowind/aether-rncs-bridge'],{cwd:root,encoding:'utf8',shell:process.platform==='win32'});assert.equal(r.status,0,`${r.error?.message??''}\n${r.stdout??''}\n${r.stderr??''}`)});
