import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { replaySimulation } from '../dist/packages/simulation-core/src/index.js';
import { simulateBranchSet, selectSimulationBranch, verifySimulationBranchSet } from '../dist/packages/simulation-branch/src/index.js';
import { SimulationBranchVSRBridge, createSimulationBranchObserverProfile } from '../dist/packages/simulation-branch-vsr/src/index.js';
import { simulationSelectionToRFERequest, RFEVSRSimulationJournal } from '../dist/packages/adapter-rsr/src/index.js';
import { cryptographicHash } from '../dist/packages/spec/src/index.js';

const output=resolve('outputs/alpha8-simulation');
rmSync(output,{recursive:true,force:true});mkdirSync(output,{recursive:true});
const config=JSON.parse(readFileSync('examples/simulation-assets/falling-box.world.json','utf8'));
const base=replaySimulation(config,30);
const baseRealityRoot=cryptographicHash('alpha8:base-reality');
const plans=[
  {format:'vsr.simulation-branch-plan.v0.1',branchId:'baseline',label:'自然演化',createdBy:'subject:planner',logicalTime:1,baseRealityRoot,steps:90,commands:[]},
  {format:'vsr.simulation-branch-plan.v0.1',branchId:'impulse-right',label:'右向冲量',createdBy:'subject:planner',logicalTime:1,baseRealityRoot,steps:90,commands:[{id:'impulse-right',tick:40,type:'apply-impulse',bodyId:'falling-box',impulse:{x:180000,y:-120000}}]},
  {format:'vsr.simulation-branch-plan.v0.1',branchId:'brake',label:'提前制动',createdBy:'subject:planner',logicalTime:1,baseRealityRoot,steps:90,commands:[{id:'brake',tick:50,type:'set-velocity',bodyId:'falling-box',velocity:{x:0,y:0}}]},
];
const set=simulateBranchSet(base,plans);
const verification=verifySimulationBranchSet(set);
const selection=selectSimulationBranch(set,'brake','subject:planner',2,'选择可控且低风险的候选未来');
const bridge=new SimulationBranchVSRBridge(set,{width:1280,height:720,title:'现实模拟分支比较'});
const rendered=bridge.render([createSimulationBranchObserverProfile('viewer'),createSimulationBranchObserverProfile('planner'),createSimulationBranchObserverProfile('auditor')],['desktop','mobile']);
writeFileSync(resolve(output,'branch-set.json'),JSON.stringify(set,null,2));
writeFileSync(resolve(output,'branch-selection.json'),JSON.stringify(selection,null,2));
writeFileSync(resolve(output,'branch-comparison.vsr.json'),JSON.stringify(bridge.document,null,2));
for(const view of rendered.views){for(const [device,png] of Object.entries(view.pngByDevice))writeFileSync(resolve(output,`${view.observer.roles?.[0]??view.observer.observerId}-${device}.png`),png)}
const constitutional=JSON.parse(readFileSync('examples/rfe-constitutional-context.json','utf8'));
const planner=rendered.views.find(view=>view.observer.roles?.includes('planner'));
const desktop=planner.devices.find(device=>device.profile.deviceClass==='desktop');
const request=simulationSelectionToRFERequest(set,selection,constitutional,{sourceDocumentHash:rendered.sourceDocumentHash,sourceDisplayHash:rendered.sourceDisplayHash,observerDisplayHash:planner.observerProjection.manifest.projectedDisplayHash,deviceDisplayHash:desktop.manifest.projectedDisplayHash,realityInvariantHash:planner.observerProjection.manifest.invariantHash});
writeFileSync(resolve(output,'rfe-simulation-commit-request.json'),JSON.stringify(request,null,2));
const journalPath=resolve(output,'rfe-simulation-journal.json');const journal=new RFEVSRSimulationJournal(journalPath,'alpha8:simulation-journal');const receipt=journal.append(request);
const evidence={
  format:'vsr.alpha8.simulation-branch-evidence.v0.1',runtime:'vsr@0.1.0-alpha.8',
  base:{tick:base.tick,stateRoot:base.stateRoot,contactRoot:base.contactRoot},
  branchSet:{setRoot:set.setRoot,branchCount:set.branchCount,comparisonCount:set.comparisons.length,verification},
  branches:set.branches.map(branch=>({branchId:branch.branchId,branchRoot:branch.branchRoot,finalRoot:branch.finalSnapshot.stateRoot,causalDeltaRoot:branch.causalDelta.deltaRoot,metrics:branch.metrics})),
  selection,
  projection:{documentHash:rendered.sourceDocumentHash,sourceDisplayHash:rendered.sourceDisplayHash,observerVerification:rendered.observerVerification,views:rendered.views.map(view=>({observerId:view.observer.observerId,observerDisplayHash:view.observerProjection.manifest.projectedDisplayHash,deviceVerification:view.deviceVerification,pngHashByDevice:view.pngHashByDevice}))},
  rfe:{requestHash:request.requestHash,receipt,verification:journal.verify()},
};
writeFileSync(resolve('evidence/ALPHA8_SIMULATION_BRANCH.json'),JSON.stringify(evidence,null,2));
console.log(JSON.stringify({ok:true,output,setRoot:set.setRoot,selectionRoot:selection.selectionRoot,requestHash:request.requestHash,journalHead:receipt.recordHash,verification:verification.ok,observerVerification:rendered.observerVerification.ok},null,2));
