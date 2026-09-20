import {evaluateAnimationFrame} from '../src/index.mjs';
const frame={format:'reality-studio.sequence-frame.v1.6',sequence_id:'demo',time:.5,active:[],fired:[],authority_events:[],authority_root:'authority-demo',presentation_root:'presentation-demo',frame_root:'studio-frame-demo',presentation_state:[
  {track_id:'track:2d',track_type:'animation',clip_id:'hero-face',local_time:.5,progress:.5,payload:{animation_fabric:{domain:'2d',curves:{opacity:{keys:[{time:0,value:0},{time:1,value:1}]}}}}},
  {track_id:'track:3d',track_type:'animation',clip_id:'hero-body',local_time:.5,progress:.5,payload:{animation_fabric:{domain:'3d',clipId:'walk',nodeIds:['hero'],weight:1}}}
]};
console.log(JSON.stringify(evaluateAnimationFrame(frame),null,2));
