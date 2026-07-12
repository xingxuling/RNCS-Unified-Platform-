#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {RealityNetworkRuntime,createTwoPlayerWorldConfig} from '@taowind/reality-network-runtime';

const here=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT??8787),sessionId='session:two-player-loopback';
const runtime=new RealityNetworkRuntime();
await runtime.createSession({sessionId,worldConfig:createTwoPlayerWorldConfig({worldId:'world:two-player-loopback'}),network:{seed:20260703}});
await runtime.joinSession({sessionId,subjectId:'subject:blue',playerId:'blue',characterId:'character:blue',bodyId:'player-blue'});
await runtime.joinSession({sessionId,subjectId:'subject:red',playerId:'red',characterId:'character:red',bodyId:'player-red'});
let running=true;
const timer=setInterval(()=>{if(running){try{runtime.advanceServerTick({sessionId});}catch{}}},1000/60);timer.unref();

const json=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));};
const body=async req=>{let text='';for await(const chunk of req)text+=chunk;return text?JSON.parse(text):{};};
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,`http://${req.headers.host}`);
    if(req.method==='GET'&&url.pathname==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});return res.end(fs.readFileSync(path.join(here,'index.html')));}
    if(req.method==='GET'&&url.pathname==='/state'){
      const ctx=runtime.require(sessionId),snap=ctx.server.lastSnapshot,health=runtime.getSessionHealth({sessionId});
      return json(res,200,{health,bodies:snap.bodies.map(b=>({id:b.id,kind:b.kind,position:b.position,rotation:b.rotationDeg,velocity:b.velocity,tags:b.tags??[]})),contacts:snap.contacts,events:snap.events,running});
    }
    if(req.method==='POST'&&url.pathname==='/input'){const data=await body(req);const input=runtime.submitInput({sessionId,playerId:data.playerId,command:data.command});return json(res,200,{ok:true,inputSequence:input.inputSequence});}
    if(req.method==='POST'&&url.pathname==='/conditions'){const data=await body(req);return json(res,200,runtime.setNetworkConditions({sessionId,...data}));}
    if(req.method==='POST'&&url.pathname==='/disconnect'){const data=await body(req);return json(res,200,runtime.disconnect({sessionId,playerId:data.playerId}));}
    if(req.method==='POST'&&url.pathname==='/reconnect'){const data=await body(req);return json(res,200,runtime.reconnect({sessionId,playerId:data.playerId}));}
    if(req.method==='POST'&&url.pathname==='/pause'){running=!running;return json(res,200,{running});}
    json(res,404,{error:'not-found'});
  }catch(error){json(res,500,{error:error.code??error.name,message:error.message});}
});
server.listen(port,'127.0.0.1',()=>console.log(`Reality Network Runtime 双人Loopback: http://127.0.0.1:${port}`));
process.on('SIGINT',()=>{clearInterval(timer);server.close(()=>process.exit(0));});
