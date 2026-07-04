import { createOpenWorld, movePlayer, castIncantation, tick } from '../../packages/world/open-world-rpg-runtime/src/index.mjs';
const world = createOpenWorld({ seed: 'demo-v018', name: '咏唱者' });
movePlayer(world, { x: 1, z: 1, sprint: true }, 0.5);
const cast = castIncantation(world, '火焰 长枪 穿刺', { x: 0, z: 1 });
for (let i = 0; i < 20; i++) tick(world, 0.05);
console.log(JSON.stringify({ version: world.version, player: world.player, npcPlayers: world.npcPlayers.length, enemies: world.enemies.length, cast, llmCalls: world.metrics.llmCalls }, null, 2));
