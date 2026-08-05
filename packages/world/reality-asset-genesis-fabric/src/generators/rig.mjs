import {seal} from '../canonical.mjs';

const quatX=angle=>[Math.sin(angle/2),0,0,Math.cos(angle/2)];
const quatZ=angle=>[0,0,Math.sin(angle/2),Math.cos(angle/2)];

const bones=[
  {name:'root',parent:null,rest:{translation:[0,0,0],rotation:[0,0,0,1]}},
  {name:'hips',parent:'root',rest:{translation:[0,1,0],rotation:[0,0,0,1]}},
  {name:'spine',parent:'hips',rest:{translation:[0,.55,0],rotation:[0,0,0,1]}},
  {name:'head',parent:'spine',rest:{translation:[0,.65,0],rotation:[0,0,0,1]}},
  {name:'arm_l',parent:'spine',rest:{translation:[-.35,.35,0],rotation:[0,0,0,1]}},
  {name:'arm_r',parent:'spine',rest:{translation:[.35,.35,0],rotation:[0,0,0,1]}},
  {name:'leg_l',parent:'hips',rest:{translation:[-.18,-.55,0],rotation:[0,0,0,1]}},
  {name:'leg_r',parent:'hips',rest:{translation:[.18,-.55,0],rotation:[0,0,0,1]}}
];

export function generateSkeletonRig({genome,variant}){
  return seal({format:'reality-asset.skeleton-rig.v0.4',asset_id:genome.identity.asset_id,variant,profile:'humanoid-rounded-v0.4',bones,sockets:[{name:'weapon_r',bone:'arm_r',translation:[.2,-.35,0],rotation:[0,0,0,1]},{name:'vfx_head',bone:'head',translation:[0,.35,0],rotation:[0,0,0,1]},{name:'chest_fx',bone:'spine',translation:[0,.18,-.28],rotation:[0,0,0,1]}],limits:{max_bones:genome.budgets.max_bones,required:['root','hips','spine','head'],optional:['arm_l','arm_r','leg_l','leg_r']},metrics:{bone_count:bones.length,skinned_root:'root',height_meters:2.55},rig_root:''},'rig_root');
}

export function generateAnimationClips({genome,variant}){
  const fps=genome.budgets.animation_fps;
  const clips=[
    {name:'idle',duration:1,loop:true,events:[],tracks:[{bone:'spine',path:'translation',times:[0,.5,1],values:[[0,.55,0],[0,.565,0],[0,.55,0]]},{bone:'head',path:'rotation',times:[0,.5,1],values:[[0,0,-.008,1],[0,0,.008,1],[0,0,-.008,1]],interpolation:'LINEAR'}]},
    {name:'move',duration:.72,loop:true,events:[{time:.18,type:'footstep',foot:'left'},{time:.54,type:'footstep',foot:'right'}],tracks:[{bone:'arm_l',path:'rotation',times:[0,.36,.72],values:[quatZ(.28),quatZ(-.28),quatZ(.28)]},{bone:'arm_r',path:'rotation',times:[0,.36,.72],values:[quatZ(-.28),quatZ(.28),quatZ(-.28)]},{bone:'leg_l',path:'rotation',times:[0,.36,.72],values:[quatX(-.32),quatX(.32),quatX(-.32)]},{bone:'leg_r',path:'rotation',times:[0,.36,.72],values:[quatX(.32),quatX(-.32),quatX(.32)]}]},
    {name:'attack',duration:1,loop:false,events:[{time:.2,type:'telegraph'},{time:.52,type:'damage-window',strength:1},{time:.66,type:'sfx',event:'attack'}],tracks:[{bone:'spine',path:'rotation',times:[0,.2,.52,1],values:[[0,0,0,1],[0,-.04,0,.999],[0,.09,0,.996],[0,0,0,1]]},{bone:'arm_r',path:'rotation',times:[0,.2,.52,.66,1],values:[quatZ(-.15),quatZ(-.55),quatZ(.75),quatZ(.3),quatZ(-.15)]}]},
    {name:'hit',duration:.42,loop:false,events:[{time:.08,type:'sfx',event:'hit'}],tracks:[{bone:'spine',path:'rotation',times:[0,.08,.42],values:[quatZ(0),quatZ(-.16),quatZ(0)]},{bone:'head',path:'rotation',times:[0,.08,.42],values:[quatX(0),quatX(-.12),quatX(0)]}]}
  ];
  return seal({format:'reality-asset.animation-clips.v0.4',asset_id:genome.identity.asset_id,variant,fps,clip_space:'local-bone',clips,retarget_profile:'humanoid-rounded-v0.4',quality:{root_motion:'extract-horizontal',foot_contact_events:true,attack_window_bound:true},clip_root:''},'clip_root');
}
