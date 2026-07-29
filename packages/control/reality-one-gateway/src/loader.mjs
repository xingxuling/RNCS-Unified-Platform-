import path from 'node:path';import {pathToFileURL} from 'node:url';
import {invokeStdio} from './transport.mjs';import {GatewayError} from './canonical.mjs';
import {BUNDLED_RUNTIME_MODULES} from './bundled-runtime-modules.mjs';
export class RuntimeLoader{
 constructor(){this.cache=new Map();}
 async load(manifest,{dataDir}={}){const cacheKey=`${manifest.manifest_root}:${path.resolve(dataDir??'')}`;if(this.cache.has(cacheKey))return this.cache.get(cacheKey);let runtime;
  if(manifest.transport.kind==='node-module'){
   const bundled=BUNDLED_RUNTIME_MODULES.get(manifest.transport.package);
   if(bundled) runtime=await bundled.bridge.createBridge({manifest,module:bundled.module,entryUrl:import.meta.url,dataDir});
   else {const pkg=await import(manifest.transport.package);const entryUrl=import.meta.resolve(manifest.transport.package);const bridgePath=path.resolve(path.dirname(manifest.manifest_file),manifest.bridge);const bridgeModule=await import(pathToFileURL(bridgePath));if(typeof bridgeModule.createBridge!=='function')throw new GatewayError('BRIDGE_FACTORY_MISSING',bridgePath);runtime=await bridgeModule.createBridge({manifest,module:pkg,entryUrl,dataDir});}
  }
  else runtime={health:()=>invokeStdio(manifest,'health',{},{}),invoke:(action,payload,opts)=>invokeStdio(manifest,action,payload,opts)};
  this.cache.set(cacheKey,runtime);return runtime;}
}
