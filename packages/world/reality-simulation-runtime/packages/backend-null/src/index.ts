import { semanticHash, type VSRDisplayState, type VSRPaint, type VSRRect } from '../../spec/src/index.js';

export type VSRDrawCommand =
  | { op:'background'; paint?:VSRPaint; viewport:VSRRect }
  | { op:'item'; nodeId:string; type:string; bounds:VSRRect; opacity:number; appearance:unknown; content:unknown; transform:number[]; clips:unknown[] };
export interface VSRNullRenderResult { commands:VSRDrawCommand[]; commandHash:string; itemCount:number; bounds:VSRRect }

export class VSRNullBackend {
  readonly id='null'; readonly version='0.1.0-alpha.5';
  readonly capabilities={text:true,images:false,vectorPaths:true,gradients:true,shadows:true,clipping:true,blendModes:['source-over'],filters:[],videoTextures:false,shaders:false,compute:false,threeDimensional:false,hdr:false,captureFormats:['json']};
  render(state:VSRDisplayState):VSRNullRenderResult {
    const commands:VSRDrawCommand[]=[{op:'background',paint:state.background,viewport:{x:0,y:0,width:state.viewport.width,height:state.viewport.height}}];
    for(const item of state.items)commands.push({op:'item',nodeId:item.nodeId,type:item.type,bounds:item.localBounds,opacity:item.opacity,appearance:item.appearance,content:item.content,transform:item.worldTransform,clips:item.clipStack??[]});
    return {commands,commandHash:semanticHash(commands),itemCount:state.items.length,bounds:{x:0,y:0,width:state.viewport.width,height:state.viewport.height}};
  }
}
