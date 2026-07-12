#!/usr/bin/env node
let body='';for await(const chunk of process.stdin)body+=chunk;const req=JSON.parse(body);const g=req.genome,p=g.visual.palette,name=g.identity.name,variant=req.variant;
const text=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="${p[3]}"/><circle cx="256" cy="180" r="90" fill="${p[0]}"/><path d="M150 430 L256 220 L362 430Z" fill="${p[1]}" stroke="${p[2]}" stroke-width="12"/><text x="30" y="480" fill="white" font-size="26">${name} · EXTERNAL · ${variant} · ${g.semantics.element}</text></svg>`;
process.stdout.write(JSON.stringify({artifact:{mime:'image/svg+xml',text,provider_evidence:{model:'mock-concept-provider',request_id:req.request_id}}}));
