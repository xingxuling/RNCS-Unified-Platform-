import {seal,StudioError} from './canonical.mjs';

export const UI_INPUT_VERSION='1.2.0-alpha.1';
export const UI_TREE_FORMAT='reality-studio.ui-tree.v1.2';
export const INPUT_PROFILE_FORMAT='reality-studio.input-profile.v1.2';
const deep=v=>structuredClone(v);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const getPath=(obj,path)=>String(path??'').split('.').filter(Boolean).reduce((v,k)=>v?.[k],obj);

const node=(id,type,name,props={})=>({ui_node_id:id,type,name,visible:true,enabled:true,focus_mode:'none',mouse_filter:'ignore',z_index:0,anchors:{left:0,top:0,right:0,bottom:0},offsets:{left:0,top:0,right:0,bottom:0},min_size:{width:0,height:0},style:{},layout:{mode:'manual',gap:8,padding:{left:0,top:0,right:0,bottom:0}},bindings:{},events:{},children:[],...props});

export function createDefaultUITree({width=640,height=360}={}){
  const nodes=[
    node('ui:root','Control','界面根',{anchors:{left:0,top:0,right:1000,bottom:1000},mouse_filter:'pass',children:['ui:hud','ui:touch']}),
    node('ui:hud','Control','HUD',{parent_id:'ui:root',anchors:{left:0,top:0,right:1000,bottom:1000},children:['ui:title','ui:health-bg','ui:health','ui:score','ui:objective','ui:pause']}),
    node('ui:title','Label','标题',{parent_id:'ui:hud',anchors:{left:500,top:0,right:500,bottom:0},offsets:{left:-120,top:14,right:120,bottom:44},style:{font_size:18,color:'#e0f2fe',align:'center'},bindings:{text:'project.title'},text:'冰境试炼'}),
    node('ui:health-bg','Panel','生命底板',{parent_id:'ui:hud',anchors:{left:0,top:0,right:0,bottom:0},offsets:{left:18,top:18,right:224,bottom:54},style:{background:'#020617cc',border:'#315878',radius:8}}),
    node('ui:health','ProgressBar','生命',{parent_id:'ui:hud',anchors:{left:0,top:0,right:0,bottom:0},offsets:{left:28,top:28,right:214,bottom:44},style:{background:'#172554',fill:'#38bdf8',radius:5},bindings:{value:'entities.player.health'},value:100,max_value:100}),
    node('ui:score','Label','分数',{parent_id:'ui:hud',anchors:{left:1000,top:0,right:1000,bottom:0},offsets:{left:-180,top:18,right:-18,bottom:48},style:{font_size:15,color:'#fde68a',align:'right'},bindings:{text_template:'分数 {globals.score}'},text:'分数 0'}),
    node('ui:objective','Label','目标',{parent_id:'ui:hud',anchors:{left:500,top:1000,right:500,bottom:1000},offsets:{left:-220,top:-48,right:220,bottom:-16},style:{font_size:13,color:'#bae6fd',align:'center',background:'#020617aa',radius:7},bindings:{text:'globals.message'},text:'取得钥匙并前往出口'}),
    node('ui:pause','Panel','暂停面板',{parent_id:'ui:hud',anchors:{left:500,top:500,right:500,bottom:500},offsets:{left:-150,top:-80,right:150,bottom:80},style:{background:'#071426ee',border:'#67e8f9',radius:12},bindings:{visible:'globals.paused'},visible:false,children:['ui:pause-label']}),
    node('ui:pause-label','Label','暂停文字',{parent_id:'ui:pause',anchors:{left:0,top:0,right:1000,bottom:1000},style:{font_size:28,color:'#e0f2fe',align:'center',valign:'middle'},text:'已暂停'}),
    node('ui:touch','Control','触摸控制',{parent_id:'ui:root',anchors:{left:0,top:0,right:1000,bottom:1000},bindings:{visible:'device.touch'},visible:true,children:['ui:left','ui:right','ui:attack']}),
    node('ui:left','TouchButton','向左',{parent_id:'ui:touch',anchors:{left:0,top:1000,right:0,bottom:1000},offsets:{left:22,top:-82,right:82,bottom:-22},focus_mode:'all',mouse_filter:'stop',style:{background:'#0f2944bb',border:'#38bdf8',radius:30},text:'◀',events:{pressed:'move_left'},navigation:{order:10,right:'ui:right'}}),
    node('ui:right','TouchButton','向右',{parent_id:'ui:touch',anchors:{left:0,top:1000,right:0,bottom:1000},offsets:{left:92,top:-82,right:152,bottom:-22},focus_mode:'all',mouse_filter:'stop',style:{background:'#0f2944bb',border:'#38bdf8',radius:30},text:'▶',events:{pressed:'move_right'},navigation:{order:20,left:'ui:left',right:'ui:attack'}}),
    node('ui:attack','TouchButton','攻击',{parent_id:'ui:touch',anchors:{left:1000,top:1000,right:1000,bottom:1000},offsets:{left:-92,top:-92,right:-22,bottom:-22},focus_mode:'all',mouse_filter:'stop',style:{background:'#3b174fbb',border:'#c084fc',radius:35},text:'攻击',events:{pressed:'attack'},navigation:{order:30,left:'ui:right'}})
  ];
  return seal({format:UI_TREE_FORMAT,version:UI_INPUT_VERSION,ui_id:'ui:main',name:'主游戏界面',design_size:{width,height},scale_mode:'canvas_items',root_id:'ui:root',nodes,theme:{font_family:'system-ui',base_font_size:14},metadata:{coordinate_system:'top-left',anchor_unit:'milli'}},'ui_root');
}

