import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {generateAssetWorkspace,inspectWorkspace} from './runtime.mjs';
import {builtinProviders,providerSummary} from './providers.mjs';
import {AssetProductionSession,ASSET_PRODUCTION_VERSION} from './production-session.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.wav':'audio/wav','.glb':'model/gltf-binary'};
const send=(res,code,value,type='application/json; charset=utf-8')=>{res.writeHead(code,{'content-type':type,'cache-control':'no-store','access-control-allow-origin':'*'});res.end(Buffer.isBuffer(value)||typeof value==='string'?value:JSON.stringify(value,null,2));};
const readBody=req=>new Promise((resolve,reject)=>{let value='';req.on('data',chunk=>{value+=chunk;if(value.length>20_000_000){reject(new Error('body too large'));req.destroy();}});req.on('end',()=>{try{resolve(value?JSON.parse(value):{})}catch(error){reject(error)}});});

export function startServer({port=4188,host='127.0.0.1',dataDir=path.join(root,'outputs','production-server')}={}){
  const sessions=new Map();fs.mkdirSync(dataDir,{recursive:true});
  const server=http.createServer(async(req,res)=>{
    try{
      const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
      if(req.method==='OPTIONS')return send(res,204,'','text/plain');
      if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{status:'healthy',version:ASSET_PRODUCTION_VERSION,production_sessions:true,multi_candidate:true,targeted_regeneration:true,strict_continuity:true});
      if(req.method==='GET'&&url.pathname==='/api/providers')return send(res,200,{format:'reality-asset.provider-catalog.v0.4',providers:builtinProviders().map(providerSummary)});
      if(req.method==='POST'&&url.pathname==='/api/generate'){
        const input=await readBody(req),id=Date.now().toString(36),out=path.join(dataDir,`workspace-${id}`),ws=generateAssetWorkspace(input,{outDir:out});
        return send(res,200,{ok:true,workspace_root:ws.workspace_root,preview:`/outputs/workspace-${id}/preview.html`,summary:inspectWorkspace(ws)});
      }
      if(req.method==='POST'&&url.pathname==='/api/production/new'){
        const input=await readBody(req),id=Date.now().toString(36),session=new AssetProductionSession(input.intent??input,{rootDir:path.resolve(input.out_dir??path.join(dataDir,`session-${id}`)),providers:input.providers??[]});sessions.set(session.session_id,session);return send(res,200,session.inspect());
      }
      if(req.method==='POST'&&url.pathname.startsWith('/api/production/')){
        const input=await readBody(req),session=sessions.get(input.session_id);if(!session)throw Object.assign(new Error(input.session_id??'missing'),{code:'PRODUCTION_SESSION_NOT_FOUND'});
        if(url.pathname==='/api/production/inspect')return send(res,200,session.inspect());
        if(url.pathname==='/api/production/generate')return send(res,200,session.generate({label:input.label??'api-generation'}));
        if(url.pathname==='/api/production/select')return send(res,200,session.select(input.candidate_id,{reason:input.reason??'api-selection'}));
        if(url.pathname==='/api/production/regenerate')return send(res,200,session.regenerate(input.patch??{},{label:input.label??'api-targeted-regeneration'}));
        if(url.pathname==='/api/production/accept')return send(res,200,session.accept({candidateId:input.candidate_id??session.selected_candidate_id,previewPath:input.preview_path??'preview.html',reason:input.reason??'api-acceptance'}));
        if(url.pathname==='/api/production/export')return send(res,200,session.exportArtifacts());
      }
      const rel=url.pathname==='/'?'web/index.html':decodeURIComponent(url.pathname.replace(/^\//,'')),file=path.resolve(root,rel);
      if(!file.startsWith(root))return send(res,403,'Forbidden','text/plain');
      if(!fs.existsSync(file)||fs.statSync(file).isDirectory())return send(res,404,'Not found','text/plain');
      res.writeHead(200,{'content-type':mime[path.extname(file)]??'application/octet-stream'});fs.createReadStream(file).pipe(res);
    }catch(error){send(res,400,{ok:false,error:{code:error.code??'ERROR',message:error.message}});}
  });
  server.listen(port,host,()=>{if(port!==0)console.log(`Reality Asset Genesis Workbench v0.4: http://${host}:${server.address().port}`)});
  server.sessions=sessions;return server;
}
