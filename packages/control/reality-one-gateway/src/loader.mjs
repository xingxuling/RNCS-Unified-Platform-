import path from 'node:path';import {pathToFileURL} from 'node:url';
import {invokeStdio} from './transport.mjs';import {GatewayError} from './canonical.mjs';
export class RuntimeLoader{
 constructor(){this.cache=new Map();}
 async load(manifest){if(this.cache.has(manifest.manifest_root))return this.cache.get(manifest.manifest_root);let runtime;
  if(manifest.transport.kind==='node-module'){const pkg=await import(manifest.transport.package);const entryUrl=import.meta.resolve(manifest.transport.package);const bridgePath=path.resolve(path.dirname(manifest.manifest_file),manifest.bridge);const bridgeModule=await import(pathToFileURL(bridgePath));if(typeof bridgeModule.createBridge!=='function')throw new GatewayError('BRIDGE_FACTORY_MISSING',bridgePath);runtime=await bridgeModule.createBridge({manifest,module:pkg,entryUrl});}
  else runtime={health:()=>invokeStdio(manifest,'health',{},{}),invoke:(action,payload,opts)=>invokeStdio(manifest,action,payload,opts)};
  this.cache.set(manifest.manifest_root,runtime);return runtime;}
}