export function createDefaultInputProfile(){
  const actions={
    move_left:{deadzone_milli:250,bindings:[{device:'keyboard',code:'KeyA'},{device:'keyboard',code:'ArrowLeft'},{device:'gamepad-axis',axis:0,direction:-1},{device:'touch',node_id:'ui:left'}]},
    move_right:{deadzone_milli:250,bindings:[{device:'keyboard',code:'KeyD'},{device:'keyboard',code:'ArrowRight'},{device:'gamepad-axis',axis:0,direction:1},{device:'touch',node_id:'ui:right'}]},
    move_up:{deadzone_milli:250,bindings:[{device:'keyboard',code:'KeyW'},{device:'keyboard',code:'ArrowUp'},{device:'gamepad-axis',axis:1,direction:-1}]},
    move_down:{deadzone_milli:250,bindings:[{device:'keyboard',code:'KeyS'},{device:'keyboard',code:'ArrowDown'},{device:'gamepad-axis',axis:1,direction:1}]},
    attack:{deadzone_milli:200,bindings:[{device:'keyboard',code:'Space'},{device:'keyboard',code:'KeyJ'},{device:'gamepad-button',button:0},{device:'touch',node_id:'ui:attack'}]},
    pause:{deadzone_milli:200,bindings:[{device:'keyboard',code:'Escape'},{device:'keyboard',code:'KeyP'},{device:'gamepad-button',button:9}]},
    ui_accept:{deadzone_milli:200,bindings:[{device:'keyboard',code:'Enter'},{device:'keyboard',code:'Space'},{device:'gamepad-button',button:0}]},
    ui_cancel:{deadzone_milli:200,bindings:[{device:'keyboard',code:'Escape'},{device:'gamepad-button',button:1}]},
    ui_left:{deadzone_milli:400,bindings:[{device:'keyboard',code:'ArrowLeft'},{device:'gamepad-axis',axis:0,direction:-1}]},
    ui_right:{deadzone_milli:400,bindings:[{device:'keyboard',code:'ArrowRight'},{device:'gamepad-axis',axis:0,direction:1}]},
    ui_up:{deadzone_milli:400,bindings:[{device:'keyboard',code:'ArrowUp'},{device:'gamepad-axis',axis:1,direction:-1}]},
    ui_down:{deadzone_milli:400,bindings:[{device:'keyboard',code:'ArrowDown'},{device:'gamepad-axis',axis:1,direction:1}]}
  };
  return seal({format:INPUT_PROFILE_FORMAT,version:UI_INPUT_VERSION,profile_id:'input:default',name:'默认跨设备输入',actions,devices:{keyboard:true,mouse:true,gamepad:true,touch:true},metadata:{axis_range:'-1..1',strength_range:'0..1'}},'input_root');
}

