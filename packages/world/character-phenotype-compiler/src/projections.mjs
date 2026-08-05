import {encodePng,parseHex,surface,pixel} from '../../reality-asset-genesis-fabric/src/png.mjs';
import {rootHash,seal} from '../../reality-asset-genesis-fabric/src/canonical.mjs';
import {EXPRESSION_MORPHS,EYE_STATES,VISEME_MORPHS,getCostumeFamily,getHairFamily} from '../../character-genome-runtime/src/index.mjs';

const TAU=Math.PI*2;
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
const param=(genome,id)=>genome.semantic_morph_graph.parameters.find(item=>item.parameter_id===id)?.normalized_value??.5;
const color=(hex,alpha=255)=>{const value=parseHex(hex);value[3]=alpha;return value};

function ellipse(target,cx,cy,rx,ry,rgba){for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)pixel(target,x,y,rgba)}
function rectangle(target,x,y,width,height,rgba){for(let yy=Math.floor(y);yy<Math.ceil(y+height);yy++)for(let xx=Math.floor(x);xx<Math.ceil(x+width);xx++)pixel(target,xx,yy,rgba)}
function polygon(target,points,rgba){
  const minY=Math.max(0,Math.floor(Math.min(...points.map(point=>point[1])))),maxY=Math.min(target.height-1,Math.ceil(Math.max(...points.map(point=>point[1]))));
  for(let y=minY;y<=maxY;y++){
    const intersections=[];
    for(let index=0;index<points.length;index++){
      const a=points[index],b=points[(index+1)%points.length];
      if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))intersections.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));
    }
    intersections.sort((a,b)=>a-b);
    for(let index=0;index<intersections.length;index+=2)for(let x=Math.ceil(intersections[index]);x<=Math.floor(intersections[index+1]??intersections[index]);x++)pixel(target,x,y,rgba);
  }
}
function line(target,a,b,width,rgba){const distance=Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1])),steps=Math.ceil(distance/Math.max(1,width*.35));for(let index=0;index<=steps;index++){const t=index/steps;ellipse(target,a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,width/2,width/2,rgba)}}
function polyline(target,points,width,rgba,closed=false){for(let index=0;index<points.length-1;index++)line(target,points[index],points[index+1],width,rgba);if(closed)line(target,points.at(-1),points[0],width,rgba)}
function ellipseOutline(target,cx,cy,rx,ry,width,rgba){const points=[];for(let index=0;index<=96;index++){const angle=index/96*TAU;points.push([cx+Math.cos(angle)*rx,cy+Math.sin(angle)*ry])}polyline(target,points,width,rgba)}
function downsample(source,scale){const width=Math.floor(source.width/scale),height=Math.floor(source.height/scale),out=surface(width,height,[0,0,0,0]);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const sum=[0,0,0,0];for(let yy=0;yy<scale;yy++)for(let xx=0;xx<scale;xx++){const offset=((y*scale+yy)*source.width+x*scale+xx)*4;for(let channel=0;channel<4;channel++)sum[channel]+=source.data[offset+channel]}pixel(out,x,y,sum.map(value=>Math.round(value/(scale*scale))))}return out}

