import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {rootHash} from '../packages/world/native-character-morphogenesis-runtime/src/canonical.mjs';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=process.argv.indexOf('--evidence');
const dir=arg>=0?path.resolve(process.argv[arg+1]):path.join(repoRoot,'evidence/anime-forge-phase6-6-native-drawing-infrastructure-v0.1');
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const write=(name,value)=>fs.writeFileSync(path.join(dir,name),`${JSON.stringify(value,null,2)}\n`);
const required=['evidence-ledger.json','evidence-summary.json','face-surface-evidence.json','hair-surface-evidence.json','mesh-silhouette-evidence.json'];
for(const name of required)if(!fs.existsSync(path.join(dir,name)))throw Object.assign(new Error(`PHASE66_DIRECT_EVIDENCE_BINDING_MISSING:${name}`),{code:'PHASE66_DIRECT_EVIDENCE_BINDING_MISSING',name});
const ledger=read('evidence-ledger.json'),summary=read('evidence-summary.json'),face=read('face-surface-evidence.json'),hair=read('hair-surface-evidence.json'),mesh=read('mesh-silhouette-evidence.json');
for(const [name,value] of Object.entries({face,hair,mesh}))if(value.status!=='passed'||value.human_visual_acceptance!=='pending'||value.evidence_root!==rootHash({...value,evidence_root:''}))throw Object.assign(new Error(`PHASE66_DIRECT_EVIDENCE_INVALID:${name}`),{code:'PHASE66_DIRECT_EVIDENCE_INVALID',name,status:value.status});
const visualBridge={format:'rncs.phase6-6-direct-visual-bridge.v0.1',face_surface_evidence_root:face.evidence_root,hair_surface_evidence_root:hair.evidence_root,mesh_silhouette_evidence_root:mesh.evidence_root,authority_statement:'SurfaceAttachment/WeightedMesh evidence modifies final DrawingIR while identity and canonical morphology roots remain upstream',human_visual_acceptance:'pending',bridge_root:''};visualBridge.bridge_root=rootHash({...visualBridge,bridge_root:''});write('direct-visual-bridge.json',visualBridge);
const nextLedger={...ledger,face_surface_evidence_root:face.evidence_root,hair_surface_evidence_root:hair.evidence_root,mesh_silhouette_evidence_root:mesh.evidence_root,direct_visual_bridge_root:visualBridge.bridge_root,ledger_root:''};nextLedger.ledger_root=rootHash({...nextLedger,ledger_root:''});write('evidence-ledger.json',nextLedger);
const nextSummary={...summary,face_surface_evidence_root:face.evidence_root,hair_surface_evidence_root:hair.evidence_root,mesh_silhouette_evidence_root:mesh.evidence_root,direct_visual_bridge_root:visualBridge.bridge_root,ledger_root:nextLedger.ledger_root,human_visual_acceptance:'pending'};write('evidence-summary.json',nextSummary);
console.log(JSON.stringify({format:'rncs.phase6-6-direct-evidence-binding.v0.1',passed:true,evidence_dir:dir,face_surface_evidence_root:face.evidence_root,hair_surface_evidence_root:hair.evidence_root,mesh_silhouette_evidence_root:mesh.evidence_root,direct_visual_bridge_root:visualBridge.bridge_root,ledger_root:nextLedger.ledger_root},null,2));
