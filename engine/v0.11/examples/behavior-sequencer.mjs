import {QuestRuntime,CooperativeTaskRuntime} from '@taowind/reality-behavior-fabric';
import {SequencerSession,normalizeSequence} from '@taowind/reality-studio-native';
const quest=new QuestRuntime([{quest_id:'quest:aether-gate',stages:[{objectives:[{objective_id:'meet-guide',event:'npc.met',target:1}]},{objectives:[{objective_id:'open-gate',event:'gate.opened',target:1}]}]}]);
const instance=quest.start('quest:aether-gate',{participants:['blue','red']});quest.apply('npc.met');
const task=new CooperativeTaskRuntime({taskId:'task:twin-plates',participants:['blue','red'],requirements:[{signal:'plate.down',minimum_participants:2}]});task.signal({participant_id:'blue',signal:'plate.down'});task.signal({participant_id:'red',signal:'plate.down'});quest.apply('gate.opened');
const sequence=normalizeSequence({sequence_id:'seq:aether-gate',fps:30,duration:3,tracks:[{track_id:'quest',type:'quest',clips:[{clip_id:'complete',start:1,duration:0,payload:{instance_id:instance.instance_id}}]},{track_id:'camera',type:'camera',clips:[{clip_id:'reveal',start:0,duration:2,payload:{shot:'gate-reveal'}}]},{track_id:'audio',type:'audio',clips:[{clip_id:'music',start:0,duration:3,payload:{cue:'aether-rise'}}]}]});
const frame=new SequencerSession(sequence).seek(1);console.log(JSON.stringify({quest:quest.snapshot(),task:task.snapshot(),frame},null,2));
