import {UnifiedManufacturingSession} from '@taowind/reality-studio-native';
import {replaySpatialReplayBundle,verifySpatialReplayBundle} from '@taowind/reality-engine-session/spatial-replay';
import {compileSpatialFrame,verifySpatialFrame} from '@taowind/visual-state-runtime/spatial-reality-3d';
import {clone,rootHash,seal} from './canonical.mjs';

export const RUNTIME_EVIDENCE_FORMAT='reality-build.runtime-evidence.v0.1';
export const RUNTIME_EVIDENCE_VERSION='0.1.0-alpha.1';

function normalizeTrace(trace){
  const frames=Array.isArray(trace)&&trace.length?trace:[{},{}];
  return frames.map(frame=>frame&&typeof frame==='object'&&!Array.isArray(frame)?clone(frame):{});
}
function normalizeSpatialTrace(trace){
  return(Array.isArray(trace)?trace:[]).map((frame,frameIndex)=>{
    const commands=Array.isArray(frame)?frame:(Array.isArray(frame?.commands)?frame.commands:[]);
    return commands.map((command,commandIndex)=>({...clone(command&&typeof command==='object'?command:{}),id:String(command?.id??`build-spatial-command:${frameIndex+1}:${commandIndex+1}`)}));
  });
}
function replayCommands(trace,initialTick){
  return trace.flatMap((commands,frameIndex)=>commands.map(command=>({...clone(command),tick:initialTick+frameIndex+1})));
}
function portableProject(project){
  const out=clone(project);
  if(out.assets){
    out.assets.import_roots=[];
    for(const record of Object.values(out.assets.registry??[])){
      if(record.source){delete record.source.absolute_path;delete record.source.source_root;}
      for(const file of record.files??[])delete file.absolute_path;
    }
  }
  return out;
}
function runSpatialTrace(session,trace){
  const initial=clone(session.spatial.lastSnapshot),frames=[];
  for(const [index,commands] of trace.entries()){
    session.spatial.step({commands});
    const snapshot=session.spatial.lastSnapshot;
    frames.push({sequence:index+1,tick:snapshot.tick,command_count:commands.length,command_root:rootHash(commands),state_root:snapshot.stateRoot});
  }
  return{initial_snapshot:initial,initial_state_root:initial.stateRoot,frames,final_snapshot:clone(session.spatial.lastSnapshot),final_state_root:session.spatial.lastSnapshot.stateRoot};
}
function presentationSpec(project){
  const spatial=project?.spatial3d;
  const scene=spatial?.presentation_scene;
  if(!scene||typeof scene!=='object')return null;
  const bindings=Array.isArray(spatial?.presentation_bindings)?spatial.presentation_bindings:[];
  return{scene:clone(scene),bindings:clone(bindings),source_root:spatial?.presentation_source_root??scene.sceneRoot??null};
}
function bindPresentationScene(scene,snapshot,bindings){
  const out=clone(scene);
  const bodies=new Map((snapshot?.bodies??[]).map(body=>[String(body.id),body]));
  const nodes=new Map((out.nodes??[]).map(node=>[String(node.id),node]));
  for(const binding of bindings??[]){
    const body=bodies.get(String(binding?.body_id??binding?.bodyId??''));
    const node=nodes.get(String(binding?.node_id??binding?.nodeId??''));
    if(!body||!node)throw new Error(`PRESENTATION_BINDING_TARGET_MISSING:${String(binding?.body_id??'')}:${String(binding?.node_id??'')}`);
    const divisor=Number(binding?.position_scale??binding?.positionScale??1000);
    if(!Number.isFinite(divisor)||divisor<=0)throw new Error('PRESENTATION_BINDING_SCALE_INVALID');
    node.transform={
      ...(node.transform??{}),
      translation:[Number(body.position?.x??0)/divisor,Number(body.position?.y??0)/divisor,Number(body.position?.z??0)/divisor],
      rotationEulerDeg:[Number(body.rotationDeg?.x??0)/1000,Number(body.rotationDeg?.y??0)/1000,Number(body.rotationDeg?.z??0)/1000]
    };
  }
  return out;
}
export function compileBoundPresentationScene(project,snapshot,fallbackScene,fallbackFramePlan){
  const spec=presentationSpec(project);
  if(!spec)return{scene:fallbackScene,frame_plan:fallbackFramePlan,bound:false,binding_count:0,source_root:null};
  const scene=bindPresentationScene(spec.scene,snapshot,spec.bindings);
  const framePlan=compileSpatialFrame(scene,{
    width:Number(scene?.viewport?.width??project?.spatial3d?.editor?.viewport?.width??960),
    height:Number(scene?.viewport?.height??project?.spatial3d?.editor?.viewport?.height??540),
    qualityTier:String(project?.spatial3d?.editor?.viewport?.quality_tier??'quality')
  });
  const verification=verifySpatialFrame(framePlan);
  if(!verification?.ok)throw new Error(`PRESENTATION_SPATIAL_FRAME_INVALID:${JSON.stringify(verification)}`);
  return{scene,frame_plan:framePlan,bound:true,binding_count:spec.bindings.length,source_root:spec.source_root};
}

