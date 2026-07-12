const module=await import('../server.mjs');
const app=module.default;
if(typeof app!=='function'||typeof app.handle!=='function')throw new Error('server.mjs did not export an Express application.');
console.log(JSON.stringify({status:'PASS',entry:'server.mjs',express_app:true},null,2));
