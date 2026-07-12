import {evalCondition} from './expression.mjs';

function nodeKey(treeId,node,path){return`${treeId}:${node.id??path.join('.')}`;}
export function initializeTrees(program){const out={};for(const t of program.behavior_trees??[])out[t.tree_id]={tree_id:t.tree_id,entity_id:t.entity_id,status:'idle',memory:{},ticks:0};return out;}
export function tickBehaviorTree(runtime,treeId,event){
  const tree=runtime.program.behavior_trees.find(x=>x.tree_id===treeId),state=runtime.state.trees[treeId];if(!tree||!state)return'failure';
  state.ticks++;const result=runNode(runtime,tree,state,tree.root,event,[]);state.status=result;runtime.trace('tree.tick',{tree_id:treeId,entity_id:tree.entity_id,status:result});return result;
}
function runNode(runtime,tree,treeState,node,event,path){
  if(!node)return'failure';const key=nodeKey(tree.tree_id,node,path),mem=treeState.memory[key]??={};treeState.memory[key]=mem;const ctx=runtime.context(tree.entity_id,event);
  switch(node.type){
    case'condition':return evalCondition(node.condition,ctx)?'success':'failure';
    case'action':runtime.executeActions(node.actions??[],ctx);return node.result??'success';
    case'wait':{mem.started_tick??=runtime.state.tick;const ticks=Number(node.ticks??1);if(runtime.state.tick-mem.started_tick>=ticks){delete treeState.memory[key];return'success';}return'running';}
    case'sequence':{mem.cursor??=0;while(mem.cursor<(node.children??[]).length){const r=runNode(runtime,tree,treeState,node.children[mem.cursor],event,[...path,mem.cursor]);if(r==='running')return r;if(r==='failure'){delete treeState.memory[key];return r;}mem.cursor++;}delete treeState.memory[key];return'success';}
    case'selector':{mem.cursor??=0;while(mem.cursor<(node.children??[]).length){const r=runNode(runtime,tree,treeState,node.children[mem.cursor],event,[...path,mem.cursor]);if(r==='running')return r;if(r==='success'){delete treeState.memory[key];return r;}mem.cursor++;}delete treeState.memory[key];return'failure';}
    case'inverter':{const r=runNode(runtime,tree,treeState,node.child,event,[...path,0]);return r==='running'?r:r==='success'?'failure':'success';}
    case'repeat':{mem.count??=0;const limit=Number(node.count??Infinity);const r=runNode(runtime,tree,treeState,node.child,event,[...path,0]);if(r==='running')return r;if(r==='failure'&&!node.until_success)return'failure';mem.count++;if(mem.count>=limit||(node.until_success&&r==='success')){delete treeState.memory[key];return'success';}return'running';}
    case'parallel':{const results=(node.children??[]).map((c,i)=>runNode(runtime,tree,treeState,c,event,[...path,i]));const successNeed=Number(node.success_threshold??results.length),failureNeed=Number(node.failure_threshold??1);if(results.filter(x=>x==='success').length>=successNeed)return'success';if(results.filter(x=>x==='failure').length>=failureNeed)return'failure';return'running';}
    default:return'failure';
  }
}
