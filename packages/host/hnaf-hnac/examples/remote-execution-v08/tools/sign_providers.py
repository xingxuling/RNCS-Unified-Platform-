from __future__ import annotations
import base64, copy, json
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
import hashlib

ROOT=Path(__file__).resolve().parents[1]
# Deterministic demo-only seed. Production signers must use protected external keys.
SEED=hashlib.sha256(b'HNAF-v0.8-demo-provider-signing-key').digest()
private=Ed25519PrivateKey.from_private_bytes(SEED)
public=private.public_key().public_bytes(serialization.Encoding.Raw,serialization.PublicFormat.Raw)

def canonical(v): return json.dumps(v,ensure_ascii=False,separators=(',',':'),sort_keys=True)
def root(v): return hashlib.sha256(canonical(v).encode()).hexdigest()

def capability(capability_id, fulfills, transport, *, risk='medium', scopes=None, host_requirements=None, produces=None, cost=None, reversible=True):
    raw={
      'capability_id':capability_id,'version':'1.0.0','fulfills':[fulfills],
      'inputs':{},'outputs':{'result':{'type':'object'}},
      'required_scopes':scopes or ['state.write'],'host_requirements':host_requirements or [],
      'risk':{'level':risk,'reasons':['remote-or-sandboxed-execution']},'reversible':reversible,
      'execution_phase':'transaction','side_effects':['state.write'] if scopes else [],
      'evidence':{'produces':produces or ['execution.receipt'],'requires':[]},
      'cost':cost or {'cpu_millis':10,'memory_mb':16,'network_kb':1,'monetary_microunits':0},
      'transport':transport
    }
    signed=root(raw)
    raw['supply_chain']={'algorithm':'ed25519','signer_id':'signer:taowind-demo-provider','public_key_b64':base64.b64encode(public).decode(),'signed_root':signed,'signature_b64':base64.b64encode(private.sign(signed.encode('ascii'))).decode()}
    return raw

providers={'format':'hnaf.provider-registry.v0.8','providers':[
 {'provider_id':'provider:local-primary-failing','protocol_versions':['0.1.0'],'status':'available','trust':{'level':5,'attestations':['signed-demo']},'transports':[{'kind':'hnaf-builtin'}],'capabilities':[
   capability('hnaf.counter.primary','app.counter.increment',{'kind':'hnaf-builtin','handler':'fail'},produces=['state.root'],cost={'cpu_millis':1,'memory_mb':1,'network_kb':0,'monetary_microunits':0})]},
 {'provider_id':'provider:local-fallback','protocol_versions':['0.1.0'],'status':'available','trust':{'level':5,'attestations':['signed-demo']},'transports':[{'kind':'hnaf-builtin'}],'capabilities':[
   capability('hnaf.counter.fallback','app.counter.increment',{'kind':'hnaf-builtin','handler':'state.increment'},produces=['state.root'],cost={'cpu_millis':2,'memory_mb':1,'network_kb':0,'monetary_microunits':0})]},
 {'provider_id':'provider:http-loopback','protocol_versions':['0.1.0'],'status':'available','trust':{'level':5,'attestations':['signed-demo']},'transports':[{'kind':'http'}],'capabilities':[
   capability('hnaf.http.echo','app.remote.http.echo',{'kind':'http','url':'http://127.0.0.1:18708/execute'})]},
 {'provider_id':'provider:websocket-loopback','protocol_versions':['0.1.0'],'status':'available','trust':{'level':5,'attestations':['signed-demo']},'transports':[{'kind':'websocket'}],'capabilities':[
   capability('hnaf.websocket.echo','app.remote.websocket.echo',{'kind':'websocket','url':'ws://127.0.0.1:18709/execute'})]},
 {'provider_id':'provider:local-process','protocol_versions':['0.1.0'],'status':'available','trust':{'level':5,'attestations':['signed-demo']},'transports':[{'kind':'local-process'}],'capabilities':[
   capability('hnaf.process.echo','app.local.process.echo',{'kind':'local-process','command':['python3','-S','-c',"import json,sys; d=json.load(sys.stdin); print(json.dumps({'process':d['payload'],'idempotency_key':d['context']['idempotency_key']},ensure_ascii=False))"]},risk='high'),
   capability('hnaf.process.timeout','app.local.process.timeout',{'kind':'local-process','command':['python3','-S','-c',"import time,json; time.sleep(4); print(json.dumps({'late':True}))"]},risk='high')
 ]}
]}
(ROOT/'capabilities/providers.json').write_text(json.dumps(providers,ensure_ascii=False,indent=2)+'\n','utf-8')
print(ROOT/'capabilities/providers.json')
