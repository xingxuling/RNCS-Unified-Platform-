import {createHash} from 'node:crypto';

export const VSR_ANIME_RENDERING_PROFILE_FORMAT='vsr.anime-rendering-profile.v0.1';
export const VSR_ANIME_RENDERING_PROFILE_VERSION='0.1.0-alpha.1';

function normalize(value){
  if(value===null||typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?(Object.is(value,-0)?0:value):null;
  if(Array.isArray(value))return value.map(normalize);
  if(value&&typeof value==='object'){const out={};for(const key of Object.keys(value).sort())if(value[key]!==undefined)out[key]=normalize(value[key]);return out}
  return String(value);
}
const rootHash=value=>createHash('sha256').update(JSON.stringify(normalize(value))).digest('hex');
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function createAnimeRenderingProfile({profileId='anime-reference',fps=24,resolution={width:1920,height:1080},style='japanese_tv_anime',quality='anime-tv-reference-v0.1',lineStability='fixed-stroke-raster'}={}){
  const profile={format:VSR_ANIME_RENDERING_PROFILE_FORMAT,version:VSR_ANIME_RENDERING_PROFILE_VERSION,profile_id:profileId,style,quality_boundary:quality,coordinate_space:'anime-canvas-960x540',projection:{kind:'native-2d-and-2.5d',resolution,parallax_layers:true,depth_order:'background-character-effects-composite'},camera:{lens_units:'mm',angle_units:'degrees',dolly_units:'normalized',pan_units:'normalized',easing:'stepped-or-explicit'},line:{stability:lineStability,stroke_model:'fixed-width',shadow_bands:3,anti_aliasing:'deterministic'},exposure:{fps,implicit_interpolation:false,default_policy:'on_twos'},compositing:{premultiplied_alpha:false,layer_order:['background','character','secondary-motion','effects','lighting','correction'],color_space:'srgb'},authority:{source:'RNCS',external_provider_required:false,mode:'reference'}};
  return{...profile,profile_root:rootHash(profile)};
}

export function resolveAnimeCamera(profile,cameraTrack=[],{frame=0,totalFrames=1}={}){
  const active=[...(cameraTrack??[])].filter(item=>Number(item.start_frame??item.start??0)<=frame);
  const latest=(kind,fallback={})=>active.filter(item=>item.kind===kind).sort((a,b)=>Number(a.start_frame??a.start??0)-Number(b.start_frame??b.start??0)).at(-1)??fallback;
  const lens=latest('lens'),angle=latest('angle'),dolly=latest('dolly_in'),pan=latest('pan'),progress=clamp(frame/Math.max(1,totalFrames-1),0,1);
  const durationStart=Number(dolly.start_frame??dolly.start??0),durationEnd=Number(dolly.end_frame??dolly.end??totalFrames-1),local=clamp((frame-durationStart)/Math.max(1,durationEnd-durationStart),0,1);
  const eased=dolly.easing==='ease_in_out'?(local*local*(3-2*local)):local;
  return{lens_mm:Number(lens.lens_mm??lens.lens??55),angle_deg:Number(angle.angle_deg??angle.angle??0),dolly:Number(dolly.dolly??0)*eased,x:Number(pan.x??pan.pan_x??0)*clamp((frame-Number(pan.start_frame??pan.start??0))/Math.max(1,Number(pan.end_frame??pan.end??totalFrames-1)-Number(pan.start_frame??pan.start??0)),0,1),y:Number(pan.y??pan.pan_y??0),easing:dolly.easing??pan.easing??'linear',frame,profile_root:profile?.profile_root??null};
}

export function createAnimeRenderReceipt({profile,frameNumber,width,height,backend='deterministic-native-2d',inputRoot,outputRoot,animationPolicy}={}){
  const receipt={format:'vsr.anime-render-receipt.v0.1',version:'0.1.0-alpha.1',profile_root:profile?.profile_root??null,frame_number:frameNumber,width,height,backend,input_root:inputRoot??null,output_root:outputRoot??null,animation_policy:animationPolicy??null,authority:'candidate',quality_boundary:'reference profile; external GPU/provider evidence required for production parity'};
  return{...receipt,receipt_root:rootHash(receipt)};
}

export function validateAnimeRenderingProfile(profile){
  const errors=[];if(profile?.format!==VSR_ANIME_RENDERING_PROFILE_FORMAT)errors.push('VSR_ANIME_PROFILE_FORMAT_INVALID');if(profile?.version!==VSR_ANIME_RENDERING_PROFILE_VERSION)errors.push('VSR_ANIME_PROFILE_VERSION_INVALID');if(!profile?.profile_root)errors.push('VSR_ANIME_PROFILE_ROOT_MISSING');if(profile?.line?.stability!=='fixed-stroke-raster')errors.push('VSR_ANIME_LINE_STABILITY_INVALID');if(profile?.exposure?.implicit_interpolation!==false)errors.push('VSR_ANIME_IMPLICIT_INTERPOLATION_ENABLED');return{valid:errors.length===0,errors,profile_root:profile?.profile_root??null};
}