function emblemPath(id){if(id==='taowind-line-v1')return'M0 -14 L12 -2 L4 14 L-12 5 Z';if(id==='blue-axis-v1')return'M0 -15 L5 -3 L15 0 L5 3 L0 15 L-5 3 L-15 0 L-5 -3 Z';return'M0 -15 L13 0 L0 15 L-13 0 Z M0 -7 L6 0 L0 7 L-6 0 Z'}
function silhouette(genome,{view='front',expression='neutral'}={}){
  const palette=genome.style_genome.palette,headRatio=6.95+(param(genome,'body.head_body_ratio')-.35)*1.3,headH=248/headRatio,headW=headH*(.66+(param(genome,'face.face_width')-.5)*.18),shoulder=65+(param(genome,'body.shoulder_width')-.5)*22,side=view==='side',back=view==='back',eyeSpacing=headW*(.21+(param(genome,'face.eye_spacing')-.5)*.08),mouthWidth=headW*(.26+(param(genome,'face.mouth_width')-.5)*.12),hair=getHairFamily(genome.appearance_loadout.hair_family),costume=getCostumeFamily(genome.appearance_loadout.costume_family),faceX=120,faceY=52;
  const eyeMarkup=back?'':side?`<path d="M120 ${faceY+headH*.46} l${headW*.22} 0"/>`:`<path d="M${faceX-eyeSpacing-headW*.1} ${faceY+headH*.45} q${headW*.1} ${expression==='calm'?2:-1} ${headW*.2} 0 M${faceX+eyeSpacing-headW*.1} ${faceY+headH*.45} q${headW*.1} ${expression==='calm'?2:-1} ${headW*.2} 0"/>`;
  const mouth=back?'':`<path d="M${faceX-mouthWidth/2} ${faceY+headH*.7} Q120 ${faceY+headH*(expression==='restrained_smile'?.76:expression==='sad'?.66:.7)} ${faceX+mouthWidth/2} ${faceY+headH*.7}"/>`;
  const hairTail=hair.geometry.includes('long')||hair.geometry==='ponytail'?`<path fill="${palette.hair}" d="M${faceX-headW*.46} ${faceY+headH*.18} Q${faceX-headW*.62} ${faceY+headH*1.9} ${faceX-headW*.3} ${faceY+headH*2.2} L${faceX+headW*.3} ${faceY+headH*2.2} Q${faceX+headW*.62} ${faceY+headH*1.9} ${faceX+headW*.46} ${faceY+headH*.18}Z"/>`:'';
  const coatBottom=costume.parts.some(item=>item.includes('long')||item.includes('formal'))?295:255;
  const parts={
    'back-hair':hairTail,
    shadow:'<ellipse cx="120" cy="306" rx="58" ry="8" fill="#17212c" opacity=".16"/>',
    body:`<path fill="${palette.skin}" d="M108 116h24l5 27h-34z"/><path fill="${palette.skin}" d="M${120-shoulder-7} 249h15v31h-15zM${120+shoulder-8} 249h15v31h-15z"/>`,
    costume:`<path fill="${palette.base}" stroke="#17212c" stroke-width="2" d="M${120-shoulder} 128 L${120+shoulder} 128 L${120+shoulder*.72} ${coatBottom} L137 304 L124 304 L120 207 L116 304 L103 304 L${120-shoulder*.72} ${coatBottom}Z"/><path fill="${palette.secondary}" d="M${120-shoulder} 130l-15 118 20 12 20-112zM${120+shoulder} 130l15 118-20 12-20-112z"/><path d="M120 151v139M101 139l19 24 19-24" fill="none" stroke="${palette.trim}" stroke-width="2"/><g transform="translate(120 176)" fill="none" stroke="${palette.emblem}" stroke-width="3"><path d="${emblemPath(genome.appearance_loadout.emblem_slot)}"/></g>`,
    face:`<path fill="${palette.skin}" stroke="${palette.hair}" stroke-width="2" d="M${faceX-headW/2} ${faceY+headH*.2} Q${faceX-headW*.56} ${faceY+headH*.58} ${faceX-headW*.32} ${faceY+headH*.88} Q120 ${faceY+headH*1.08} ${faceX+headW*.32} ${faceY+headH*.88} Q${faceX+headW*.56} ${faceY+headH*.58} ${faceX+headW/2} ${faceY+headH*.2}Z"/>`,
    eyes:`<g fill="none" stroke="${palette.eye}" stroke-width="3" stroke-linecap="round">${eyeMarkup}</g>`,
    brows:back?'':`<path d="M${faceX-eyeSpacing-headW*.12} ${faceY+headH*.34}l${headW*.22} -2M${faceX+eyeSpacing-headW*.1} ${faceY+headH*.34}l${headW*.22} 2" stroke="${palette.hair}" stroke-width="2.5" stroke-linecap="round"/>`,
    mouth:`<g fill="none" stroke="#70424b" stroke-width="2" stroke-linecap="round">${mouth}</g>`,
    'front-hair':`<path fill="${palette.hair}" d="M${faceX-headW*.58} ${faceY+headH*.4} Q${faceX-headW*.45} ${faceY-headH*.18} 120 ${faceY-headH*.12} Q${faceX+headW*.52} ${faceY-headH*.15} ${faceX+headW*.58} ${faceY+headH*.38} L${faceX+headW*.25} ${faceY+headH*.16} L${faceX+headW*.08} ${faceY+headH*.42} L${faceX-headW*.08} ${faceY+headH*.13} L${faceX-headW*.3} ${faceY+headH*.43}Z"/>`,
    highlight:`<path d="M${faceX-headW*.32} ${faceY+headH*.09}Q120 ${faceY-headH*.03} ${faceX+headW*.28} ${faceY+headH*.08}" fill="none" stroke="#ffffff" stroke-width="2" opacity=".3"/>`,
  };
  return{headRatio,parts,svg:['shadow','back-hair','body','costume','face','eyes','brows','mouth','front-hair','highlight'].map(key=>parts[key]).join('')};
}

