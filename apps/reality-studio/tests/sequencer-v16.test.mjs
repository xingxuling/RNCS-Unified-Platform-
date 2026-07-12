import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeSequence,evaluateSequence,SequencerSession,recordBehaviorTraceAsSequence} from '../src/index.mjs';
const sequence=normalizeSequence({sequence_id:'seq:test',fps:30,duration:4,tracks:[
 {track_id:'camera',type:'camera',clips:[{clip_id:'shot-a',start:0,duration:2,payload:{camera:'a'}},{clip_id:'shot-b',start:2,duration:2,payload:{camera:'b'}}]},
 {track_id:'quest',type:'quest',clips:[{clip_id:'quest-start',start:1,duration:0,payload:{event:'quest.started'}}]},
 {track_id:'audio',type:'audio',clips:[{clip_id:'music',start:0,duration:4,payload:{cue:'island'}}]}
]});

test('sequencer separates authority events from presentation state',()=>{const frame=evaluateSequence(sequence,1,{previousTime:0.5});assert.equal(frame.authority_events.length,1);assert.ok(frame.presentation_state.some(x=>x.track_type==='camera'));assert.ok(frame.presentation_state.some(x=>x.track_type==='audio'));assert.notEqual(frame.authority_root,frame.presentation_root);});

test('sequencer snapshot restores playhead and deterministic frame roots',()=>{const s=new SequencerSession(sequence);s.seek(1);s.snapshot('branch');const a=s.step(1);s.restore('branch');const b=s.step(1);assert.equal(a.frame_root,b.frame_root);assert.equal(s.time,1+1/30);});

test('behavior trace can be recorded into editable sequence',()=>{const seq=recordBehaviorTraceAsSequence([{sequence:1,time:0.5,tick:15,type:'quest.started'},{sequence:2,time:1,tick:30,type:'gate.open'}]);assert.equal(seq.tracks[0].clips.length,2);assert.equal(seq.tracks[0].type,'behavior');});
