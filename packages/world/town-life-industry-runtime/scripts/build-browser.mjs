import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const source=fs.readFileSync(path.join(root,'src/index.mjs'),'utf8').replace(/^export\s+/gm,'');
const exportsBlock=`\nObject.assign(globalThis,{TOWN_LIFE_VERSION,TOWN_LIFE_PROTOCOL,ITEM_CATALOG,JOBS,RECIPES,TECHNOLOGIES,createTownGame,dispatchTownAction,townInteractionContext,projectTown2_5D,inspectTownGame,verifyTownGame,exportTownSave,importTownSave,health});\n`;
const template=fs.readFileSync(path.join(root,'examples/town-life.template.html'),'utf8');
const out=template.replace('__ENGINE__',source+exportsBlock);
fs.writeFileSync(path.join(root,'examples/潮汐工坊镇_v0.1_直接打开.html'),out);
console.log(JSON.stringify({ok:true,bytes:Buffer.byteLength(out),output:'examples/潮汐工坊镇_v0.1_直接打开.html'}));
