import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {KnowledgeIndex} from '../src/knowledge-index.mjs';
test('knowledge index searches docs and excludes secret-like files and source files',()=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'taowind-knowledge-'));fs.mkdirSync(path.join(root,'docs'),{recursive:true});fs.writeFileSync(path.join(root,'docs','RNCS.md'),'# Reality One Gateway\n候选现实与权威状态分离。\n');fs.writeFileSync(path.join(root,'docs','api-token-secret.md'),'do not index');fs.mkdirSync(path.join(root,'src'));fs.writeFileSync(path.join(root,'src','private.mjs'),'export const secret=1;');const index=new KnowledgeIndex({repoRoot:root});const stats=index.build();assert.equal(stats.document_count,1);assert.equal(stats.persistent_document_count,1);assert.equal(stats.ephemeral_document_count,0);const results=index.search('候选现实');assert.equal(results.length,1);assert.equal(results[0].metadata.namespace,'repository');assert.equal(results[0].metadata.persistent,true);const fetched=index.fetch(results[0].id);assert.match(fetched.text,/权威状态/);assert.throws(()=>index.fetch('../etc/passwd'),/not found/i);});

test('knowledge index ingests an external source packet into an explicit ephemeral namespace',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'taowind-source-packet-'));
 const index=new KnowledgeIndex({repoRoot:root});
 index.build();
 const receipt=index.ingestSourcePacket({packet_id:'ue5-8-research',namespace:'ue5-8-official-research',sources:[{id:'mass',title:'Mass Entity Notes',text:'UE5 Mass Entity separates fragments, archetypes, chunks, and processors.',uri:'https://dev.epicgames.com/documentation/en-us/unreal-engine/mass-entity-in-unreal-engine'}]});
 assert.equal(receipt.format,'rncs.ephemeral-source-packet.v0.1');
 assert.equal(receipt.document_count,1);
 assert.equal(index.stats().ephemeral_document_count,1);
 const sourceOnly=index.search('Mass Entity',{sourceOnly:true,namespace:'ue5-8-official-research'});
 assert.equal(sourceOnly.length,1);
 assert.equal(sourceOnly[0].metadata.persistent,false);
 assert.equal(sourceOnly[0].metadata.evidence_role,'external-research');
 assert.equal(index.search('Mass Entity',{persistentOnly:true}).length,0);
 const fetched=index.fetch(sourceOnly[0].id);
 assert.equal(fetched.metadata.packet_id,'ue5-8-research');
 assert.equal(fetched.metadata.source_uri,'https://dev.epicgames.com/documentation/en-us/unreal-engine/mass-entity-in-unreal-engine');
 assert.equal(index.dropSourcePacket('ue5-8-research').removed_count,1);
 assert.equal(index.search('Mass Entity',{sourceOnly:true}).length,0);
});
