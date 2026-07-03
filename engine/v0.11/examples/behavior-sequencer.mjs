import {normalizeProgram} from '@taowind/reality-behavior-fabric';
import {createUnifiedProject,UnifiedManufacturingSession} from '@taowind/reality-studio-native';
import {normalizeSequence} from '@taowind/reality-studio-native/sequencer';

const program=normalizeProgram({identity:{program_id:'behavior:aether-gate-coop',title:'以太岛双人门任务'},globals:{reward:0,gate_open:false},entities:[{entity_id:'blue'},{entity_id:'red'}],quests:[{quest_id:'quest:aether-gate',auto_start:true,participants:['blue','red'],objectives:[{objective_id:'blue',event:'plate.blue'},{objective_id:'red',event:'plate.red'}],rewards:[{type:'set',target:'globals.reward',value:100},{type:'set',target:'globals.gate_open',value:true}]}]});
const sequence=normalizeSequence({sequence_id:'sequence:aether-gate-v011',title:'双人任务与宣传镜头',tick_rate:60,duration_ticks:8,tracks:[
  {track_id:'behavior',type:'behavior',clips:[{clip_id:'blue',start_tick:2,end_tick:2,payload:{event:'plate.blue'}},{clip_id:'red',start_tick:4,end_tick:4,payload:{event:'plate.red'}}]},
  {track_id:'branch',type:'branch',clips:[{clip_id:'ending',start_tick:5,end_tick:5,payload:{cases:[{case_id:'success',path:'quests.quest:aether-gate.status',equals:'completed',event:'story.success'}],default_case:{case_id:'retry',event:'story.retry'}}}]},
  {track_id:'camera',type:'camera',clips:[{clip_id:'camera',start_tick:0,end_tick:8,payload:{shot:'gate'},keyframes:[{tick:0,value:{x:0,zoom_milli:1000}},{tick:8,value:{x:300,zoom_milli:1350}}]}]},
  {track_id:'dialogue',type:'dialogue',clips:[{clip_id:'dialogue',start_tick:5,end_tick:8,payload:{text:'同频成立，通道已开放。'}}]},
  {track_id:'audio',type:'audio',clips:[{clip_id:'audio',start_tick:0,end_tick:8,payload:{cue:'aether-theme'}}]},
  {track_id:'effect',type:'effect',clips:[{clip_id:'effect',start_tick:5,end_tick:8,payload:{effect:'gate-open'}}]}
]});

export async function runBehaviorSequencer(){
  const make=()=>{const session=new UnifiedManufacturingSession(createUnifiedProject({program}));session.replaceSequence(sequence,{preserveTick:false});return session};
  const authority=make();authority.sequencePlay({ticks:2});const snapshot=authority.sequenceSnapshot('checkpoint').sequence_snapshot;authority.sequencePlay({ticks:6});const completed=authority.inspect(),completedRoot=completed.sequencer.roots.state_root;
  authority.sequenceRestore(snapshot);authority.sequencePlay({ticks:6});const replayed=authority.inspect();
  const replica=make();replica.sequencePlay({ticks:8});const replicaState=replica.inspect();
  const projection=authority.spatialProjection({width:640,height:360,qualityTier:'quality'}),before=authority.exportArtifacts();authority.sequenceRecordBehavior();const after=authority.exportArtifacts();
  const quest=authority.behavior.runtime.state.quests['quest:aether-gate'];
  return{evidence:{quest,roots:{completed_sequence_state_root:completedRoot,replayed_sequence_state_root:replayed.sequencer.roots.state_root,replica_sequence_state_root:replicaState.sequencer.roots.state_root,authority_root:replayed.sequencer.roots.authority_root,presentation_root:replayed.sequencer.roots.presentation_root,pixel_root:projection.pixel_root},acceptance:{cooperativeQuestCompleted:quest.status==='completed',successBranchSelected:replayed.sequencer.branches.some(x=>x.case_id==='success'),snapshotReplayDeterministic:replayed.sequencer.roots.state_root===completedRoot,replicaConvergence:replicaState.sequencer.roots.state_root===completedRoot,authorityPresentationSeparated:replayed.sequencer.roots.authority_root!==replayed.sequencer.roots.presentation_root,multitrackPresentation:before.sequencer.presentation_frame.commands.length>=3,behaviorTraceRecorded:after.sequencer.sequence.tracks.some(x=>x.track_id==='track:recorded-behavior'),spatialProjectionProduced:Boolean(projection.pixel_root)}}};
}
