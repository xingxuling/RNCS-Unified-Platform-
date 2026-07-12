from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "clients" / "godot-third-person"
REPORT = ROOT / "docs" / "STATIC-VERIFICATION-v0.18.1.json"
checks: list[dict[str, object]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    checks.append({"name": name, "ok": bool(ok), "detail": detail})


project = (ROOT / "project.godot").read_text(encoding="utf-8")
check("project.godot exists", (ROOT / "project.godot").is_file())
check("bootstrap is the main scene", 'run/main_scene="res://scenes/Bootstrap.tscn"' in project)
check("Godot 4.7 target", 'PackedStringArray("4.7"' in project)
check("GL compatibility renderer", 'renderer/rendering_method="gl_compatibility"' in project)
check("jump input registered", 'jump={' in project)

for relative in [
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
]:
    check(f"resource exists: {relative}", (ROOT / relative).is_file(), relative)

all_text = "\n".join(p.read_text(encoding="utf-8") for p in ROOT.rglob("*.gd"))
check("no runtime set_script injection", "set_script(" not in all_text)
check("no invalid MeshInstance3D transparency tween", '"transparency"' not in all_text)
check("bootstrap retains a visible failure screen", "_show_failure" in (ROOT / "scripts/bootstrap.gd").read_text(encoding="utf-8"))
check("startup log is written", "startup_diagnostics.log" in (ROOT / "scripts/bootstrap.gd").read_text(encoding="utf-8"))
check("startup self-test exists", "run_startup_self_test" in (ROOT / "scripts/main.gd").read_text(encoding="utf-8"))
check("three-step combo exists", "combo_step" in (ROOT / "scripts/player_controller.gd").read_text(encoding="utf-8"))
check("day cycle exists", "_update_day_cycle" in (ROOT / "scripts/main.gd").read_text(encoding="utf-8"))

# The v0.18 crash-prone pattern typed a node as a Godot base class, then called
# custom script members on it. This check blocks that regression.
for script_path in ROOT.rglob("*.gd"):
    text = script_path.read_text(encoding="utf-8")
    risky = re.findall(r"var\s+(player|hud|enemy|npc|target)\s*:\s*(CharacterBody3D|CanvasLayer|Node3D|Node)\b", text)
    check(f"no base-typed custom actor regression: {script_path.name}", not risky, str(risky))
    for left, right in [("(", ")"), ("[", "]"), ("{", "}")]:
        check(
            f"balanced {left}{right}: {script_path.name}",
            text.count(left) == text.count(right),
            f"{text.count(left)} vs {text.count(right)}",
        )

# Validate res:// references used by project and scenes/scripts.
reference_pattern = re.compile(r'res://[A-Za-z0-9_./-]+')
for source in [ROOT / "project.godot", *ROOT.rglob("*.tscn"), *ROOT.rglob("*.gd")]:
    text = source.read_text(encoding="utf-8")
    for ref in sorted(set(reference_pattern.findall(text))):
        target = ROOT / ref.removeprefix("res://")
        check(f"reference resolves: {source.name} -> {ref}", target.exists(), str(target))

errors = [entry for entry in checks if not entry["ok"]]
result = {
    "ok": not errors,
    "status": "STATIC_VERIFIED_GODOT_BINARY_NOT_AVAILABLE",
    "checks": checks,
    "errors": errors,
}
REPORT.parent.mkdir(parents=True, exist_ok=True)
REPORT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"ok": result["ok"], "checks": len(checks), "errors": len(errors), "report": str(REPORT)}, ensure_ascii=False))
raise SystemExit(0 if result["ok"] else 1)
