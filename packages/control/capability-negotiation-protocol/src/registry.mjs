import { seal } from './canonical.mjs';
import { normalizeProvider } from './contracts.mjs';
export function buildRegistry(providers){const ps=providers.map(normalizeProvider).sort((a,b)=>a.provider_id.localeCompare(b.provider_id));return seal({format:'cnp.registry.v0.1',providers:ps,provider_ids:ps.map(x=>x.provider_id),capability_count:ps.reduce((n,p)=>n+p.capabilities.length,0)},'registry_root');}
