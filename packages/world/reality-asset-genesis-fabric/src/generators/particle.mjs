import {rootHash,seal} from '../canonical.mjs';
export function generateParticlePreset({genome,variant}){
  const max=Math.min(genome.budgets.max_particles,variant==='mobile'?32:variant==='cinematic'?96:64);
  return seal({format:'rsr.particle-preset.v0.4',version:'0.1.0',preset_id:`particle:${genome.identity.asset_id.split(':').pop()}:${variant}`,asset_id:genome.identity.asset_id,variant,semantic_event:'attack-hit',emitter:{shape:'cone',burst:Math.round(max*.5),rate:0,lifetime:[.25,.7],speed:[80,210],angle_degrees:[-35,35],gravity:[0,60],drag:.8},curves:{size:[[0,.3],[.15,1],[1,0]],opacity:[[0,0],[.08,1],[1,0]],color:[[0,genome.visual.palette[1]],[.35,genome.visual.palette[2]],[1,genome.visual.palette[0]]]},budget:{max_particles:max,quality:variant},effect_root:''},'effect_root');
}
