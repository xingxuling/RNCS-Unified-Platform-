import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readJson=(path)=>JSON.parse(readFileSync(resolve(path),'utf8'));
const sha256File=(path)=>createHash('sha256').update(readFileSync(resolve(path))).digest('hex');
const required=[
  'evidence/BENCHMARK_ALPHA12.json',
  'outputs/alpha12-integration/studio-live/live-manifest.json',
  'outputs/alpha12-integration/studio-live/live-project.json',
  'outputs/alpha12-integration/studio-live/live-scene.vsr.json',
  'outputs/alpha12-integration/studio-live.png',
  'outputs/alpha12-integration/hnac/snapshot.json',
  'outputs/alpha12-integration/hnac/export-bundle.json',
  'outputs/alpha12-integration/hnac/restored.json',
  'outputs/alpha12-integration/reality-one-gateway-receipt.json'
];
for(const path of required) if(!existsSync(resolve(path))) throw new Error(`缺少 Alpha.12 证据：${path}`);
const benchmark=readJson(required[0]);
const studio=readJson(required[1]);
const snapshot=readJson(required[5]);
const bundle=readJson(required[6]);
const restored=readJson(required[7]);
const gateway=readJson(required[8]);
const evidence={
  format:'vsr.alpha12.integration-evidence.v0.1',
  runtime:'vsr@0.1.0-alpha.12',
  benchmark,
  hnac:{
    stateRoot:snapshot.state.state_root,
    snapshotRoot:snapshot.snapshotRoot,
    bundleRoot:bundle.bundle_root,
    omittedPartitions:bundle.omitted_partitions,
    restoredDisplayHash:restored.displayHash,
    portableVariableKeys:Object.keys(snapshot.state.partitions.portable.variables??{}).sort()
  },
  realityStudio:{
    sourceFormat:'reality-studio.project.v0.4',
    sessionId:studio.sessionId,
    sequence:studio.sequence,
    eventChainRoot:studio.eventChainRoot,
    projectRoot:studio.projectRoot,
    sceneRoot:studio.sceneRoot,
    documentRoot:studio.documentRoot,
    displayHash:studio.displayHash,
    rebuildCount:studio.rebuildCount,
    signalCount:studio.signalCount,
    pngHash:sha256File(required[4])
  },
  realityOne:{
    sessionId:gateway.sessionId,
    proposalHash:gateway.proposalHash,
    interactionCommitHash:gateway.interactionCommitHash,
    previewRoot:gateway.previewRoot,
    executionRoot:gateway.executionRoot,
    finalGlobalRoot:gateway.finalGlobalRoot,
    eventChainRoot:gateway.eventChainRoot,
    gatewayStatus:gateway.gatewayStatus,
    receiptRoot:gateway.receiptRoot
  }
};
writeFileSync(resolve('evidence/ALPHA12_INTEGRATION.json'),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({ok:true,output:'evidence/ALPHA12_INTEGRATION.json',studioEventRoot:studio.eventChainRoot,hnacStateRoot:snapshot.state.state_root,gatewayReceiptRoot:gateway.receiptRoot},null,2));