export function validateUITree(tree){
  const errors=[],warnings=[],ids=new Set();
  const need=(c,code,path)=>{if(!c)errors.push({code,path});};
  need(tree?.format===UI_TREE_FORMAT,'UI_FORMAT_INVALID','format');need(tree?.version===UI_INPUT_VERSION,'UI_VERSION_INVALID','version');need(Array.isArray(tree?.nodes),'UI_NODES_REQUIRED','nodes');
  for(const n of tree?.nodes??[]){if(ids.has(n.ui_node_id))errors.push({code:'UI_NODE_ID_DUPLICATE',path:n.ui_node_id});ids.add(n.ui_node_id);if(!n.type)errors.push({code:'UI_NODE_TYPE_REQUIRED',path:n.ui_node_id});for(const v of Object.values(n.anchors??{}))if(v<0||v>1000)errors.push({code:'UI_ANCHOR_RANGE_INVALID',path:n.ui_node_id});}
  need(ids.has(tree?.root_id),'UI_ROOT_MISSING','root_id');
  for(const n of tree?.nodes??[]){if(n.parent_id&&!ids.has(n.parent_id))errors.push({code:'UI_PARENT_MISSING',path:n.ui_node_id});for(const c of n.children??[])if(!ids.has(c))errors.push({code:'UI_CHILD_MISSING',path:n.ui_node_id,child:c});if(n.focus_mode!=='none'&&n.enabled===false)warnings.push({code:'UI_DISABLED_FOCUSABLE',path:n.ui_node_id});}
  return{valid:errors.length===0,errors,warnings};
}
export function validateInputProfile(profile){
  const errors=[],warnings=[];if(profile?.format!==INPUT_PROFILE_FORMAT)errors.push({code:'INPUT_FORMAT_INVALID'});if(profile?.version!==UI_INPUT_VERSION)errors.push({code:'INPUT_VERSION_INVALID'});
  for(const [name,a] of Object.entries(profile?.actions??{})){if(!Array.isArray(a.bindings)||!a.bindings.length)warnings.push({code:'INPUT_ACTION_UNBOUND',action:name});for(const b of a.bindings??[]){if(!['keyboard','mouse-button','gamepad-button','gamepad-axis','touch'].includes(b.device))errors.push({code:'INPUT_DEVICE_INVALID',action:name,device:b.device});}}
  return{valid:errors.length===0,errors,warnings};
}

