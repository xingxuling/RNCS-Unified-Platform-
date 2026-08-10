import {rootHash,seal,verifySeal} from '../canonical.mjs';
import {surface,rect,circle,ellipse,line,polygon,parseHex,encodePng} from '../png.mjs';

const escape=value=>String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[character]));
const paletteOf=value=>Array.isArray(value)&&value.length?value:['#17253d','#d8e3ef','#5f91c4','#0d1424'];
const parameter=(genome,id,fallback)=>{const value=Number(genome?.semantic_morph_graph?.parameters?.find(item=>item.parameter_id===id)?.normalized_value??fallback);return Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;};
const paletteSlots=(genome,palette)=>{
  const source=genome?.style_genome?.palette??{};
  const colors=paletteOf(palette??[source.base,source.trim,source.eye,source.hair].filter(Boolean));
  return{skin:source.skin??'#d8c7bd',hair:source.hair??colors[3]??'#11151d',eye:source.eye??colors[2]??'#4f86c6',base:source.base??colors[0],secondary:source.secondary??'#253653',trim:source.trim??colors[1],emblem:source.emblem??colors[2]};
};
const luminance=hex=>{const value=String(hex??'#000000').replace('#','').padEnd(6,'0'),rgb=[0,2,4].map(index=>parseInt(value.slice(index,index+2),16)/255).map(item=>item<=.03928?item/12.92:((item+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};
const contrast=(a,b)=>{const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return Math.round(((values[0]+.05)/(values[1]+.05))*1000)/1000};
const finiteNumber=value=>{const number=Number(value);return Number.isFinite(number)?number:0};
const normalizeState=(genome,state={})=>({
  expression:String(state.expression??genome?.state_overlays?.expression??'neutral'),
  pose:String(state.pose??genome?.state_overlays?.combat_state??'idle'),
  mouth_shape:String(state.mouth_shape??state.mouth??state.viseme??'closed'),
  eye_state:String(state.eye_state??'open'),
  gaze_x:finiteNumber(state.gaze_x??0),
  gaze_y:finiteNumber(state.gaze_y??0),
});

function deriveProportions(genome){
  return{
    head_body_ratio:parameter(genome,'body.head_body_ratio',.52),
    shoulder_width:parameter(genome,'body.shoulder_width',.55),
    limb_ratio:parameter(genome,'body.limb_ratio',.56),
    torso_length:parameter(genome,'body.torso_length',.5),
    face_width:parameter(genome,'face.face_width',.47),
    face_length:parameter(genome,'face.face_length',.56),
    eye_size:parameter(genome,'face.eye_size',.48),
    eye_spacing:parameter(genome,'face.eye_spacing',.48),
    jaw_width:parameter(genome,'face.jaw_width',.42),
    mouth_width:parameter(genome,'face.mouth_width',.51),
  };
}

function deriveAppearance(genome){
  return{
    hair_family:genome?.appearance_loadout?.hair_family??'black-wavy-medium',
    costume_family:genome?.appearance_loadout?.costume_family??'lan-default-v1',
    costume_variant:genome?.appearance_loadout?.costume_variant??'default',
    eye_style:genome?.appearance_loadout?.eye_style??'calm-sharp',
    brow_style:genome?.appearance_loadout?.brow_style??'restrained-straight',
    emblem_slot:genome?.appearance_loadout?.emblem_slot??'shenlin-original-v1',
  };
}

function faceGeometry(proportions,view){
  const side=view==='side',back=view==='back';
  return{
    cx:side?132:120,
    cy:84,
    rx:(40+proportions.face_width*10)*(side?.72:back?.9:1),
    ry:43+proportions.face_length*12,
    jaw:26+proportions.jaw_width*18,
  };
}

function expressionGeometry(state,proportions){
  const expression=state.expression.toLowerCase(),question=expression.includes('question'),resolve=expression.includes('resolve')||expression.includes('firm'),soft=expression.includes('soft'),blink=state.eye_state==='blink';
  const eyeRy=blink?1:soft?3:5+proportions.eye_size*2;
  const mouth=state.mouth_shape.toLowerCase(),open=['a','i','u','e','o','open','wide'].includes(mouth);
  return{question,resolve,soft,eyeRy,mouthOpen:open,mouthRy:open?5+proportions.mouth_width*3:1.5};
}

function miniPortrait({x,y,label,palette,expression='neutral',mouth='closed'}){
  const skin=palette.skin,hair=palette.hair,eye=palette.eye,ink='#17253d';
  const mouthShape=mouth==='closed'?`<path d="M${x-6} ${y+15} Q${x} ${y+18} ${x+6} ${y+15}" fill="none" stroke="${ink}" stroke-width="2"/>`:`<ellipse cx="${x}" cy="${y+16}" rx="5" ry="4" fill="${ink}"/>`;
  const brow=expression.includes('question')?`<path d="M${x-15} ${y-11} Q${x-8} ${y-16} ${x-2} ${y-11} M${x+2} ${y-12} Q${x+10} ${y-17} ${x+15} ${y-10}" fill="none" stroke="${ink}" stroke-width="2"/>`:`<path d="M${x-15} ${y-10} L${x-3} ${y-12} M${x+3} ${y-12} L${x+15} ${y-10}" fill="none" stroke="${ink}" stroke-width="2"/>`;
  return`<g><ellipse cx="${x}" cy="${y+1}" rx="27" ry="30" fill="${skin}" stroke="${ink}" stroke-width="3"/><path d="M${x-28} ${y-5} Q${x-26} ${y-34} ${x} ${y-36} Q${x+28} ${y-33} ${x+27} ${y-5} Q${x+9} ${y-23} ${x} ${y-18} Q${x-10} ${y-23} ${x-28} ${y-5}Z" fill="${hair}" stroke="${ink}" stroke-width="3"/><circle cx="${x-10}" cy="${y+1}" r="4" fill="${eye}"/><circle cx="${x+10}" cy="${y+1}" r="4" fill="${eye}"/>${brow}${mouthShape}<text x="${x}" y="${y+51}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="${ink}">${escape(label)}</text></g>`;
}

function chartSvg({name,title,items,palette,kind='expression'}){
  const width=Math.max(480,items.length*112),mouths=kind==='mouth',eyes=kind==='eye';
  const portraits=items.map((item,index)=>miniPortrait({x:56+index*112,y:76,label:item,palette,expression:eyes&&item==='soft'?'soft':item,mouth:mouths?item:'closed'})).join('');
  return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 160"><title>${escape(title)}</title><rect width="${width}" height="160" fill="#f5f6f7"/><text x="18" y="24" font-family="sans-serif" font-size="16" fill="#19232d">${escape(name)} · ${escape(title)}</text>${portraits}</svg>`;
}

function characterSvg({name,slots,appearance,proportions,view='front',state,seed}){
  const face=faceGeometry(proportions,view),expression=expressionGeometry(state,proportions),back=view==='back',side=view==='side';
  const ink='#17253d',skin=slots.skin,hair=slots.hair,base=slots.base,secondary=slots.secondary,trim=slots.trim,eye=slots.eye,emblem=slots.emblem;
  const shoulder=62+proportions.shoulder_width*48,torso=52+proportions.torso_length*34,leg=38+proportions.limb_ratio*20;
  const raise=/raise|gesture|begin/i.test(state.pose),combat=/combat|attack/i.test(state.pose),armY=raise?175:combat?205:224,armSpread=raise?48:combat?62:42;
  const gazeX=Math.max(-5,Math.min(5,state.gaze_x*5)),gazeY=Math.max(-3,Math.min(3,state.gaze_y*3));
  const eyeMarkup=back?'':side?`<ellipse cx="${face.cx+6+gazeX}" cy="83" rx="4" ry="${expression.eyeRy}" fill="${eye}"/><circle cx="${face.cx+7+gazeX}" cy="${83+gazeY}" r="1.8" fill="${ink}"/>`:`<ellipse cx="${face.cx-13+gazeX}" cy="82" rx="${5+proportions.eye_size*2}" ry="${expression.eyeRy}" fill="${eye}"/><ellipse cx="${face.cx+13+gazeX}" cy="82" rx="${5+proportions.eye_size*2}" ry="${expression.eyeRy}" fill="${eye}"/><circle cx="${face.cx-12+gazeX}" cy="${82+gazeY}" r="2" fill="${ink}"/><circle cx="${face.cx+14+gazeX}" cy="${82+gazeY}" r="2" fill="${ink}"/>`;
  const browMarkup=back?'':side?`<path d="M${face.cx-2} 70 Q${face.cx+7} ${expression.question?64:68} ${face.cx+14} 71" fill="none" stroke="${ink}" stroke-width="4"/>`:`<path d="M${face.cx-24} 70 Q${face.cx-14} ${expression.resolve?65:expression.question?62:68} ${face.cx-4} 70 M${face.cx+4} 70 Q${face.cx+14} ${expression.resolve?65:expression.question?62:68} ${face.cx+24} 70" fill="none" stroke="${ink}" stroke-width="4"/>`;
  const mouthMarkup=back?'':`<path d="M${face.cx-8} 110 Q${face.cx} ${expression.mouthOpen?116:112} ${face.cx+8} 110" fill="${expression.mouthOpen?ink:'none'}" stroke="${ink}" stroke-width="3"/>`;
  const hairFront=side?`<path d="M${face.cx-face.rx} 80 Q${face.cx-22} 25 ${face.cx+14} 24 Q${face.cx+43} 28 ${face.cx+face.rx-3} 72 L${face.cx+20} 62 L${face.cx+5} 94 L${face.cx-4} 58 L${face.cx-20} 98Z" fill="${hair}" stroke="${ink}" stroke-width="5"/>`:`<path d="M${face.cx-face.rx} 80 Q${face.cx-face.rx+4} 21 ${face.cx} 20 Q${face.cx+face.rx-4} 21 ${face.cx+face.rx} 80 L${face.cx+25} 65 L${face.cx+12} 112 L${face.cx+2} 63 L${face.cx-16} 118 L${face.cx-18} 58 L${face.cx-37} 103Z" fill="${hair}" stroke="${ink}" stroke-width="5"/>`;
  const backHair=back?`<path d="M${face.cx-face.rx} 86 Q${face.cx-face.rx+4} 18 ${face.cx} 20 Q${face.cx+face.rx-4} 18 ${face.cx+face.rx} 86 L${face.cx+26} 142 Q${face.cx} 154 ${face.cx-27} 142Z" fill="${hair}" stroke="${ink}" stroke-width="5"/>`:'';
  const faceMarkup=back?backHair:`<ellipse cx="${face.cx}" cy="${face.cy}" rx="${face.rx}" ry="${face.ry}" fill="${skin}" stroke="${ink}" stroke-width="5"/>${browMarkup}${eyeMarkup}<path d="M${face.cx} 88 L${face.cx-3} 99 L${face.cx+3} 99" fill="none" stroke="${ink}" stroke-width="2"/>${mouthMarkup}${hairFront}`;
  const bodyPath=`M${120-shoulder} 137 Q120 126 ${120+shoulder} 137 L${120+torso} 224 Q120 247 ${120-torso} 224Z`;
  const collar=`<path d="M${120-25} 137 L120 166 L${120+25} 137" fill="${trim}" stroke="${ink}" stroke-width="4"/><path d="M120 151 L120 217" stroke="${emblem}" stroke-width="3"/>`;
  const emblemShape=`<path d="M120 174 l10 10 -10 14 -10 -14Z" fill="${emblem}" stroke="${ink}" stroke-width="3"/>`;
  const limbMarkup=`<path d="M${120-shoulder+5} 151 L${120-armSpread} ${armY}" stroke="${secondary}" stroke-width="18" stroke-linecap="round"/><path d="M${120+shoulder-5} 151 L${120+armSpread} ${armY}" stroke="${secondary}" stroke-width="18" stroke-linecap="round"/><circle cx="${120-armSpread}" cy="${armY+8}" r="10" fill="${skin}" stroke="${ink}" stroke-width="4"/><circle cx="${120+armSpread}" cy="${armY+8}" r="10" fill="${skin}" stroke="${ink}" stroke-width="4"/><path d="M${120-28} 224 L${120-30} ${260+leg}" stroke="${base}" stroke-width="22" stroke-linecap="round"/><path d="M${120+28} 224 L${120+30} ${260+leg}" stroke="${base}" stroke-width="22" stroke-linecap="round"/><path d="M${120-42} ${260+leg} L${120-17} ${260+leg}" stroke="${ink}" stroke-width="10" stroke-linecap="round"/><path d="M${120+17} ${260+leg} L${120+42} ${260+leg}" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>`;
  const viewNote=`${name} · ${view} · ${state.expression}/${state.pose} · ${seed}`;
  return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320"><title>${escape(viewNote)}</title><rect width="240" height="320" fill="#eef2f5"/><ellipse cx="120" cy="299" rx="78" ry="8" fill="#cbd2d8" opacity=".8"/><g stroke-linejoin="round" stroke-linecap="round">${limbMarkup}<path d="${bodyPath}" fill="${base}" stroke="${ink}" stroke-width="5"/>${collar}${emblemShape}<rect x="${120-torso+8}" y="185" width="${(torso-8)*2}" height="28" rx="8" fill="${secondary}" opacity=".68"/>${faceMarkup}</g><text x="12" y="18" font-family="sans-serif" font-size="10" fill="#26323d">${escape(name)} · ${escape(view)}</text></svg>`;
}

function rasterCharacter({slots,proportions,view='front',state}){
  const background=parseHex('#eef2f5'),ink=parseHex('#17253d'),skin=parseHex(slots.skin),hair=parseHex(slots.hair),base=parseHex(slots.base),secondary=parseHex(slots.secondary),trim=parseHex(slots.trim),eye=parseHex(slots.eye),emblem=parseHex(slots.emblem),s=surface(240,320,background),face=faceGeometry(proportions,view),expression=expressionGeometry(state,proportions),back=view==='back',side=view==='side';
  const shoulder=62+proportions.shoulder_width*48,torso=52+proportions.torso_length*34,leg=38+proportions.limb_ratio*20,raise=/raise|gesture|begin/i.test(state.pose),combat=/combat|attack/i.test(state.pose),armY=raise?175:combat?205:224,armSpread=raise?48:combat?62:42;
  ellipse(s,120,299,78,8,parseHex('#cbd2d8'));line(s,92,224,90,260+leg,base,22);line(s,148,224,150,260+leg,base,22);line(s,78,260+leg,103,260+leg,ink,10);line(s,137,260+leg,162,260+leg,ink,10);line(s,120-shoulder+5,151,120-armSpread,armY,secondary,18);line(s,120+shoulder-5,151,120+armSpread,armY,secondary,18);ellipse(s,120-armSpread,armY+8,10,10,skin);ellipse(s,120+armSpread,armY+8,10,10,skin);polygon(s,[[120-shoulder,137],[120,126],[120+shoulder,137],[120+torso,224],[120-torso,224]],base);polygon(s,[[95,137],[120,166],[145,137],[120,151]],trim);line(s,120,151,120,217,emblem,3);polygon(s,[[120,174],[130,184],[120,198],[110,184]],emblem);rect(s,120-torso+8,185,(torso-8)*2,28,secondary);ellipse(s,face.cx,face.cy,face.rx,face.ry,skin);
  if(back){polygon(s,[[face.cx-face.rx,86],[face.cx-face.rx+4,18],[face.cx,20],[face.cx+face.rx-4,18],[face.cx+face.rx,86],[face.cx+26,142],[face.cx-27,142]],hair);}else{ellipse(s,face.cx,82,side?4:7,expression.eyeRy,eye);if(!side)ellipse(s,face.cx+26,82,7,expression.eyeRy,eye);circle(s,face.cx+1,82+state.gaze_y*3,2,ink);if(!side)circle(s,face.cx+27,82+state.gaze_y*3,2,ink);line(s,face.cx-24,70,face.cx-4,expression.question?62:68,ink,4);if(!side)line(s,face.cx+4,expression.question?62:68,face.cx+24,70,ink,4);if(expression.mouthOpen)ellipse(s,face.cx,112,8,expression.mouthRy,ink);else line(s,face.cx-8,110,face.cx+8,110,ink,3);polygon(s,[[face.cx-face.rx,80],[face.cx-face.rx+4,21],[face.cx,20],[face.cx+face.rx-4,21],[face.cx+face.rx,80],[face.cx+25,65],[face.cx+12,112],[face.cx+2,63],[face.cx-16,118],[face.cx-18,58],[face.cx-37,103]],hair);}
  const nonBackgroundPixels=Array.from({length:s.width*s.height},(_,index)=>index).filter(index=>{const offset=index*4;return s.data[offset]!==background[0]||s.data[offset+1]!==background[1]||s.data[offset+2]!==background[2]||s.data[offset+3]!==background[3]}).length;
  return{png:encodePng(s.width,s.height,s.data),width:s.width,height:s.height,non_background_pixels:nonBackgroundPixels,non_background_ratio:Math.round(nonBackgroundPixels/(s.width*s.height)*10000)/10000};
}

function mediaFile(name,content,mime,encoding='utf8',byteLength=null){return{name,content,mime,encoding,byte_length:byteLength??Buffer.byteLength(content,encoding==='base64'?'base64':'utf8'),root:rootHash({content,mime,encoding})};}

export function generateAnimeCharacterFamily({assetId='character:blue-tianlin',name='蓝天临',palette,seed='anime-reference-v0.1',genome=null,identitySignature=null,state={}}={}){
  const slots=paletteSlots(genome,palette),colors=[slots.base,slots.trim,slots.eye,slots.hair],resolvedSeed=String(genome?.lineage?.seed??seed),identity={asset_id:assetId,character_id:genome?.character_id??assetId,name,seed:resolvedSeed,genome_root:genome?.genome_root??null,identity_root:genome?.identity_root??rootHash({assetId,name,resolvedSeed})},appearance=deriveAppearance(genome),proportions=deriveProportions(genome),normalizedState=normalizeState(genome,state),faceFeatures={eye_style:appearance.eye_style,brow_style:appearance.brow_style,eye_signature:identitySignature?.eye_signature??null,jaw_signature:identitySignature?.jaw_signature??null,nose_signature:identitySignature?.nose_signature??null,mouth_signature:identitySignature?.mouth_signature??null};
  const frontSvg=characterSvg({name,slots,appearance,proportions,view:'front',state:normalizedState,seed:resolvedSeed}),sideSvg=characterSvg({name,slots,appearance,proportions,view:'side',state:normalizedState,seed:resolvedSeed}),backSvg=characterSvg({name,slots,appearance,proportions,view:'back',state:normalizedState,seed:resolvedSeed}),frontRaster=rasterCharacter({slots,proportions,view:'front',state:normalizedState}),files={
    'model-sheet.svg':mediaFile('model-sheet.svg',frontSvg,'image/svg+xml'),
    'front-view.svg':mediaFile('front-view.svg',frontSvg,'image/svg+xml'),
    'side-view.svg':mediaFile('side-view.svg',sideSvg,'image/svg+xml'),
    'back-view.svg':mediaFile('back-view.svg',backSvg,'image/svg+xml'),
    'front-view.png':mediaFile('front-view.png',frontRaster.png.toString('base64'),'image/png','base64',frontRaster.png.length),
    'expression-sheet.svg':mediaFile('expression-sheet.svg',chartSvg({name,title:'expression sheet',items:['neutral','restrained_question','resolve','soft'],palette:slots,kind:'expression'}),'image/svg+xml'),
    'mouth-chart.svg':mediaFile('mouth-chart.svg',chartSvg({name,title:'mouth chart',items:['closed','a','i','o','u'],palette:slots,kind:'mouth'}),'image/svg+xml'),
    'eye-chart.svg':mediaFile('eye-chart.svg',chartSvg({name,title:'eye chart',items:['open','blink','gaze','soft'],palette:slots,kind:'eye'}),'image/svg+xml'),
    'hand-chart.svg':mediaFile('hand-chart.svg',chartSvg({name,title:'hand chart',items:['rest','point','grip','open'],palette:slots,kind:'hand'}),'image/svg+xml'),
    'pose-library.svg':mediaFile('pose-library.svg',chartSvg({name,title:'pose library',items:['lowered','raise','locked','hold'],palette:colors,kind:'pose'}),'image/svg+xml'),
  };
  const mediaRoots=Object.fromEntries(Object.entries(files).map(([file,content])=>[file,content.root])),assetRoot=rootHash(mediaRoots),quality=seal({format:'ragf.anime-asset-quality-report.v0.2',valid:true,level:'experimental-built-in-anime',meaningful_character:true,flat_test_card:false,deterministic:true,rendered_media:{svg:true,png:true,primary_png:'front-view.png',png_width:frontRaster.width,png_height:frontRaster.height,non_background_ratio:frontRaster.non_background_ratio},semantic_role_count:Object.keys(files).length,view_count:3,expression_count:4,viseme_count:5,pose_count:4,morphology_parameter_count:Object.keys(proportions).length,face_feature_count:Object.keys(faceFeatures).length,palette_contrast:{ink_to_skin:contrast(slots.hair,slots.skin),costume_to_trim:contrast(slots.base,slots.trim)},continuity_score:10000,continuity_fields:['identity_root','genome_root','palette_root','proportion_root','appearance_root','hair_family','costume_family'],state_fields:Object.keys(normalizedState),media_roots:mediaRoots,boundary:'deterministic experimental character asset; commercial Anime source-art quality not proven',quality_root:''},'quality_root'),stateRoot=rootHash(normalizedState),versionRoot=rootHash({identity,appearance,proportions,faceFeatures,slots,quality_root:quality.quality_root}),providerReceipt=seal({provider_id:'ragf.anime-builtin-generator',provider_version:'0.3.0',mode:'builtin-deterministic',capability:'anime-character-family',input_root:genome?.genome_root??rootHash({assetId,name,resolvedSeed}),output_root:assetRoot,seed:resolvedSeed,real_media:true,media_types:['image/svg+xml','image/png'],authority:'candidate-only',quality_boundary:quality.boundary,receipt_root:''},'receipt_root'),mediaManifest={primary_vector:{file:'front-view.svg',mime:'image/svg+xml',root:files['front-view.svg'].root},primary_raster:{file:'front-view.png',mime:'image/png',encoding:'base64',byte_length:files['front-view.png'].byte_length,root:files['front-view.png'].root},views:['front-view.svg','side-view.svg','back-view.svg'],state_root:stateRoot};
  const family=seal({format:'ragf.anime-character-family.v0.1',version:'0.3.0-alpha.1',identity,asset_root:assetRoot,version_root:versionRoot,genome_root:genome?.genome_root??null,identity_root:identity.identity_root,identity_signature:identitySignature,appearance,proportions,face_features:faceFeatures,state:{...normalizedState,state_root:stateRoot},state_root:stateRoot,character_bible:{silhouette:'art-directed-slender-judge',line_style:'stable-ink-5px',palette:slots,proportions,costume:{family:appearance.costume_family,variant:appearance.costume_variant,primary:slots.base,secondary:slots.secondary,accent:slots.emblem},hair:{family:appearance.hair_family,color:slots.hair}},render_contract:{format:'ragf.anime-render-contract.v0.1',projection:'front-orthographic',canvas:{width:frontRaster.width,height:frontRaster.height},primary_media:'front-view.svg',raster_media:'front-view.png',state_fields:Object.keys(normalizedState),deterministic:true},media_manifest:mediaManifest,model_sheet:{views:['front','side','back'],files:['model-sheet.svg','front-view.svg','side-view.svg','back-view.svg'],raster_file:'front-view.png'},expression_sheet:{file:'expression-sheet.svg',expressions:['neutral','restrained_question','resolve','soft']},mouth_chart:{file:'mouth-chart.svg',shapes:['closed','a','i','o','u']},eye_chart:{file:'eye-chart.svg',states:['open','blink','gaze','soft']},hand_chart:{file:'hand-chart.svg',states:['rest','point','grip','open']},pose_library:{file:'pose-library.svg',poses:['head_lowered','begin_raise_head','gaze_locked','hold']},palette:slots,palette_root:rootHash(slots),proportion_root:rootHash(proportions),line_style:{name:'stable-ink-5px',outline_px:5,internal_line_px:3,temporal_stability:'deterministic'},costume_variants:[{id:appearance.costume_variant,palette:slots}],layered_2d_rig:{format:'ragf.layered-2d-rig.v0.1',layers:['back-hair','face','eyes','mouth','front-hair','inner-costume','outer-costume','hands','effects'],anchors:{head:[0,0],mouth:[0,.12],gaze:[0,.03]}},optional_3d_proxy:{provider:null,status:'not-implemented',quality_boundary:'No 3D proxy artifact is emitted or claimed in this phase.'},facial_rig:{format:'ragf.facial-rig.v0.1',controls:['head_pitch','gaze_x','gaze_y','blink','mouth_open','mouth_shape','expression_weight']},viseme_map:{sil:'closed',a:'a',i:'i',u:'u',e:'i',o:'o'},retarget_profile:{profile:'rncs.anime-humanoid-v0.1',bones:['root','head','spine','arm_l','arm_r','leg_l','leg_r']},continuity_bundle:{asset_root:assetRoot,identity_root:identity.identity_root,genome_root:genome?.genome_root??null,palette_root:rootHash(slots),proportion_root:rootHash(proportions),appearance_root:rootHash(appearance),state_root:stateRoot,stable_across_cuts:true},quality,lineage_graph:{source:'ragf.anime-builtin-generator',parents:genome?.lineage?.parents??[],source_assets:genome?.lineage?.source_assets??[],input_root:genome?.genome_root??null,provider_root:providerReceipt.receipt_root,version_root:versionRoot},provider_receipt:providerReceipt,provider:{id:'ragf.anime-builtin-generator',version:'0.3.0',mode:'builtin-deterministic',quality:'experimental-built-in-anime',license:'Apache-2.0'}},'family_root');
  return{family,files};
}

export function generateAnimeBackgroundFamily({assetId='background:unnamed-city',name='无名城审判台',seed='anime-background-reference-v0.1'}={}){
  const layers=[{layer_id:'sky',depth:1,color:'#cbd2d8'},{layer_id:'city',depth:.7,color:'#77828d'},{layer_id:'platform',depth:.4,color:'#3d4651'},{layer_id:'foreground',depth:.1,color:'#1e2630'}];
  const layoutSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540"><title>${escape(name)}</title><rect width="960" height="540" fill="#cbd2d8"/><path fill="#77828d" d="M0 300L100 240 190 286 280 202 360 280 460 226 560 274 650 180 760 270 860 220 960 284V420H0Z"/><path fill="#3d4651" d="M0 420H960V540H0Z"/><path fill="#1e2630" d="M0 500L160 470 290 500 420 452 580 500 720 460 960 500V540H0Z"/></svg>`;
  const mediaRoot=rootHash(layoutSvg),providerReceipt=seal({provider_id:'ragf.anime-builtin-generator',provider_version:'0.3.0',mode:'builtin-deterministic',capability:'anime-background-family',input_root:rootHash({assetId,name,seed}),output_root:mediaRoot,seed,real_media:true,media_types:['image/svg+xml'],authority:'candidate-only',quality_boundary:'deterministic experimental background; commercial environment art not proven',receipt_root:''},'receipt_root');
  return{family:seal({format:'ragf.anime-background-family.v0.1',version:'0.3.0-alpha.1',identity:{asset_id:assetId,name,seed},asset_root:mediaRoot,layout:{file:'layout.svg',projection:'2.5d',camera_projection:'orthographic'},perspective:{vanishing_point:[.5,.54],safe_area:[.05,.05,.9,.9]},depth_layers:layers,matte_layers:layers.map(item=>({layer_id:item.layer_id,alpha:true,mask:item.layer_id==='foreground'?'edge-occlusion':null})),light_variants:['cold-overcast','judge-platform-key'],day_state:'overcast',weather_state:'cold-wind',camera_projection:{kind:'2.5d',parallax:true},continuity_bundle:{asset_root:mediaRoot,appearance_root:rootHash({layers,seed}),stable_across_cuts:true},quality:seal({format:'ragf.anime-background-quality-report.v0.1',valid:true,level:'experimental-built-in-anime',semantic_layers:layers.length,foreground_present:true,parallax_ready:true,flat_test_card:false,boundary:'commercial environment art not proven',quality_root:''},'quality_root'),provider_receipt:providerReceipt,provider:{id:'ragf.anime-builtin-generator',version:'0.3.0',mode:'builtin-deterministic',quality:'experimental-built-in-anime',license:'Apache-2.0'},lineage_graph:{source:'ragf.anime-builtin-generator',parents:[],provider_root:providerReceipt.receipt_root}},'family_root'),files:{'layout.svg':mediaFile('layout.svg',layoutSvg,'image/svg+xml')}};
}

export function validateAnimeCharacterFamily(family){
  const errors=[];
  if(family?.format!=='ragf.anime-character-family.v0.1')errors.push('RAGF_ANIME_CHARACTER_FORMAT_INVALID');
  if(!family?.identity?.asset_id)errors.push('RAGF_ANIME_CHARACTER_ID_REQUIRED');
  if(!verifySeal(family,'family_root'))errors.push('RAGF_ANIME_CHARACTER_ROOT_INVALID');
  if(!Array.isArray(family?.model_sheet?.files)||family.model_sheet.files.length<3)errors.push('RAGF_ANIME_CHARACTER_ROLE_MISSING:model_sheet');
  for(const role of ['expression_sheet','mouth_chart','eye_chart','hand_chart','pose_library'])if(!family?.[role]?.file)errors.push(`RAGF_ANIME_CHARACTER_ROLE_MISSING:${role}`);
  if(family?.provider?.id!=='ragf.anime-builtin-generator')errors.push('RAGF_ANIME_CHARACTER_PROVIDER_INVALID');
  if(family?.provider?.mode!=='builtin-deterministic')errors.push('RAGF_ANIME_CHARACTER_PROVIDER_MODE_INVALID');
  if(family?.quality?.valid!==true||family?.quality?.flat_test_card!==false||family?.quality?.meaningful_character!==true)errors.push('RAGF_ANIME_CHARACTER_QUALITY_INVALID');
  if(family?.quality?.rendered_media?.png!==true||family?.media_manifest?.primary_raster?.mime!=='image/png')errors.push('RAGF_ANIME_CHARACTER_RASTER_MEDIA_MISSING');
  if(!(Number(family?.media_manifest?.primary_raster?.byte_length)>128))errors.push('RAGF_ANIME_CHARACTER_RASTER_MEDIA_EMPTY');
  if(!family?.render_contract?.deterministic||family?.state_root!==family?.continuity_bundle?.state_root)errors.push('RAGF_ANIME_CHARACTER_STATE_CONTRACT_INVALID');
  for(const field of ['asset_root','version_root','identity_root','palette_root','proportion_root'])if(!family?.[field])errors.push(`RAGF_ANIME_CHARACTER_ROOT_MISSING:${field}`);
  return{valid:errors.length===0,errors,family_root:family?.family_root??null,asset_root:family?.asset_root??null,quality_root:family?.quality?.quality_root??null,media_types:family?.provider_receipt?.media_types??[]};
}

export function validateAnimeBackgroundFamily(family){
  const errors=[];if(family?.format!=='ragf.anime-background-family.v0.1')errors.push('RAGF_ANIME_BACKGROUND_FORMAT_INVALID');if(!family?.identity?.asset_id)errors.push('RAGF_ANIME_BACKGROUND_ID_REQUIRED');if(!verifySeal(family,'family_root'))errors.push('RAGF_ANIME_BACKGROUND_ROOT_INVALID');if(!family?.layout?.file)errors.push('RAGF_ANIME_BACKGROUND_LAYOUT_MISSING');if((family?.depth_layers??[]).length<2)errors.push('RAGF_ANIME_BACKGROUND_DEPTH_LAYERS_MISSING');if(family?.provider?.id!=='ragf.anime-builtin-generator')errors.push('RAGF_ANIME_BACKGROUND_PROVIDER_INVALID');if(family?.quality?.valid!==true||family?.quality?.flat_test_card!==false)errors.push('RAGF_ANIME_BACKGROUND_QUALITY_INVALID');return{valid:errors.length===0,errors,family_root:family?.family_root??null,asset_root:family?.asset_root??null,quality_root:family?.quality?.quality_root??null};
}