export function buildRuntimeEvidence({project,request,identity}={}){
  const trace=normalizeTrace(request?.runtime_trace);
  const spatialTrace=normalizeSpatialTrace(request?.spatial_trace);
  const runtimeProject=portableProject(project);
  const session=new UnifiedManufacturingSession(runtimeProject,{sessionId:`build-runtime:${identity.build_id}`});
  const initialCheckpoint=session.createRuntimeCheckpoint('build-initial').runtime_checkpoint;
  const initialArtifacts=session.exportArtifacts();
  for(const input of trace)session.step(input);

  const spatialReplaySession=new UnifiedManufacturingSession(runtimeProject,{sessionId:`build-spatial-replay:${identity.build_id}`});
  const spatialReplayBundle=spatialTrace.length?spatialReplaySession.spatial.createReplayBundle({
    ticks:spatialTrace.length,
    commands:replayCommands(spatialTrace,spatialReplaySession.spatial.lastSnapshot.tick),
    checkpointEvery:1,
    branchId:`build:${identity.build_id}:spatial`,
    bundleId:`build-spatial:${identity.build_id}`,
    metadata:{build_id:identity.build_id,project_root:project.project_root,source:'reality-build'}
  }):null;
  const spatialReplayVerification=spatialReplayBundle?verifySpatialReplayBundle(spatialReplayBundle):null;
  const spatialReplayResult=spatialReplayBundle&&spatialReplayVerification?.valid?replaySpatialReplayBundle(spatialReplayBundle):null;
  const spatial=runSpatialTrace(session,spatialTrace);
  const spatialReplay=runSpatialTrace(spatialReplaySession,spatialTrace);
  const spatialChecks=spatial.frames.map((frame,index)=>({sequence:frame.sequence,expected_state_root:frame.state_root,actual_state_root:spatialReplay.frames[index]?.state_root??null,match:frame.state_root===spatialReplay.frames[index]?.state_root}));
  const spatialDeterministic=spatial.final_state_root===spatialReplay.final_state_root&&spatialChecks.every(check=>check.match);
  const artifacts=session.exportArtifacts();

  const gpuFramePlan=initialArtifacts.gpu_frame_plan??null;
  const gpuFrameSummary=initialArtifacts.gpu_frame_summary??null;
  const gpuViewportManifest=initialArtifacts.gpu_viewport_manifest??null;
  if(!gpuFramePlan||!gpuFrameSummary||!gpuViewportManifest)throw new Error('GPU_RUNTIME_EVIDENCE_MISSING');

  const spatialInitialSnapshot=initialArtifacts.spatial_snapshot??null;
  const spatialWorld=initialArtifacts.spatial_world??null;
  const fallbackSpatialScene=initialArtifacts.spatial_scene??null;
  const fallbackSpatialFramePlan=initialArtifacts.spatial_frame_plan??null;
  if(!spatialInitialSnapshot||!spatialWorld||!fallbackSpatialScene||!fallbackSpatialFramePlan)throw new Error('SPATIAL_3D_RUNTIME_EVIDENCE_MISSING');
  const presentation=compileBoundPresentationScene(runtimeProject,spatialInitialSnapshot,fallbackSpatialScene,fallbackSpatialFramePlan);
  const spatialScene=presentation.scene;
  const spatialFramePlan=presentation.frame_plan;

  const evidence=seal({
    format:RUNTIME_EVIDENCE_FORMAT,
    version:RUNTIME_EVIDENCE_VERSION,
    build_id:identity.build_id,
    build_key:identity.build_key,
    project_root:project.project_root,
    program_root:artifacts.runtime_timeline.program_root,
    trace,
    initial_checkpoint_root:initialCheckpoint.checkpoint_root,
    timeline_root:artifacts.runtime_timeline.timeline_root,
    replay_root:artifacts.runtime_replay.replay_root,
    deterministic:artifacts.runtime_replay.deterministic,
    final_state_root:artifacts.runtime_replay.actual_state_root,
    spatial_trace:spatialTrace,
    spatial_initial_state_root:spatial.initial_state_root,
    spatial_frames:spatial.frames,
    spatial_final_state_root:spatial.final_state_root,
    spatial_replay_state_root:spatialReplay.final_state_root,
    spatial_deterministic:spatialDeterministic,
    spatial_checks:spatialChecks,
    spatial_replay_bundle_root:spatialReplayBundle?.bundle_root??null,
    spatial_replay_result_root:spatialReplayResult?.replay_root??null,
    spatial_replay_deterministic:spatialReplayVerification?.deterministic??null,
    spatial_replay_checkpoint_count:spatialReplayVerification?.checkpoint_count??0,
    spatial_replay_final_state_root:spatialReplayResult?.final_state_root??null,
    spatial_replay_final_frame_root:spatialReplayResult?.final_frame_root??null,
    spatial_initial_frame_root:spatialFramePlan.frameRoot??null,
    spatial_frame_root:spatialFramePlan.frameRoot??null,
    spatial_final_frame_root:spatialFramePlan.frameRoot??null,
    spatial_causal_delta_root:artifacts.spatial_causal_delta?.deltaRoot??null,
    spatial_runtime_manifest_root:artifacts.spatial_runtime_manifest?.manifest_root??null,
    navigation_manifest_root:artifacts.tilemap_navigation_manifest?.manifest_root??null,
    navigation_receipt_root:artifacts.tilemap_navigation_manifest?.receipt?.receipt_root??null,
    presentation_scene_bound:presentation.bound,
    presentation_scene_source_root:presentation.source_root,
    presentation_scene_frame_root:spatialFramePlan.frameRoot??null,
    presentation_binding_count:presentation.binding_count,
    gpu_frame_plan_root:gpuFrameSummary.frame_plan_root??gpuFramePlan.framePlanRoot??null,
    gpu_resource_root:gpuFrameSummary.resource_root??gpuFramePlan.resourceRoot??null,
    gpu_command_root:gpuFrameSummary.command_root??gpuFramePlan.commandRoot??null,
    gpu_frame_summary_root:gpuFrameSummary.summary_root??null,
    gpu_viewport_manifest_root:gpuViewportManifest.manifest_root??null
  },'evidence_root');

  return{
    evidence,timeline:artifacts.runtime_timeline,replay:artifacts.runtime_replay,checkpoint:initialCheckpoint,
    spatial_initial_snapshot:spatialInitialSnapshot,spatial_world:spatialWorld,spatial_scene:spatialScene,spatial_frame_plan:spatialFramePlan,
    spatial_snapshot:artifacts.spatial_snapshot,spatial_causal_delta:artifacts.spatial_causal_delta,spatial_runtime_manifest:artifacts.spatial_runtime_manifest,
    spatial_replay_bundle:spatialReplayBundle,spatial_replay_result:spatialReplayResult,navigation_manifest:artifacts.tilemap_navigation_manifest,
    gpu_frame_plan:gpuFramePlan,gpu_frame_summary:gpuFrameSummary,gpu_viewport_manifest:gpuViewportManifest
  };
}