function baseRect(node,parent){const a=node.anchors??{},o=node.offsets??{},x1=parent.x+parent.width*(a.left??0)/1000+(o.left??0),y1=parent.y+parent.height*(a.top??0)/1000+(o.top??0),x2=parent.x+parent.width*(a.right??0)/1000+(o.right??0),y2=parent.y+parent.height*(a.bottom??0)/1000+(o.bottom??0);let width=x2-x1,height=y2-y1;if(width<=0)width=node.min_size?.width??0;if(height<=0)height=node.min_size?.height??0;return{x:Math.round(x1),y:Math.round(y1),width:Math.max(0,Math.round(width)),height:Math.max(0,Math.round(height))};}
function resolveBindings(node,data){const n=deep(node),b=n.bindings??{};if(b.visible){const v=getPath(data,b.visible);if(v!==undefined)n.visible=Boolean(v)}if(b.text){const v=getPath(data,b.text);if(v!==undefined)n.text=String(v)}if(b.value){const v=getPath(data,b.value);if(Number.isFinite(Number(v)))n.value=Number(v)}if(b.text_template)n.text=String(b.text_template).replace(/\{([^}]+)\}/g,(_,p)=>String(getPath(data,p)??''));return n;}
export function layoutUITree(tree,{width=tree.design_size?.width??640,height=tree.design_size?.height??360,safe_area={left:0,top:0,right:0,bottom:0},data={}}={}){
  const v=validateUITree(tree);if(!v.valid)throw new StudioError('UI_TREE_INVALID','',v);const byId=new Map(tree.nodes.map(n=>[n.ui_node_id,resolveBindings(n,data)])),rects={},resolved=[];
  const rootRect={x:safe_area.left??0,y:safe_area.top??0,width:width-(safe_area.left??0)-(safe_area.right??0),height:height-(safe_area.top??0)-(safe_area.bottom??0)};
  const walk=(id,parentRect,depth=0)=>{if(depth>128)throw new StudioError('UI_TREE_DEPTH_EXCEEDED');const n=byId.get(id);if(!n)return;let r=id===tree.root_id?rootRect:baseRect(n,parentRect);rects[id]=r;resolved.push({...n,rect:r,depth});if(n.visible===false)return;const children=(n.children??[]).map(x=>byId.get(x)).filter(Boolean);const mode=n.layout?.mode??'manual';if((mode==='hbox'||mode==='vbox')&&children.length){const p=n.layout?.padding??{},gap=n.layout?.gap??8,inner={x:r.x+(p.left??0),y:r.y+(p.top??0),width:r.width-(p.left??0)-(p.right??0),height:r.height-(p.top??0)-(p.bottom??0)},horizontal=mode==='hbox';const totalGap=gap*Math.max(0,children.length-1),fixed=children.reduce((s,c)=>s+(horizontal?(c.min_size?.width??0):(c.min_size?.height??0)),0),flex=children.reduce((s,c)=>s+(c.layout?.flex??1),0)||1,remain=Math.max(0,(horizontal?inner.width:inner.height)-fixed-totalGap);let cursor=horizontal?inner.x:inner.y;for(const c of children){const size=Math.round((horizontal?(c.min_size?.width??0):(c.min_size?.height??0))+remain*(c.layout?.flex??1)/flex);const cr=horizontal?{x:Math.round(cursor),y:Math.round(inner.y),width:size,height:Math.round(inner.height)}:{x:Math.round(inner.x),y:Math.round(cursor),width:Math.round(inner.width),height:size};rects[c.ui_node_id]=cr;resolved.push({...c,rect:cr,depth:depth+1});cursor+=size+gap;for(const gc of c.children??[])walk(gc,cr,depth+2);}return;}for(const c of children)walk(c.ui_node_id,r,depth+1);};
  walk(tree.root_id,rootRect);const visible=resolved.filter(n=>n.visible!==false);return seal({format:'reality-studio.ui-layout.v1.2',version:UI_INPUT_VERSION,ui_id:tree.ui_id,viewport:{width,height,safe_area},nodes:visible.sort((a,b)=>a.z_index-b.z_index||a.depth-b.depth),focus_order:visible.filter(n=>n.focus_mode!=='none'&&n.enabled!==false).sort((a,b)=>(a.navigation?.order??9999)-(b.navigation?.order??9999)||a.ui_node_id.localeCompare(b.ui_node_id)).map(n=>n.ui_node_id),source_ui_root:tree.ui_root},'layout_root');
}

export function hitTestUI(layout,x,y){return [...layout.nodes].reverse().find(n=>n.enabled!==false&&n.mouse_filter!=='ignore'&&x>=n.rect.x&&y>=n.rect.y&&x<=n.rect.x+n.rect.width&&y<=n.rect.y+n.rect.height)||null;}
export function routePointerEvent(layout,{type='pressed',x,y}={}){const n=hitTestUI(layout,x,y);return seal({format:'reality-studio.ui-event.v1.2',type,x,y,target_id:n?.ui_node_id??null,action:n?.events?.[type]??null,layout_root:layout.layout_root,handled:Boolean(n&&n.mouse_filter==='stop')},'event_root');}
export function moveUIFocus(layout,current,direction){const nodes=layout.nodes.filter(n=>layout.focus_order.includes(n.ui_node_id));if(!nodes.length)return null;const cur=nodes.find(n=>n.ui_node_id===current);if(!cur)return layout.focus_order[0];const explicit=cur.navigation?.[direction];if(explicit&&layout.focus_order.includes(explicit))return explicit;const cx=cur.rect.x+cur.rect.width/2,cy=cur.rect.y+cur.rect.height/2,candidates=nodes.filter(n=>n!==cur).map(n=>{const x=n.rect.x+n.rect.width/2,y=n.rect.y+n.rect.height/2,dx=x-cx,dy=y-cy,ok=direction==='left'?dx<0:direction==='right'?dx>0:direction==='up'?dy<0:dy>0;return{n,d:ok?Math.hypot(dx,dy)+(direction==='left'||direction==='right'?Math.abs(dy)*2:Math.abs(dx)*2):Infinity}}).sort((a,b)=>a.d-b.d);return Number.isFinite(candidates[0]?.d)?candidates[0].n.ui_node_id:current;}