function viewSvg(genome,view){const built=silhouette(genome,{view});return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320"><title>${escape(genome.identity_genome.name)} ${view}</title><rect width="240" height="320" fill="#eef2f5"/>${built.svg}<text x="10" y="314" font-family="sans-serif" font-size="9" fill="#44515d">${escape(view)} · ${built.headRatio.toFixed(2)} heads · ${escape(genome.topology_family)}</text></svg>`}
function faceTile(genome,label,index,kind){const x=20+(index%7)*96,y=48+Math.floor(index/7)*112,palette=genome.style_genome.palette,open=kind==='viseme'&&!['closed','M_B_P'].includes(label),eyeClosed=label.includes('closed')||label.includes('blink');return`<g transform="translate(${x} ${y})"><ellipse cx="40" cy="38" rx="31" ry="38" fill="${palette.skin}" stroke="${palette.hair}" stroke-width="2"/><path fill="${palette.hair}" d="M9 33Q15 -3 40 0T72 33Q53 15 40 19T9 33Z"/><path d="M21 35h12M47 35h12" stroke="${palette.eye}" stroke-width="${eyeClosed?5:2}"/><ellipse cx="40" cy="${kind==='expression'&&label==='surprised'?61:59}" rx="${open?10:kind==='expression'&&label==='restrained_smile'?12:8}" ry="${open?Math.max(3,3+(index%5)*1.5):2}" fill="${open?'#623c46':'none'}" stroke="#303943" stroke-width="2"/><text x="40" y="91" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#25313c">${escape(label)}</text></g>`}
function chartSvg(genome,title,items,kind){const rows=Math.ceil(items.length/7),height=60+rows*112;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 712 ${height}"><title>${escape(title)}</title><rect width="712" height="${height}" fill="#f3f5f7"/><text x="20" y="28" font-family="sans-serif" font-size="16" fill="#26323d">${escape(genome.identity_genome.name)} · ${escape(title)}</text>${items.map((item,index)=>faceTile(genome,item,index,kind)).join('')}</svg>`}

function renderRaster(genome,{view='front',expression='neutral',angle=0,pass='color',width=384,height=512}={}){
  const scale=3,S=scale,palette=genome.style_genome.palette,background=pass==='color'?color('#eef3f7'):color('#000000',0),target=surface(width*S,height*S,background),cx=width*S/2,turn=.52+.48*Math.abs(Math.cos(angle)),facing=Math.sin(angle),headRatio=7.05+(param(genome,'body.head_body_ratio')-.35)*1.25,headH=height*S/headRatio,headW=headH*(.64+(param(genome,'face.face_width')-.5)*.18)*turn,skin=color(palette.skin),hair=color(palette.hair),base=color(palette.base),secondary=color(palette.secondary),trim=color(palette.trim??palette.emblem),ink=color('#16202b'),depth=color('#777777'),normal=color('#7f7fff'),motion=color('#366aa8');
  const colors=pass==='depth'?{skin:color('#b0b0b0'),hair:color('#8a8a8a'),base:color('#565656'),secondary:color('#6a6a6a'),trim:color('#767676'),line:depth}:pass==='normal'?{skin:normal,hair:normal,base:normal,secondary:normal,trim:normal,line:normal}:pass==='motion'?{skin:motion,hair:motion,base:motion,secondary:motion,trim:motion,line:motion}:pass==='shadow'?{skin:color('#737983'),hair:color('#242b35'),base:color('#303844'),secondary:color('#46515f'),trim:color('#596777'),line:color('#111820')}:pass==='line'?{skin:color('#000000',0),hair:color('#000000',0),base:color('#000000',0),secondary:color('#000000',0),trim:color('#000000',0),line:ink}:{skin,hair,base,secondary,trim,line:ink};
  const shoulder=(62+(param(genome,'body.shoulder_width')-.5)*22)*S*turn,headY=39*S,faceCy=headY+headH*.54,neckTop=headY+headH*.88,torsoTop=neckTop+8*S,waistY=294*S,hipY=337*S,ankleY=486*S,coatLong=getCostumeFamily(genome.appearance_loadout.costume_family).parts.some(item=>item.includes('long')||item.includes('formal')),hairProfile=getHairFamily(genome.appearance_loadout.hair_family),longHair=hairProfile.geometry.includes('long')||hairProfile.geometry==='ponytail',outline=2.2*S;
  const leftShoulder=cx-shoulder,rightShoulder=cx+shoulder,waist=shoulder*.57,hip=shoulder*.66;

  if(longHair){ellipse(target,cx,faceCy+headH*.42,headW*.64,headH*.86,colors.hair);polygon(target,[[cx-headW*.58,faceCy],[cx-headW*.48,faceCy+headH*1.7],[cx-headW*.16,faceCy+headH*1.42],[cx,faceCy+headH*.55],[cx+headW*.16,faceCy+headH*1.42],[cx+headW*.48,faceCy+headH*1.7],[cx+headW*.58,faceCy]],colors.hair)}
  polygon(target,[[leftShoulder,torsoTop+16*S],[cx-waist,waistY],[cx-hip,hipY],[cx+hip,hipY],[cx+waist,waistY],[rightShoulder,torsoTop+16*S],[cx+headW*.28,torsoTop],[cx-headW*.28,torsoTop]],colors.base);
  polygon(target,[[leftShoulder+5*S,torsoTop+20*S],[leftShoulder-11*S,270*S],[cx-hip*.83,331*S],[cx-waist*.85,waistY]],colors.base);polygon(target,[[rightShoulder-5*S,torsoTop+20*S],[rightShoulder+11*S,270*S],[cx+hip*.83,331*S],[cx+waist*.85,waistY]],colors.base);
  polygon(target,[[cx-hip*.78,hipY],[cx-11*S,hipY],[cx-18*S,ankleY],[cx-51*S,ankleY],[cx-hip*.92,390*S]],colors.secondary);polygon(target,[[cx+hip*.78,hipY],[cx+11*S,hipY],[cx+18*S,ankleY],[cx+51*S,ankleY],[cx+hip*.92,390*S]],colors.secondary);
  if(coatLong){polygon(target,[[cx-hip,277*S],[cx-6*S,293*S],[cx-15*S,421*S],[cx-hip*.85,391*S]],colors.base);polygon(target,[[cx+hip,277*S],[cx+6*S,293*S],[cx+15*S,421*S],[cx+hip*.85,391*S]],colors.base)}
  ellipse(target,cx-hip*.83,333*S,8*S,12*S,colors.skin);ellipse(target,cx+hip*.83,333*S,8*S,12*S,colors.skin);
  ellipse(target,cx,neckTop+6*S,headW*.19,headH*.19,colors.skin);ellipse(target,cx,faceCy,headW*.54,headH*.52,colors.skin);
  ellipse(target,cx-headW*.55,faceCy+headH*.05,headW*.065,headH*.12,colors.skin);ellipse(target,cx+headW*.55,faceCy+headH*.05,headW*.065,headH*.12,colors.skin);
  ellipse(target,cx,headY+headH*.27,headW*.62,headH*.33,colors.hair);
  const fringe=[[cx-headW*.58,headY+headH*.34],[cx-headW*.42,headY+headH*.08],[cx-headW*.2,headY+headH*.44],[cx-headW*.02,headY+headH*.08],[cx+headW*.13,headY+headH*.4],[cx+headW*.34,headY+headH*.12],[cx+headW*.58,headY+headH*.38],[cx+headW*.48,headY+headH*.02],[cx-headW*.45,headY-headH*.01]];polygon(target,fringe,colors.hair);

  if(pass==='color'){
    const eyeY=headY+headH*.5,eyeX=headW*(.24+(param(genome,'face.eye_spacing')-.5)*.08),eyeW=headW*(.105+(param(genome,'face.eye_size')-.5)*.025),eyeH=expression==='surprised'?headH*.045:headH*.029,iris=color(palette.eye),white=color('#f4f6f7');
    ellipse(target,cx-eyeX+facing*headW*.08,eyeY,eyeW,eyeH,white);ellipse(target,cx+eyeX+facing*headW*.08,eyeY,eyeW,eyeH,white);ellipse(target,cx-eyeX+facing*headW*.08,eyeY,eyeH*.8,eyeH*.9,iris);ellipse(target,cx+eyeX+facing*headW*.08,eyeY,eyeH*.8,eyeH*.9,iris);
    line(target,[cx-eyeX-eyeW,eyeY-headH*.078],[cx-eyeX+eyeW,eyeY-headH*(expression==='angry'?.105:.088)],2.4*S,colors.hair);line(target,[cx+eyeX-eyeW,eyeY-headH*(expression==='angry'?.105:.088)],[cx+eyeX+eyeW,eyeY-headH*.078],2.4*S,colors.hair);
    const noseX=cx+facing*headW*.13;line(target,[noseX,eyeY+headH*.04],[noseX+facing*headW*.045,eyeY+headH*.19],1.2*S,color('#9b7773'));line(target,[noseX-headW*.035,eyeY+headH*.2],[noseX+headW*.04,eyeY+headH*.2],1*S,color('#9b7773'));
    const mouthY=headY+headH*.75,mouthW=headW*(.22+(param(genome,'face.mouth_width')-.5)*.09),open=expression==='surprised'?headH*.05:expression==='restrained_smile'?headH*.017:headH*.009;ellipse(target,cx+facing*headW*.1,mouthY,mouthW,open,color('#6b3845'));if(expression==='restrained_smile')line(target,[cx-mouthW,mouthY],[cx,mouthY+headH*.018],1*S,color('#a45e69'));
    polygon(target,[[cx-13*S,171*S],[cx,181*S],[cx+13*S,171*S],[cx+8*S,188*S],[cx,193*S],[cx-8*S,188*S]],colors.trim);
    line(target,[cx,torsoTop+33*S],[cx,waistY-9*S],1.4*S,colors.trim);line(target,[cx-23*S,torsoTop+28*S],[cx,torsoTop+54*S],1.5*S,colors.trim);line(target,[cx+23*S,torsoTop+28*S],[cx,torsoTop+54*S],1.5*S,colors.trim);
  }
  if(pass==='line'){
    polyline(target,[[leftShoulder,torsoTop+16*S],[cx-waist,waistY],[cx-hip,hipY],[cx+hip,hipY],[cx+waist,waistY],[rightShoulder,torsoTop+16*S]],outline,colors.line);ellipseOutline(target,cx,faceCy,headW*.54,headH*.52,outline,colors.line);polyline(target,fringe,outline,colors.line,true);line(target,[cx,torsoTop+25*S],[cx,waistY],1.4*S,colors.line);
  }else if(pass==='color'){
    ellipseOutline(target,cx,faceCy,headW*.54,headH*.52,1.15*S,color('#37414c',155));polyline(target,[[leftShoulder,torsoTop+16*S],[cx-waist,waistY],[cx-hip,hipY]],1.1*S,color('#101722',185));polyline(target,[[rightShoulder,torsoTop+16*S],[cx+waist,waistY],[cx+hip,hipY]],1.1*S,color('#101722',185));
  }
  const final=downsample(target,scale);return encodePng(final.width,final.height,final.data);
}

export function generateCharacterTextureAssets(genome){
  const size=128,maps=[['base-color',genome.style_genome.palette.base],['normal','#7f7fff'],['orm','#80c010'],['emissive',genome.style_genome.palette.emblem]],files={};
  for(const [role,hex] of maps){const target=surface(size,size,color(hex));for(let y=0;y<size;y++)for(let x=0;x<size;x++){const offset=(y*size+x)*4,noise=((x*17+y*31+genome.lineage.seed.length*13)%19)-9;if(role==='base-color'||role==='emissive')for(let channel=0;channel<3;channel++)target.data[offset+channel]=Math.max(0,Math.min(255,target.data[offset+channel]+noise));if(role==='normal'){target.data[offset]=127+Math.round(Math.sin(x/9)*3);target.data[offset+1]=127+Math.round(Math.cos(y/11)*3);target.data[offset+2]=255}}
    const buffer=encodePng(size,size,target.data),name=`textures/${role}.png`;files[name]={path:name,role:`texture-${role}`,mime:'image/png',buffer,root:rootHash(buffer.toString('base64'))};
  }
  return files;
}

export function generateCharacterProjectionAssets(genome,{colorOnly=false,existingRoots={}}={}){
  const files={};
  const addText=(path,role,text,mime='image/svg+xml')=>{files[path]={path,role,mime,buffer:Buffer.from(text),root:rootHash(Buffer.from(text).toString('base64'))}};
  const addBuffer=(path,role,buffer,mime='image/png')=>{files[path]={path,role,mime,buffer,root:rootHash(buffer.toString('base64'))}};
  addText('model-sheet.svg','model-sheet',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 320"><rect width="720" height="320" fill="#eef2f5"/><g>${viewSvg(genome,'front').replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g><g transform="translate(240)">${viewSvg(genome,'side').replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g><g transform="translate(480)">${viewSvg(genome,'back').replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g></svg>`);
  for(const view of ['front','side','back'])addText(`${view}-view.svg`,`${view}-view`,viewSvg(genome,view));
  addText('expression-sheet.svg','expression-sheet',chartSvg(genome,'Expression Sheet',EXPRESSION_MORPHS,'expression'));
  addText('mouth-chart.svg','mouth-chart',chartSvg(genome,'Viseme Chart',VISEME_MORPHS,'viseme'));
  addText('eye-state-sheet.svg','eye-state-sheet',chartSvg(genome,'Eye State Sheet',EYE_STATES,'eye'));
  const layers=['back-hair','body','costume','face','eyes','brows','mouth','front-hair','shadow','highlight'];
  const native=silhouette(genome,{view:'front'});for(const layer of layers)addText(`native-2d/${layer}.svg`,`native-2d-${layer}`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320"><title>${escape(layer)}</title>${native.parts[layer]}</svg>`);
  const nativeManifest=seal({format:'ragf.character-native-2d.v0.1',mode:'native-2d',character_id:genome.character_id,identity_root:genome.identity_root,layers:layers.map((layer,index)=>({layer_id:layer,file:`${layer}.svg`,z:index,anchor:[.5,.5],deform_mesh:index<8})),expression_morphs:[...EXPRESSION_MORPHS],visemes:[...VISEME_MORPHS],projection_root:''},'projection_root');addText('native-2d/manifest.json','native-2d-manifest',JSON.stringify(nativeManifest,null,2),'application/json');
  const depthLayers=layers.map((layer,index)=>({layer_id:layer,file:`../native-2d/${layer}.svg`,depth:Math.round((1-index/(layers.length+1))*1000)/1000,parallax:Math.round(index*.008*1000)/1000})),twoFive=seal({format:'ragf.character-2.5d-projection.v0.1',mode:'2.5d',character_id:genome.character_id,identity_root:genome.identity_root,camera:{projection:'perspective',focal_length_mm:50,near_face_replacement:true},layers:depthLayers,occlusion:'ordered-depth',projection_root:''},'projection_root');addText('2.5d/manifest.json','2.5d-manifest',JSON.stringify(twoFive,null,2),'application/json');
  const activeExpression=genome.state_overlays?.expression??'neutral';addBuffer('portrait-preview.png','portrait-preview',renderRaster(genome,{expression:activeExpression==='neutral'?'calm':activeExpression}));addBuffer('anime-projection.png','anime-projection',renderRaster(genome,{expression:activeExpression==='neutral'?'focused':activeExpression}));
  for(const [index,expression] of EXPRESSION_MORPHS.slice(0,6).entries())addBuffer(`expressions/${expression}.png`,`expression-${expression}`,renderRaster(genome,{expression,angle:(index-2.5)*.015}));
  for(let index=0;index<8;index++)addBuffer(`turntable/frame-${String(index+1).padStart(2,'0')}.png`,'turntable-frame',renderRaster(genome,{angle:index/8*TAU}));
  const passes=['color','line','shadow','depth','normal','motion'];for(const pass of passes)if(!colorOnly||pass==='color')addBuffer(`3d-assisted-2d/${pass}.png`,`3d-assisted-${pass}`,renderRaster(genome,{pass,expression:'focused'}));
  addText('3d-assisted-2d/correction-overlay.svg','3d-assisted-correction',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M126 170Q192 151 258 170" fill="none" stroke="${genome.style_genome.palette.trim}" stroke-width="2"/><path d="M145 247Q192 258 239 247" fill="none" stroke="${genome.style_genome.palette.emblem}" stroke-width="2"/></svg>`);
  const nativeLayerRoots=layers.map(layer=>files[`native-2d/${layer}.svg`].root),modeRoots={native_2d:rootHash({manifest:nativeManifest.projection_root,layers:nativeLayerRoots}),'2.5d':rootHash({manifest:twoFive.projection_root,layers:nativeLayerRoots}),'3d-assisted-2d':rootHash(passes.map(pass=>files[`3d-assisted-2d/${pass}.png`]?.root??existingRoots[`3d-assisted-2d/${pass}.png`]))};
  return{files,modes:[{mode:'native-2d',identity_signature_root:null,projection_root:modeRoots.native_2d},{mode:'2.5d',identity_signature_root:null,projection_root:modeRoots['2.5d']},{mode:'3d-assisted-2d',identity_signature_root:null,projection_root:modeRoots['3d-assisted-2d']}],mode_roots:modeRoots};
}
