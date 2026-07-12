import {QuestRuntime,CooperativeTaskRuntime,runDeterministicReplay,normalizeProgram} from '@taowind/reality-behavior-fabric';
import {SequencerSession,normalizeSequence} from '@taowind/reality-studio-native';
export async function runBehaviorSequencerWorld(){
 const quest=new QuestRuntime([{quest_id:'quest:aether-gate',stages:[{objectives:[{objective_id:'meet-guide',event:'npc.met',target:1}]},{objectives:[{objective_id:'open-gate',event:'gate.opened',target:1}]}]}]);
 const instance=quest.start('quest:aether-gate',{participants:['blue','red']});quest.apply('npc.met',{entity_id:'guide'});
 const coop=new CooperativeTaskRuntime({taskId:'task:twin-plates',participants:['blue','red'],requirements:[{signal:'plate.down',minimum_participants:2}]});coop.signal({participant_id:'blue',signal:'plate.down'});coop.signal({participant_id:'red',signal:'plate.down'});quest.apply('gate.opened',{amount:1});
 const program=normalizeProgram({identity:{program_id:'behavior-v011',title:'Aether Gate'},tick_rate:30,seed:11,globals:{beats:0},entities:[],prefabs:[],state_machines:[],behavior_trees:[],capabilities:[],rules:[{rule_id:'beat',event:'tick',actions:[{type:'add',target:'globals.beats',value:1}]}]});
 const replay=runDeterministicReplay(program,[{},{},{},{}]);
 const sequence=normalizeSequence({sequence_id:'seq:aether-gate',title:'Aether Gate Completion',fps:30,duration:4,tracks:[
  {track_id:'quest',type:'quest',clips:[{clip_id:'quest-complete',start:1,duration:0,payload:{instance_id:instance.instance_id,event:'quest.completed'}}]},
  {track_id:'camera',type:'camera',clips:[{clip_id:'camera-reveal',start:0,duration:2,payload:{shot:'gate-reveal'}}]},
  {track_id:'dialogue',type:'dialogue',clips:[{clip_id:'guide-line',start:1,duration:2,payload:{speaker:'guide',text:'以太门已经开启。'}}]},
  {track_id:'audio',type:'audio',clips:[{clip_id:'music-rise',start:0,duration:4,payload:{cue:'aether-rise'}}]},
  {track_id:'effect',type:'effect',clips:[{clip_id:'gate-fx',start:1,duration:1,payload:{effect:'gate-bloom'}}]}
 ]});
 const sequencer=new SequencerSession(sequence);sequencer.seek(0);const completionFrame=sequencer.seek(1);const snapshot=sequencer.snapshot('completion');const a=sequencer.step(1);sequencer.restore('completion');const b=sequencer.step(1);
 const q=quest.snapshot(),c=coop.snapshot();
 const acceptance={questCompleted:q.instances[0].status==='completed',cooperativeTaskCompleted:c.status==='completed',replayDeterministic:replay.deterministic,authorityEventFired:completionFrame.authority_events.length===1,presentationTracksActive:completionFrame.presentation_state.length>=3,rootsSeparated:completionFrame.authority_root!==completionFrame.presentation_root,snapshotReplayStable:a.frame_root===b.frame_root};
 return{format:'rncs.behavior-sequencer-world.v0.11',versions:{suite:'0.11.0-alpha.1',behavior:'0.9.0-alpha.1',studio:'1.6.0-alpha.1'},quest:q,cooperative_task:c,replay:{deterministic:replay.deterministic,final_root:replay.first.final_root,replay_root:replay.replay_root},sequence:{sequence_root:sequence.sequence_root,completion_frame:completionFrame,snapshot},acceptance};
}