const pressedSet=v=>new Set(Array.isArray(v)?v:Object.entries(v??{}).filter(([,x])=>x).map(([k])=>k));
function bindingStrength(binding,raw){if(binding.device==='keyboard')return pressedSet(raw.keys).has(binding.code)?1:0;if(binding.device==='mouse-button')return pressedSet(raw.mouse_buttons).has(String(binding.button))||pressedSet(raw.mouse_buttons).has(binding.button)?1:0;if(binding.device==='touch')return pressedSet(raw.touches).has(binding.node_id)?1:0;const gp=(raw.gamepads??[])[binding.gamepad??0];if(!gp)return 0;if(binding.device==='gamepad-button'){const b=gp.buttons?.[binding.button];return typeof b==='number'?b:(b?.value??(b?.pressed?1:0));}if(binding.device==='gamepad-axis'){const v=gp.axes?.[binding.axis]??0;return Math.max(0,(binding.direction??1)*v);}return 0;}
export class InputActionRuntime{
  constructor(profile=createDefaultInputProfile()){const v=validateInputProfile(profile);if(!v.valid)throw new StudioError('INPUT_PROFILE_INVALID','',v);this.profile=deep(profile);this.previous={};this.frame=0;this.last=null;}
  sample(raw={}){const actions={};for(const [name,a] of Object.entries(this.profile.actions)){let strength=0;for(const b of a.bindings??[])strength=Math.max(strength,bindingStrength(b,raw)*((b.scale_milli??1000)/1000));strength=clamp(strength,0,1);const strength_milli=Math.round(strength*1000),pressed=strength_milli>=(a.deadzone_milli??200),was=this.previous[name]?.pressed??false;actions[name]={strength_milli,pressed,just_pressed:pressed&&!was,just_released:!pressed&&was};}this.frame++;this.previous=deep(actions);this.last=seal({format:'reality-studio.input-frame.v1.2',version:UI_INPUT_VERSION,frame:this.frame,actions,devices:{keyboard:(raw.keys??[]).length>0,gamepad:(raw.gamepads??[]).length>0,touch:(raw.touches??[]).length>0},input_root:this.profile.input_root},'frame_root');return this.last;}
  actionBooleans(frame=this.last){return Object.fromEntries(Object.entries(frame?.actions??{}).map(([k,v])=>[k,Boolean(v.pressed)]));}
  rebind(action,binding,{replace=false}={}){if(!this.profile.actions[action])this.profile.actions[action]={deadzone_milli:200,bindings:[]};if(replace)this.profile.actions[action].bindings=[];this.profile.actions[action].bindings.push(deep(binding));const raw=deep(this.profile);delete raw.input_root;this.profile=seal(raw,'input_root');return this.profile;}
  reset(){this.previous={};this.frame=0;this.last=null;}
}

export function compileUIInputManifest({projectRoot,tree,profile,layout}={}){return seal({format:'reality-studio.ui-input-manifest.v1.2',version:UI_INPUT_VERSION,project_root:projectRoot,ui:{ui_id:tree.ui_id,ui_root:tree.ui_root,layout_root:layout.layout_root,scale_mode:tree.scale_mode},input:{profile_id:profile.profile_id,input_root:profile.input_root,actions:Object.keys(profile.actions)},capabilities:['ui.anchor-layout','ui.container-layout','ui.data-binding','ui.focus-navigation','input.keyboard','input.gamepad','input.touch','input.action-map','input.runtime-rebind']},'manifest_root');}
