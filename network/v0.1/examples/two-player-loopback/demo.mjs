import {RealityNetworkRuntime,createTwoPlayerWorldConfig} from '../../packages/network/reality-network-runtime/src/index.mjs';

const runtime=new RealityNetworkRuntime();
const sessionId='session:two-player-loopback';
await runtime.createSession({sessionId,worldConfig:createTwoPlayerWorldConfig(),network:{seed:20260703}});
await runtime.joinSession({sessionId,subjectId:'subject:blue',playerId:'blue',characterId:'character:blue',bodyId:'player-blue'});
await runtime.joinSession({sessionId,subjectId:'subject:red',playerId:'red',characterId:'character:red',bodyId:'player-red'});
for(let tick=0;tick<60;tick++){
  runtime.submitInput({sessionId,playerId:'blue',command:{type:'move',x:1000000,z:0}});
  runtime.submitInput({sessionId,playerId:'red',command:{type:'move',x:-1000000,z:0}});
  runtime.advanceServerTick({sessionId});
}
console.log(JSON.stringify(runtime.getSessionHealth({sessionId}),null,2));
