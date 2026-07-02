export function createTwoPlayerWorldConfig({worldId = 'world:network-loopback', stepHz = 60} = {}) {
  const box = (id, kind, position, halfExtents, extra = {}) => ({id, kind, position, fixtures:[{id:`fixture:${id}`, shape:{type:'box', halfExtents}}], ...extra});
  return {
    format: 'rsr.spatial-embodiment-world.v0.5', worldId, stepHz, floorY: 0, gravity: {x:0,y:-9810,z:0},
    bodies: [
      box('ground','static',{x:0,y:-500,z:0},{x:12000,y:500,z:9000}),
      box('wall-slanted','static',{x:3500,y:1000,z:1000},{x:250,y:1000,z:2400},{rotationDeg:{x:0,y:35000,z:0}}),
      box('obstacle-rotating','kinematic',{x:-2800,y:700,z:1500},{x:1500,y:180,z:180},{rotationDeg:{x:0,y:15000,z:0}}),
      box('crate','dynamic',{x:0,y:600,z:0},{x:600,y:600,z:600},{massQ:1000000, frictionQ:550000}),
      box('player-blue','dynamic',{x:-2500,y:900,z:-1200},{x:350,y:900,z:350},{massQ:1000000, fixedRotation:true, tags:['player','blue']}),
      box('player-red','dynamic',{x:2500,y:900,z:1200},{x:350,y:900,z:350},{massQ:1000000, fixedRotation:true, tags:['player','red']})
    ],
    characters: [
      {id:'character:blue',bodyId:'player-blue',walkSpeed:6000,acceleration:32000,jumpSpeed:6500},
      {id:'character:red',bodyId:'player-red',walkSpeed:6000,acceleration:32000,jumpSpeed:6500}
    ],
    materials: [{id:'default',frictionQ:500000,restitutionQ:0}], listeners: []
  };
}
