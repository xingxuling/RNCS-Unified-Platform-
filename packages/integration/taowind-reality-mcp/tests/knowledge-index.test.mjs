import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {KnowledgeIndex} from '../src/knowledge-index.mjs';
test('knowledge index searches docs and excludes secret-like files and source files',()=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'taowind-knowledge-'));fs.mkdirSync(path.join(root,'docs'),{recursive:true});fs.writeFileSync(path.join(root,'docs','RNCS.md'),'# Reality One Gateway\n候选现实与权威状态分离。\n');fs.writeFileSync(path.join(root,'docs','api-token-secret.md'),'do not index');fs.mkdirSync(path.join(root,'src'));fs.writeFileSync(path.join(root,'src','private.mjs'),'export const secret=1;');const index=new KnowledgeIndex({repoRoot:root});const stats=index.build();assert.equal(stats.document_count,1);const results=index.search('候选现实');assert.equal(results.length,1);const fetched=index.fetch(results[0].id);assert.match(fetched.text,/权威状态/);assert.throws(()=>index.fetch('../etc/passwd'),/not found/i);});
