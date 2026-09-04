import {surface,rect,circle,line,polygon,parseHex,encodePng} from '../png.mjs';
import {rootHash} from '../canonical.mjs';
import {isStatic3dAssetKind,isCreatureAssetKind} from '../contracts.mjs';

function drawCreatureFrame(s,ox,palette,f){
  const [primary,white,accent,dark]=palette,bob=[0,1,0,-1,0,1][f%6],stride=(f%2)*3;
  rect(s,ox+12,27+bob,35,18,primary);circle(s,ox+20,35+bob,12,primary);circle(s,ox+39,34+bob,12,primary);rect(s,ox+39,26+bob,14,12,white);rect(s,ox+50,30+bob,8,7,primary);circle(s,ox+49,29+bob,2,dark);polygon(s,[[ox+42,26+bob],[ox+44,17+bob],[ox+48,26+bob]],accent);polygon(s,[[ox+48,26+bob],[ox+53,18+bob],[ox+55,29+bob]],accent);line(s,ox+13,29+bob,ox+5,23+bob,white,3);line(s,ox+17,42+bob,ox+15-stride,57,dark,5);line(s,ox+29,43+bob,ox+27+stride,57,dark,5);line(s,ox+40,43+bob,ox+42-stride,57,dark,5);line(s,ox+49,42+bob,ox+52+stride,57,dark,5);line(s,ox+12,58,ox+23,58,dark,2);line(s,ox+39,58,ox+55,58,dark,2);rect(s,ox+22,30+bob,7,5,white);line(s,ox+23,32+bob,ox+28,32+bob,accent,2);
}

function drawStaticFrame(s,kind,ox,palette){
  const [primary,white,accent,dark]=palette;
  switch(String(kind??'').toLowerCase()){
    case 'vehicle-3d':
      rect(s,ox+8,31,48,18,primary);rect(s,ox+19,22,27,10,white);rect(s,ox+24,24,18,7,dark);circle(s,ox+18,52,7,dark);circle(s,ox+46,52,7,dark);circle(s,ox+18,52,3,white);circle(s,ox+46,52,3,white);rect(s,ox+8,36,5,5,accent);break;
    case 'structure-3d':
      rect(s,ox+12,22,40,32,primary);polygon(s,[[ox+8,23],[ox+32,10],[ox+56,23]],white);rect(s,ox+27,38,10,16,dark);rect(s,ox+17,29,8,8,accent);rect(s,ox+39,29,8,8,accent);line(s,ox+17,33,ox+25,33,white,1);line(s,ox+43,29,ox+43,37,white,1);break;
    case 'environment-3d':
      rect(s,ox+5,47,54,9,dark);circle(s,ox+20,35,14,primary);circle(s,ox+43,31,18,white);circle(s,ox+32,46,15,accent);line(s,ox+6,47,ox+58,47,primary,3);break;
    case 'vegetation-3d':
      rect(s,ox+29,30,7,25,dark);circle(s,ox+32,23,18,primary);circle(s,ox+20,32,11,white);circle(s,ox+45,32,12,white);circle(s,ox+32,12,9,accent);line(s,ox+10,55,ox+54,55,dark,3);break;
    case 'resource-3d':
      rect(s,ox+12,45,40,10,dark);polygon(s,[[ox+18,45],[ox+23,20],[ox+29,12],[ox+34,29],[ox+42,16],[ox+47,45]],primary);line(s,ox+23,20,ox+29,12,white,2);line(s,ox+29,12,ox+34,29,accent,2);line(s,ox+34,29,ox+42,16,white,2);break;
    default:
      rect(s,ox+13,20,38,32,primary);line(s,ox+13,28,ox+51,28,white,2);line(s,ox+32,20,ox+32,52,accent,2);circle(s,ox+25,38,3,accent);circle(s,ox+40,45,3,white);polygon(s,[[ox+16,52],[ox+32,58],[ox+48,52]],dark);
  }
}

export function generateSpriteSheet({genome,variant}){
  const static3d=isStatic3dAssetKind(genome.identity.kind),creature=isCreatureAssetKind(genome.identity.kind),frames=static3d?1:Math.min(genome.budgets.max_sprite_frames,variant==='mobile'?4:6),fw=64,fh=64,s=surface(fw*frames,fh,[8,16,31,0]);
  const [primary,white,accent,dark]=genome.visual.palette.map(parseHex);
  for(let f=0;f<frames;f++){
    const ox=f*fw,bob=[0,1,0,-1,0,1][f%6],leg=(f%2)*3;
    if(static3d){drawStaticFrame(s,genome.identity.kind,ox,[primary,white,accent,dark]);continue;}
    if(creature){drawCreatureFrame(s,ox,[primary,white,accent,dark],f);continue;}
    circle(s,ox+32,15+bob,8,white);rect(s,ox+25,12+bob,14,4,primary);rect(s,ox+24,23+bob,16,23,primary);rect(s,ox+28,27+bob,8,10,white);
    line(s,ox+26,44+bob,ox+22-leg,58,dark,5);line(s,ox+38,44+bob,ox+42+leg,58,dark,5);
    line(s,ox+24,27+bob,ox+14,40+(f%3),white,4);line(s,ox+40,27+bob,ox+48,38-(f%3),white,4);
    line(s,ox+48,18,ox+52,50,accent,3);circle(s,ox+52,18,3,white);
    rect(s,ox+2,2,12,3,accent);
  }
  const png=encodePng(s.width,s.height,s.data);
  const frameNames=static3d?['catalog-preview']:['idle','move-1','move-2','attack-1','attack-2','hit'];
  const metadata={format:'reality-asset.sprite-sheet.v0.1',asset_id:genome.identity.asset_id,variant,profile:static3d?'static-family':creature?'creature-quadruped':'humanoid',frame_width:fw,frame_height:fh,frames:Array.from({length:frames},(_,i)=>({name:frameNames[i]??`frame-${i}`,x:i*fw,y:0,w:fw,h:fh,duration_ms:static3d?0:i>=3?90:140})),pixel_root:rootHash(png.toString('base64'))};
  return{png,metadata};
}
