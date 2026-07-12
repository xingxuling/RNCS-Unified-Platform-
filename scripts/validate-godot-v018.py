from pathlib import Path
import re, json, sys
root=Path(__file__).resolve().parents[1] / 'clients/godot-third-person'
errors=[]; checks=[]
def ok(name, cond, detail=''):
    checks.append({'name':name,'ok':bool(cond),'detail':detail})
    if not cond: errors.append(name+(': '+detail if detail else ''))
ok('project.godot exists',(root/'project.godot').exists())
project=(root/'project.godot').read_text()
ok('main scene configured','run/main_scene="res://scenes/Main.tscn"' in project)
scene=(root/'scenes/Main.tscn').read_text()
for rel in re.findall(r'path="res://([^"]+)"',scene): ok('scene resource '+rel,(root/rel).exists(),rel)
all_text='\n'.join(p.read_text() for p in root.rglob('*.gd'))
for rel in re.findall(r'(?:preload|load)\("res://([^"\)]+)"\)',all_text): ok('script resource '+rel,(root/rel).exists(),rel)
required={'scripts/player_controller.gd':['extends CharacterBody3D','func attack()','func dodge()','func toggle_lock()','func request_spell'], 'scripts/voice_magic.gd':['func compile','request_microphone_recognition','llm_calls'], 'scripts/enemy.gd':['func take_damage','boss','phase'], 'scripts/main.gd':['func _build_world','func _spawn_npc_players','func _on_spell_cast']}
for rel,tokens in required.items():
    text=(root/rel).read_text()
    for token in tokens: ok(f'{rel} contains {token}',token in text)
for p in root.rglob('*.gd'):
    text=p.read_text()
    ok(f'{p.name} no TODO placeholder','TODO' not in text and 'pass # placeholder' not in text)
    for a,b in [('(',')'),('[',']'),('{','}')]:
        # Remove quoted strings for a conservative balance check.
        stripped=re.sub(r'"(?:\\.|[^"\\])*"', '""', text)
        ok(f'{p.name} balanced {a}{b}',stripped.count(a)==stripped.count(b),f'{stripped.count(a)} vs {stripped.count(b)}')
ok('Godot target 4.7','PackedStringArray("4.7"' in project)
ok('GL compatibility renderer','renderer/rendering_method="gl_compatibility"' in project)
out={'ok':not errors,'checks':checks,'errors':errors,'status':'STATIC_VERIFIED_ONLY_NO_GODOT_BINARY'}
(root/'docs').mkdir(exist_ok=True)
(root/'docs/STATIC-VERIFICATION.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
print(json.dumps(out,ensure_ascii=False,indent=2))
sys.exit(1 if errors else 0)
