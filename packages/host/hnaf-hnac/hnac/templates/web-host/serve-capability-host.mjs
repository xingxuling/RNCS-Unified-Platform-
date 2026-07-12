#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 8080);
const gateway = new URL(process.env.REALITY_ONE_GATEWAY ?? 'http://127.0.0.1:17303');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.hnac':'application/zip'};
const send = (res, code, body, type='text/plain; charset=utf-8') => { res.writeHead(code, {'content-type':type,'cache-control':'no-store'}); res.end(body); };
const proxy = (req,res,url) => {
  const target = new URL(url.pathname.replace(/^\/api/, '/api') + url.search, gateway);
  const upstream = http.request(target, {method:req.method,headers:{...req.headers,host:target.host}}, (r) => { res.writeHead(r.statusCode ?? 502, r.headers); r.pipe(res); });
  upstream.on('error', (error) => send(res,502,JSON.stringify({error:{code:'GATEWAY_UNAVAILABLE',message:error.message}}),'application/json; charset=utf-8'));
  req.pipe(upstream);
};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')) return proxy(req,res,url);
  const rel=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
  const file=path.resolve(root,rel);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()) return send(res,404,'Not found');
  send(res,200,fs.readFileSync(file),mime[path.extname(file)] ?? 'application/octet-stream');
});
server.listen(port,'127.0.0.1',()=>console.log(`HNAF v0.8 Web Host: http://127.0.0.1:${port} -> ${gateway.href}`));
