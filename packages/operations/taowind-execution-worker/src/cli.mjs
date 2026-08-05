#!/usr/bin/env node
import {createExecutionWorker} from './worker.mjs';
const worker=createExecutionWorker();
await worker.start();
console.log(JSON.stringify({status:'listening',url:worker.url,runtime:worker.runtime.status()}));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await worker.stop();process.exit(0);});
