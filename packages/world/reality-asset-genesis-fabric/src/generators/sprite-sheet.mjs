import {surface,rect,circle,line,parseHex,encodePng} from '../png.mjs';
import {rootHash} from '../canonical.mjs';
export function generateSpriteSheet({genome,variant}){
  const frames=Math.min(genome.budgets.max_sprite_frames,variant==='mobile'?4:6),fw=64,fh=64,s=surface(fw*frames,fh,[8,16,31,0]);
  const [primary,white,accent,dark]=genome.visual.palette.map(parseHex);
  for(let f=0;f<frames;f++){
    const ox=f*fw,bob=[0,1,0,-1,0,1][f%6],leg=(f%2)*3;
    circle(s,ox+32,15+bob,8,white);rect(s,ox+25,12+bob,14,4,primary);rect(s,ox+24,23+bob,16,23,primary);rect(s,ox+28,27+bob,8,10,white);
    line(s,ox+26,44+bob,ox+22-leg,58,dark,5);line(s,ox+38,44+bob,ox+42+leg,58,dark,5);
    line(s,ox+24,27+bob,ox+14,40+(f%3),white,4);line(s,ox+40,27+bob,ox+48,38-(f%3),white,4);
    line(s,ox+48,18,ox+52,50,accent,3);circle(s,ox+52,18,3,white);
    rect(s,ox+2,2,12,3,accent);
  }
  const png=encodePng(s.width,s.height,s.data);
  const metadata={format:'reality-asset.sprite-sheet.v0.1',asset_id:genome.identity.asset_id,variant,frame_width:fw,frame_height:fh,frames:Array.from({length:frames},(_,i)=>({name:['idle','move-1','move-2','attack-1','attack-2','hit'][i]??`frame-${i}`,x:i*fw,y:0,w:fw,h:fh,duration_ms:i>=3?90:140})),pixel_root:rootHash(png.toString('base64'))};
  return{png,metadata};
}
