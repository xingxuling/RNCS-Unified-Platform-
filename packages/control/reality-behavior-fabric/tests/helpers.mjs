import fs from 'node:fs';import {clone} from '../src/canonical.mjs';
export const loadProgram=()=>JSON.parse(fs.readFileSync(new URL('../examples/frost-trial.behavior.json',import.meta.url),'utf8'));
export const providers={
 'experience.audio.emit':({inputs})=>({accepted:true,kind:'audio',...inputs}),
 'experience.effect.emit':({inputs})=>({accepted:true,kind:'effect',...inputs})
};
export function autopilot(runtime){const p=runtime.state.entities.player.variables,n=runtime.state.entities.enemy.variables,input={};if(!p.has_key)input.move_right=true;else if(n.health>0){const dx=n.x-p.x;if(Math.abs(dx)>50){if(dx>0)input.move_right=true;else input.move_left=true;}else if(p.attack_cooldown<=0)input.attack=true;}else input.move_right=true;return input;}
export const copy=clone;