export function runtimeEvidenceSummary(runtimeEvidence){
  const e=runtimeEvidence?.evidence??runtimeEvidence;
  if(!e)return null;
  return{
    format:e.format,version:e.version,evidence_root:e.evidence_root,timeline_root:e.timeline_root,replay_root:e.replay_root,
    deterministic:e.deterministic,final_state_root:e.final_state_root,spatial_deterministic:e.spatial_deterministic,
    spatial_initial_frame_root:e.spatial_initial_frame_root,spatial_final_frame_root:e.spatial_final_frame_root,
    spatial_final_state_root:e.spatial_final_state_root,spatial_replay_bundle_root:e.spatial_replay_bundle_root,
    spatial_replay_result_root:e.spatial_replay_result_root,spatial_replay_deterministic:e.spatial_replay_deterministic,
    spatial_replay_checkpoint_count:e.spatial_replay_checkpoint_count,spatial_replay_final_state_root:e.spatial_replay_final_state_root,
    spatial_replay_final_frame_root:e.spatial_replay_final_frame_root,spatial_runtime_manifest_root:e.spatial_runtime_manifest_root,
    navigation_manifest_root:e.navigation_manifest_root,presentation_scene_bound:e.presentation_scene_bound,
    presentation_scene_source_root:e.presentation_scene_source_root,presentation_scene_frame_root:e.presentation_scene_frame_root,
    presentation_binding_count:e.presentation_binding_count,gpu_frame_plan_root:e.gpu_frame_plan_root,gpu_resource_root:e.gpu_resource_root,
    gpu_command_root:e.gpu_command_root,gpu_frame_summary_root:e.gpu_frame_summary_root,gpu_viewport_manifest_root:e.gpu_viewport_manifest_root
  };
}
