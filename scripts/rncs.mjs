import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const registry=JSON.parse(fs.readFileSync(path.join(root,'rncs.modules.json'),'utf8'));
const cmd=process.argv[2]??'modules';
if(cmd==='modules'){
 console.log(`RNCS Unified Platform ${registry.suiteVersion}`);
 for(const m of registry.modules)console.log(`${m.id.padEnd(18)} ${m.version.padEnd(18)} ${m.layer.padEnd(8)} ${m.path}`);
}else if(cmd==='health'){
 const {RealityOneGateway}=await import(pathToFileURL(path.join(root,'packages/control/reality-one-gateway/src/gateway.mjs')));
 const g=new RealityOneGateway({manifestDirs:[path.join(root,'packages/control/reality-one-gateway/runtimes')],dataDir:path.join(root,'artifacts/gateway-health')});
 await g.discover();const report=await g.health();console.log(JSON.stringify(report,null,2));if(report.status!=='healthy')process.exitCode=1;
}else{console.error(`Unknown command: ${cmd}`);process.exitCode=2;}
