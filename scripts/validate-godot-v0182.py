from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "clients" / "godot-third-person"
REPORT = ROOT / "docs" / "STATIC-VERIFICATION-v0.18.2.json"
checks: list[dict[str, object]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    checks.append({"name": name, "ok": bool(ok), "detail": detail})


project_path = ROOT / "project.godot"
project = project_path.read_text(encoding="utf-8")
check("project.godot exists", project_path.is_file())
check("bootstrap main scene", 'run/main_scene="res://scenes/Bootstrap.tscn"' in project)
check("Godot 4.7 target", 'PackedStringArray("4.7"' in project)
check("GL compatibility", 'renderer/rendering_method="gl_compatibility"' in project)

required = [
    "scenes/Bootstrap.tscn",
    "scenes/GameWorld.tscn",
    "scripts/bootstrap.gd",
    "scripts/main.gd",
    "scripts/player_controller.gd",
    "scripts/enemy.gd",
    "scripts/npc_player.gd",
    "scripts/hud.gd",
    "scripts/world_state.gd",
    "scripts/voice_magic.gd",
]
for relative in required:
    check(f"resource exists: {relative}", (ROOT / relative).is_file(), relative)

bootstrap = (ROOT / "scripts/bootstrap.gd").read_text(encoding="utf-8")
main = (ROOT / "scripts/main.gd").read_text(encoding="utf-8")
all_text = "\n".join(p.read_text(encoding="utf-8") for p in ROOT.rglob("*.gd"))

check("threaded scene request", "load_threaded_request" in bootstrap)
check("threaded status polling", "load_threaded_get_status" in bootstrap)
check("scene timeout", "SCENE_LOAD_TIMEOUT_MS" in bootstrap)
check("world timeout", "WORLD_READY_TIMEOUT_MS" in bootstrap)
check("startup progress bar", "_progress_bar" in bootstrap)
check("awaited launch coroutine", "await _launch_game()" in bootstrap)
check("world progress signal", "signal initialization_progress" in main)
check("world ready signal", "signal world_ready" in main)
check("world failed signal", "signal world_failed" in main)
check("awaited initialization coroutine", "await _initialize_world()" in main)
check("staged enemies", "_spawn_enemies_staged" in main)
check("staged NPC players", "_spawn_npc_players_staged" in main)
check("environment MultiMesh", "MultiMeshInstance3D" in main)
check("low-poly radial segments", "radial_segments = 8" in main)
check("no synchronous _build_world", "_build_world()" not in main)
check("no runtime set_script", "set_script(" not in all_text)
check("no pre-tree enemy global_position", "enemy.global_position =" not in main)
check("no pre-tree npc global_position", "npc.global_position =" not in main)

for script_path in ROOT.rglob("*.gd"):
    text = script_path.read_text(encoding="utf-8")
    risky = re.findall(
        r"var\s+(player|hud|enemy|npc|target)\s*:\s*"
        r"(CharacterBody3D|CanvasLayer|Node3D|Node)\b",
        text,
    )
    check(
        f"no base-typed custom actor: {script_path.name}",
        not risky,
        str(risky),
    )

reference_pattern = re.compile(r"res://[A-Za-z0-9_./-]+")
for source in [project_path, *ROOT.rglob("*.tscn"), *ROOT.rglob("*.gd")]:
    text = source.read_text(encoding="utf-8")
    for ref in sorted(set(reference_pattern.findall(text))):
        target = ROOT / ref.removeprefix("res://")
        check(
            f"reference resolves: {source.name} -> {ref}",
            target.exists(),
            str(target),
        )

errors = [entry for entry in checks if not entry["ok"]]
result = {
    "ok": not errors,
    "status": "STATIC_VERIFIED_USER_GODOT_RUNTIME_PENDING",
    "checks": checks,
    "errors": errors,
}
REPORT.parent.mkdir(parents=True, exist_ok=True)
REPORT.write_text(
    json.dumps(result, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
print(
    json.dumps(
        {
            "ok": result["ok"],
            "checks": len(checks),
            "errors": len(errors),
            "report": str(REPORT),
        },
        ensure_ascii=False,
    )
)
raise SystemExit(0 if result["ok"] else 1)
