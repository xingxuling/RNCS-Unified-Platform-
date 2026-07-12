import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {loadConfig} from '../src/config.mjs';
const root=path.resolve(import.meta.dirname,'../../..');

test('default private profile is founder authority with state preconditions',()=>{
 const c=loadConfig({}, {repoRoot:root});
 assert.equal(c.authorityMode,'founder');
 assert.equal(c.authorityWritesEnabled,true);
 assert.equal(c.candidateWritesEnabled,true);
 assert.equal(c.requireStatePreconditions,true);
 assert.deepEqual(c.founderApprovalRoles,['owner','security']);
});

test('public no-auth binding requires explicit protection',()=>{
 assert.throws(()=>loadConfig({}, {repoRoot:root,host:'0.0.0.0',port:0,allowedOrigins:[],allowedHosts:['localhost']}),/path token|ALLOW_PUBLIC_NO_AUTH/);
});

test('public founder path token requires at least 32 characters',()=>{
 assert.throws(()=>loadConfig({}, {repoRoot:root,host:'0.0.0.0',port:0,pathToken:'abcdefghijklmnopqrstuvwx',allowedOrigins:[],allowedHosts:['localhost']}),/at least 32/);
});

test('public path token creates an opaque founder MCP endpoint',()=>{
 const c=loadConfig({}, {repoRoot:root,host:'0.0.0.0',port:0,pathToken:'abcdefghijklmnopqrstuvwxyz123456',allowedOrigins:[],allowedHosts:['localhost']});
 assert.equal(c.mcpPath,'/mcp/abcdefghijklmnopqrstuvwxyz123456');
 assert.equal(c.authMode,'none');
 assert.equal(c.authorityWritesEnabled,true);
});

test('bearer mode rejects weak tokens',()=>{
 assert.throws(()=>loadConfig({}, {repoRoot:root,authMode:'bearer',bearerToken:'short'}),/at least 24/);
});

test('authority profile can be downgraded',()=>{
 const candidate=loadConfig({}, {repoRoot:root,authorityMode:'candidate'});
 assert.equal(candidate.candidateWritesEnabled,true);
 assert.equal(candidate.authorityWritesEnabled,false);
 const read=loadConfig({}, {repoRoot:root,authorityMode:'read'});
 assert.equal(read.candidateWritesEnabled,false);
 assert.equal(read.authorityWritesEnabled,false);
});

test('public binding requires host allow-list',()=>{
 assert.throws(()=>loadConfig({}, {repoRoot:root,host:'0.0.0.0',port:0,pathToken:'abcdefghijklmnopqrstuvwxyz123456',allowedOrigins:[]}),/ALLOWED_HOSTS|platform hostname/);
});


test('Vercel host and production URL are discovered automatically',()=>{
 const c=loadConfig({VERCEL_URL:'preview.example.vercel.app',VERCEL_PROJECT_PRODUCTION_URL:'mcp.example.com'}, {repoRoot:root,host:'0.0.0.0',pathToken:'abcdefghijklmnopqrstuvwxyz123456'});
 assert.ok(c.allowedHosts.includes('preview.example.vercel.app'));
 assert.ok(c.allowedHosts.includes('mcp.example.com'));
 assert.equal(c.publicBaseUrl,'https://mcp.example.com');
});
