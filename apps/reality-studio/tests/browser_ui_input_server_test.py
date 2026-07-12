from pathlib import Path
import json, subprocess, time, urllib.request, urllib.error

root=Path(__file__).resolve().parents[1]
port=17628
base=f'http://127.0.0.1:{port}'

def request(path,payload=None):
    data=None if payload is None else json.dumps(payload,ensure_ascii=False).encode('utf-8')
    req=urllib.request.Request(base+path,data=data,headers={'Content-Type':'application/json'} if data else {})
    with urllib.request.urlopen(req,timeout=5) as r:
        return json.load(r)

proc=subprocess.Popen(['node','src/cli.mjs','serve','--port',str(port)],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
try:
    health=None
    for _ in range(80):
        try:
            health=request('/api/health')
            if health.get('ui_native') and health.get('input_native'): break
        except Exception:
            time.sleep(.12)
    if not health or not health.get('ui_native'):
        raise RuntimeError('server did not start with UI/input capability')

    session=request('/api/unified/session/new',{})
    sid=session['session_id']
    assert len(session['ui']['tree']['nodes'])>=10
    original_root=session['ui']['tree']['ui_root']

    patched=request('/api/unified/session/command',{
        'session_id':sid,'command':'ui-patch','ui_node_id':'ui:title',
        'patch':{'text':'现实原生界面'}
    })
    assert patched['ui']['tree']['ui_root']!=original_root
    title=next(n for n in patched['ui']['tree']['nodes'] if n['ui_node_id']=='ui:title')
    assert title['text']=='现实原生界面'

    rebound=request('/api/unified/session/command',{
        'session_id':sid,'command':'input-rebind','action':'attack',
        'binding':{'device':'keyboard','code':'KeyL'},'replace':True
    })
    attack_bindings=rebound['input']['profile']['actions']['attack']['bindings']
    assert attack_bindings==[{'device':'keyboard','code':'KeyL'}]

    sampled=request('/api/unified/session/command',{
        'session_id':sid,'command':'input-sample','raw':{'keys':['KeyL'],'gamepads':[],'touches':[]}
    })
    assert sampled['actions']['attack']['pressed'] is True
    assert sampled['actions']['attack']['just_pressed'] is True

    stepped=request('/api/unified/session/command',{
        'session_id':sid,'command':'step','input':{'raw':{'keys':['KeyL'],'gamepads':[],'touches':[]}}
    })
    assert stepped['behavior']['runtime']['tick']>=1

    # Touch controls are intentionally hidden in desktop layout; dispatching with touch=True
    # recompiles the authoritative layout for a touch observer. Default 640x360 attack centre is 583,303.
    cx,cy=583,303
    event=request('/api/unified/session/command',{
        'session_id':sid,'command':'ui-event','type':'pressed','x':cx,'y':cy,'touch':True
    })
    assert event['action']=='attack' and event['target_id']=='ui:attack'

    exported=request('/api/unified/session/export',{'session_id':sid})
    manifest=exported['ui_input_manifest']
    assert manifest['manifest_root']
    assert 'input.runtime-rebind' in manifest['capabilities']
    assert 'ui-input.manifest.json' in exported['build_plan']['files']

    result={
        'format':'reality-studio.authoritative-ui-input-api-test.v1.2',
        'ready':True,
        'mode':'authoritative-node-api',
        'health':health,
        'session_id_redacted':sid.split(':')[0]+':<uuid>',
        'ui_nodes':len(stepped['ui']['tree']['nodes']),
        'input_actions':len(stepped['input']['profile']['actions']),
        'tick':stepped['behavior']['runtime']['tick'],
        'title_text':title['text'],
        'attack_binding':attack_bindings[0],
        'touch_event':{'target_id':event['target_id'],'action':event['action'],'handled':event['handled']},
        'ui_root':stepped['ui']['tree']['ui_root'],
        'input_root':stepped['input']['profile']['input_root'],
        'manifest_root':manifest['manifest_root'],
        'browser_server_navigation':'blocked_by_environment_policy; authoritative API tested with urllib, offline browser UI tested separately',
        'errors':[]
    }
    out=root/'evidence/BROWSER_UI_INPUT_SERVER_TEST_v1.2.json'
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
finally:
    proc.terminate()
    try: proc.wait(timeout=5)
    except subprocess.TimeoutExpired: proc.kill()
