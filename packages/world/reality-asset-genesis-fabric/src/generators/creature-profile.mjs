const quatX=angle=>[Math.sin(angle/2),0,0,Math.cos(angle/2)];
const quatY=angle=>[0,Math.sin(angle/2),0,Math.cos(angle/2)];
const quatZ=angle=>[0,0,Math.sin(angle/2),Math.cos(angle/2)];

export const CREATURE_PROFILE='creature-quadruped-v0.1';

export const CREATURE_BONES=[
  {name:'root',parent:null,rest:{translation:[0,0,0],rotation:[0,0,0,1]}},
  {name:'pelvis',parent:'root',rest:{translation:[0,.78,0],rotation:[0,0,0,1]}},
  {name:'spine',parent:'pelvis',rest:{translation:[0,.04,.38],rotation:[0,0,0,1]}},
  {name:'chest',parent:'spine',rest:{translation:[0,.02,.42],rotation:[0,0,0,1]}},
  {name:'neck',parent:'chest',rest:{translation:[0,.02,.36],rotation:[0,0,0,1]}},
  {name:'head',parent:'neck',rest:{translation:[0,.02,.24],rotation:[0,0,0,1]}},
  {name:'leg_front_l',parent:'chest',rest:{translation:[-.42,-.4,.28],rotation:[0,0,0,1]}},
  {name:'leg_front_r',parent:'chest',rest:{translation:[.42,-.4,.28],rotation:[0,0,0,1]}},
  {name:'leg_hind_l',parent:'pelvis',rest:{translation:[-.4,-.4,-.34],rotation:[0,0,0,1]}},
  {name:'leg_hind_r',parent:'pelvis',rest:{translation:[.4,-.4,-.34],rotation:[0,0,0,1]}},
  {name:'tail_base',parent:'pelvis',rest:{translation:[0,-.02,-.4],rotation:[0,0,0,1]}},
  {name:'tail_mid',parent:'tail_base',rest:{translation:[0,-.02,-.38],rotation:[0,0,0,1]}},
  {name:'tail_tip',parent:'tail_mid',rest:{translation:[0,.02,-.34],rotation:[0,0,0,1]}}
];

export const CREATURE_BONE_WORLD=[[0,0,0],[0,.78,0],[0,.82,.38],[0,.84,.8],[0,.86,1.16],[0,.88,1.4],[-.42,.44,1.08],[.42,.44,1.08],[-.4,.38,-.34],[.4,.38,-.34],[0,.76,-.4],[0,.74,-.78],[0,.76,-1.12]];
export const CREATURE_BOUNDS={center:[0,.95,0],halfExtents:[.78,1.02,2.2]};
export const CREATURE_SOCKETS=[
  {name:'mouth_fx',bone:'head',translation:[0,.02,.3],rotation:[0,0,0,1]},
  {name:'vfx_head',bone:'head',translation:[0,.12,.18],rotation:[0,0,0,1]},
  {name:'chest_fx',bone:'chest',translation:[0,.18,0],rotation:[0,0,0,1]},
  {name:'tail_fx',bone:'tail_tip',translation:[0,.02,-.18],rotation:[0,0,0,1]}
];

export function createCreatureAnimationClips(fps){
  return [
    {name:'idle',duration:1,loop:true,events:[],tracks:[
      {bone:'spine',path:'rotation',times:[0,.5,1],values:[quatZ(-.012),quatZ(.012),quatZ(-.012)]},
      {bone:'tail_mid',path:'rotation',times:[0,.5,1],values:[quatY(-.04),quatY(.04),quatY(-.04)]}
    ]},
    {name:'move',duration:.72,loop:true,events:[{time:.18,type:'footstep',foot:'front-left'},{time:.54,type:'footstep',foot:'front-right'}],tracks:[
      {bone:'leg_front_l',path:'rotation',times:[0,.18,.36,.54,.72],values:[quatX(.34),quatX(-.34),quatX(.34),quatX(-.34),quatX(.34)]},
      {bone:'leg_front_r',path:'rotation',times:[0,.18,.36,.54,.72],values:[quatX(-.34),quatX(.34),quatX(-.34),quatX(.34),quatX(-.34)]},
      {bone:'leg_hind_l',path:'rotation',times:[0,.18,.36,.54,.72],values:[quatX(-.4),quatX(.4),quatX(-.4),quatX(.4),quatX(-.4)]},
      {bone:'leg_hind_r',path:'rotation',times:[0,.18,.36,.54,.72],values:[quatX(.4),quatX(-.4),quatX(.4),quatX(-.4),quatX(.4)]},
      {bone:'tail_mid',path:'rotation',times:[0,.36,.72],values:[quatY(-.16),quatY(.16),quatY(-.16)]},
      {bone:'tail_tip',path:'rotation',times:[0,.36,.72],values:[quatY(.2),quatY(-.2),quatY(.2)]}
    ]},
    {name:'attack',duration:1,loop:false,events:[{time:.2,type:'telegraph'},{time:.52,type:'damage-window',strength:1},{time:.66,type:'sfx',event:'attack'}],tracks:[
      {bone:'chest',path:'rotation',times:[0,.2,.52,1],values:[quatX(.04),quatX(-.18),quatX(.24),quatX(.04)]},
      {bone:'head',path:'rotation',times:[0,.2,.52,1],values:[quatX(.08),quatX(-.16),quatX(.2),quatX(.08)]},
      {bone:'leg_front_l',path:'rotation',times:[0,.2,.52,1],values:[quatX(.1),quatX(-.28),quatX(.34),quatX(.1)]},
      {bone:'leg_front_r',path:'rotation',times:[0,.2,.52,1],values:[quatX(.1),quatX(-.28),quatX(.34),quatX(.1)]}
    ]},
    {name:'hit',duration:.42,loop:false,events:[{time:.08,type:'sfx',event:'hit'}],tracks:[
      {bone:'chest',path:'rotation',times:[0,.08,.42],values:[quatZ(0),quatZ(-.16),quatZ(0)]},
      {bone:'head',path:'rotation',times:[0,.08,.42],values:[quatZ(0),quatZ(.12),quatZ(0)]},
      {bone:'tail_base',path:'rotation',times:[0,.08,.42],values:[quatY(0),quatY(-.12),quatY(0)]}
    ]}
  ].map(clip=>({...clip,fps}));
}
