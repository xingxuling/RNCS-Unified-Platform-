import path from 'node:path';import {AetherworldRNCSNativeRuntime} from '@taowind/aether-rncs-bridge';
export async function createBridge({manifest}){const runtime=new AetherworldRNCSNativeRuntime({dataDir:path.resolve(path.dirname(manifest.manifest_file),'../output/aetherworld-native')});return{health:()=>runtime.health(),invoke:(action,payload)=>runtime.invoke(action,payload)};}
