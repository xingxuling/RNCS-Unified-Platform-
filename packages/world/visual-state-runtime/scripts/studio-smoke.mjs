import { readFileSync } from 'node:fs';
const html = readFileSync('dist/apps/studio/index.html', 'utf8');
const js = readFileSync('dist/apps/studio/app.js', 'utf8');
const ids = ['newDoc','openDoc','saveDoc','loadExample','validateDoc','play','pause','stop','prevFrame','nextFrame','addRect','duplicateNode','deleteNode','undo','redo','exportPng','renderRange','analyzeGpuPlan','analyzeHybridPlan','loadRealityStudioDemo','loadRealityStudioV03','loadRealityStudioV04','nextStudioLiveEvent','previewRealityStudioPatch','exportHNACState','loadRealityOneUnified','applyTransaction','loadRealityDemo','nextRealityEvent','autoRealityReplay','resetRealityReplay','exportRealitySnapshot','observerProfile','deviceProfile','approveRealityAuthority','denyRealityAuthority','submitRealityGateway','startSharedSession','syncSharedReplica','revokeSharedAuthority','loadSimulationDemo','rerunSimulationBranches','selectSimulationBranch'];
const missing = ids.filter(id => !html.includes(`id="${id}"`) || !js.includes(`$('${id}')`));
if (missing.length) { console.error('Studio smoke failed:', missing); process.exit(1); }
console.log(`Studio smoke passed: ${ids.length} interactive controls wired.`);
