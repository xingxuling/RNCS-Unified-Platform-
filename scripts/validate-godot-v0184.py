from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "clients" / "godot-third-person"
REPORT = ROOT / "docs" / "STATIC-VERIFICATION-v0.18.4.json"
checks: list[dict[str, object]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    checks.append({"name": name, "ok": bool(ok), "detail": detail})


project_path = ROOT / "project.godot"
project = project_path.read_text(encoding="utf-8")
check("project.godot exists", project_path.is_file())
check("bootstrap main scene", 'run/main_scene="res://scenes/Bootstrap.tscn"' in project)
check("Godot 4.7 target", 'PackedStringArray("4.7"' in project)
check("GL compatibility", 'renderer/rendering_method="gl_compatibility"' in project)
check("touch to mouse emulation", "pointing/emulate_mouse_from_touch=true" in project)
check("mouse to touch emulation", "pointing/emulate_touch_from_mouse=true" in project)

required = [
    "scenes/Bootstrap.tscn",
    "scenes/GameWorld.tscn",
    "scripts/bootstrap.gd",
    "scripts/main.gd",
    "scripts/player_controller.gd",
    "scripts/enemy.gd",
    "scripts/npc_player.gd",
    "scripts/hud.gd",
    "scripts/mobile_controls.gd",
    "scripts/world_state.gd",
    "scripts/voice_magic.gd",
]
for relative in required:
    check(f"resource exists: {relative}", (ROOT / relative).is_file(), relative)

bootstrap = (ROOT / "scripts/bootstrap.gd").read_text(encoding="utf-8")
main = (ROOT / "scripts/main.gd").read_text(encoding="utf-8")
player = (ROOT / "scripts/player_controller.gd").read_text(encoding="utf-8")
hud = (ROOT / "scripts/hud.gd").read_text(encoding="utf-8")
mobile = (ROOT / "scripts/mobile_controls.gd").read_text(encoding="utf-8")
all_text = "\n".join(p.read_text(encoding="utf-8") for p in ROOT.rglob("*.gd"))

check("threaded scene request", "load_threaded_request" in bootstrap)
check("scene timeout", "SCENE_LOAD_TIMEOUT_MS" in bootstrap)
check("world timeout", "WORLD_READY_TIMEOUT_MS" in bootstrap)
check("staged enemies", "_spawn_enemies_staged" in main)
check("staged NPC players", "_spawn_npc_players_staged" in main)
check("environment MultiMesh", "MultiMeshInstance3D" in main)
check("mobile quality mode", "$Sun.shadow_enabled = false" in main)
check("mobile tree budget", "tree_count: int = 54 if _mobile_device else 90" in main)
check("mobile rock budget", "rock_count: int = 28 if _mobile_device else 48" in main)
check("no runtime set_script", "set_script(" not in all_text)

check("mobile move signal", "signal move_changed" in mobile)
check("mobile camera signal", "signal camera_dragged" in mobile)
check("multi-touch move id", "_move_touch_id" in mobile)
check("multi-touch camera id", "_camera_touch_id" in mobile)
check("joystick draw", "draw_circle(_move_origin" in mobile)
check("action buttons", all(token in mobile for token in [
    '"attack"', '"dodge"', '"jump"', '"lock"', '"interact"', '"voice"'
]))
check("five spell buttons", all(token in mobile for token in [
    "fire_lance", "frost_aegis", "thunder_chain", "wind_step", "healing_light"
]))
check("HUD mobile bridge", all(token in hud for token in [
    "_on_mobile_move", "_on_mobile_camera", "_on_mobile_action", "_on_mobile_spell"
]))
check("player mobile movement", "set_mobile_move_vector" in player)
check("player mobile camera", "add_mobile_camera_delta" in player)
check("mobile mouse capture guard", "Input.MOUSE_MODE_VISIBLE if _mobile_device" in player)
check("mobile auto sprint", "_mobile_move_vector.length() > 0.88" in player)
check("position shadow warning removed", "mesh_position" in player and "mesh: PrimitiveMesh, position:" not in player)

for script_path in ROOT.rglob("*.gd"):
    text = script_path.read_text(encoding="utf-8")
    risky = re.findall(
        r"var\s+(player|hud)\s*:\s*"
        r"(CharacterBody3D|CanvasLayer|Node3D|Node)\b",
        text,
    )
    check(f"no base-typed custom actor: {script_path.name}", not risky, str(risky))
    check(f"parentheses balanced: {script_path.name}", text.count("(") == text.count(")"))
    check(f"brackets balanced: {script_path.name}", text.count("[") == text.count("]"))
    check(f"braces balanced: {script_path.name}", text.count("{") == text.count("}"))

reference_pattern = re.compile(r"res://[A-Za-z0-9_./-]+")
for source in [project_path, *ROOT.rglob("*.tscn"), *ROOT.rglob("*.gd")]:
    text = source.read_text(encoding="utf-8")
    for ref in sorted(set(reference_pattern.findall(text))):
        target = ROOT / ref.removeprefix("res://")
        check(f"reference resolves: {source.name} -> {ref}", target.exists(), str(target))

errors = [entry for entry in checks if not entry["ok"]]
result = {
    "ok": not errors,
    "status": "STATIC_VERIFIED_ANDROID_RUNTIME_USER_CONFIRMATION_PENDING",
    "version": "0.18.4-alpha.1",
    "checks": checks,
    "errors": errors,
}
REPORT.parent.mkdir(parents=True, exist_ok=True)
REPORT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"ok": result["ok"], "checks": len(checks), "errors": len(errors), "report": str(REPORT)}, ensure_ascii=False))
raise SystemExit(0 if result["ok"] else 1)
