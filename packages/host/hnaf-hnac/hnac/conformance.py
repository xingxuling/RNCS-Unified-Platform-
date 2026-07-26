from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from .errors import HNACError
from .host import HostProfile
from .runtime import run_capsule
from .trust import verify
from .adaptive_interface import interface_from_capsule_files
from .intent_fabric import bind_intent, load_binding_assets

TRACE_CONTRACT_VERSION = "0.7"


def load_trace(path: Path) -> list[dict[str, Any]]:
    try:
        return [json.loads(line) for line in path.read_text("utf-8").splitlines() if line.strip()]
    except (OSError, json.JSONDecodeError) as exc:
        raise HNACError(f"Invalid semantic trace: {path}") from exc


def normalize_trace(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Reduce implementation traces to host-neutral observable semantics.

    Volatile values (timestamps, lease IDs, platform strings, elapsed time, and
    implementation-specific result payloads) are intentionally excluded.
    """
    normalized: list[dict[str, Any]] = []
    for event in events:
        kind = event.get("event")
        if kind == "host.context":
            normalized.append({"event": kind})
        elif kind == "capsule.verified":
            signature = event.get("signature", {})
            normalized.append({"event": kind, "signature_status": signature.get("status")})
        elif kind == "capability.negotiated":
            # Python flattens the plan into the event while the JS host stores the
            # same structure directly. Both shapes are accepted at the boundary.
            plan = event.get("plan", event)
            execution = plan.get("execution") or {}
            normalized.append(
                {
                    "event": kind,
                    "status": plan.get("status"),
                    "profile": execution.get("profile"),
                    "grants": sorted(item.get("capability") for item in plan.get("grants", [])),
                    "fallbacks": sorted(item.get("capability") for item in plan.get("fallbacks", [])),
                    "unresolved": sorted(plan.get("unresolved", [])),
                }
            )
        elif kind == "execution.started":
            normalized.append({"event": kind, "profile": event.get("profile")})
        elif kind == "capability.call":
            normalized.append(
                {
                    "event": kind,
                    "capability": event.get("capability"),
                    "method": event.get("method"),
                }
            )
        elif kind == "capability.denied":
            normalized.append(
                {
                    "event": kind,
                    "capability": event.get("capability"),
                    "method": event.get("method"),
                    "reason": event.get("reason"),
                }
            )
        elif kind == "execution.completed":
            result = event.get("result", {})
            normalized.append({"event": kind, "profile": result.get("profile")})
        elif kind == "interface.projected":
            normalized.append(
                {
                    "event": kind,
                    "profile": event.get("profile"),
                    "semantic_snapshot": event.get("semantic_snapshot"),
                }
            )
    return normalized


def compare_traces(left: list[dict[str, Any]], right: list[dict[str, Any]]) -> dict[str, Any]:
    left_normalized = normalize_trace(left)
    right_normalized = normalize_trace(right)
    differences: list[dict[str, Any]] = []
    maximum = max(len(left_normalized), len(right_normalized))
    for index in range(maximum):
        left_value = left_normalized[index] if index < len(left_normalized) else None
        right_value = right_normalized[index] if index < len(right_normalized) else None
        if left_value != right_value:
            differences.append({"index": index, "left": left_value, "right": right_value})
    return {
        "contract_version": TRACE_CONTRACT_VERSION,
        "equivalent": not differences,
        "left_events": len(left_normalized),
        "right_events": len(right_normalized),
        "differences": differences,
        "left": left_normalized,
        "right": right_normalized,
    }


def _conformance_host() -> HostProfile:
    return HostProfile(
        id="hnaf.reference.conformance",
        family="desktop",
        execution_profiles=["wasm-core@1", "declarative-v0"],
        capabilities={
            "host.log": ["1"],
            "host.clock": ["1"],
            "environment.summary": ["1"],
            "storage.kv": ["1", "2"],
            "storage.state": ["1"],
        },
        interaction_modes=["cli", "keyboard", "pointer"],
        resources={"implementation": "cross-host-conformance", "viewport_width": 1440, "viewport_height": 900, "spatial": False},
        policies={"require_signature": False, "network_default": "deny", "accessibility_mode": False},
    )


def run_js_host(
    capsule: Path,
    js_host: Path,
    trace_path: Path,
    state_root: Path,
    *,
    require_signature: bool = False,
    host_profile: Path | None = None,
) -> dict[str, Any]:
    command = [
        "node",
        str(js_host),
        "run",
        str(capsule),
        "--trace",
        str(trace_path),
        "--state-root",
        str(state_root),
    ]
    if host_profile is not None:
        command.extend(["--host-profile", str(host_profile)])
    if require_signature:
        command.append("--require-signature")
    completed = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", check=False)
    if completed.returncode != 0:
        raise HNACError(f"JavaScript host failed: {completed.stderr.strip() or completed.stdout.strip()}")
    try:
        return json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise HNACError("JavaScript host returned invalid JSON") from exc


def _capability_conformance(capsule: Path, js_host: Path, host: HostProfile, host_profile: Path, require_signature: bool) -> dict[str, Any]:
    verified = verify(capsule, require_signature=require_signature)
    if verified["manifest"].get("format_version") != "0.7":
        return {"equivalent": True, "format": None, "reason": "capsule-has-no-v0.7-binding"}
    graph = interface_from_capsule_files(verified["manifest"], verified["files"])
    if graph is None:
        return {"equivalent": False, "format": "hnaf.intent-capability-binding.v0.7", "reason": "missing-interface-graph"}
    intents = sorted(intent_id for intent_id, value in graph.get("intents", {}).items() if value.get("goal"))
    if not intents:
        return {"equivalent": False, "format": "hnaf.intent-capability-binding.v0.7", "reason": "missing-capability-intent"}
    assets = load_binding_assets(verified["manifest"], verified["files"])
    scopes = sorted({scope for provider in assets["providers"] for capability in provider.get("capabilities", []) for scope in capability.get("required_scopes", [])})
    subject = {"subject_id": "subject:conformance", "kind": "human", "roles": ["owner"], "scopes": scopes}
    intent_id = intents[0]
    now = "2026-07-01T00:00:00Z"
    python_binding = bind_intent(
        manifest=verified["manifest"], files=verified["files"], graph=graph, intent_id=intent_id,
        host=host, subject=subject, payload={}, now=now,
    )
    command = [
        "node", str(js_host), "intent-bind", str(capsule),
        "--host-profile", str(host_profile), "--intent", intent_id,
        "--subject", json.dumps(subject, ensure_ascii=False, separators=(",", ":")),
        "--payload", "{}", "--now", now,
    ]
    if require_signature:
        command.append("--require-signature")
    completed = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", check=False)
    if completed.returncode != 0:
        raise HNACError(f"JavaScript capability binding failed: {completed.stderr.strip() or completed.stdout.strip()}")
    try:
        javascript_binding = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise HNACError("JavaScript capability binding returned invalid JSON") from exc
    fields = {
        "capability_snapshot": (python_binding.get("capability_snapshot"), javascript_binding.get("capability_snapshot")),
        "request_root": (python_binding.get("negotiation", {}).get("request", {}).get("request_root"), javascript_binding.get("negotiation", {}).get("request", {}).get("request_root")),
        "plan_root": (python_binding.get("negotiation", {}).get("plan", {}).get("plan_root"), javascript_binding.get("negotiation", {}).get("plan", {}).get("plan_root")),
        "authority_decision_root": (python_binding.get("authority", {}).get("decision_root"), javascript_binding.get("authority", {}).get("decision_root")),
    }
    differences = {name: {"python": pair[0], "javascript": pair[1]} for name, pair in fields.items() if pair[0] != pair[1]}
    return {
        "equivalent": not differences,
        "format": "hnaf.intent-capability-binding.v0.7",
        "intent_id": intent_id,
        "python_backend": python_binding.get("negotiation_backend"),
        "javascript_backend": javascript_binding.get("negotiation_backend"),
        "capability_snapshot": python_binding.get("capability_snapshot"),
        "differences": differences,
    }


def cross_host_conformance(
    capsule: Path,
    js_host: Path | None,
    *,
    require_signature: bool = False,
    workspace: Path | None = None,
) -> dict[str, Any]:
    js_host = js_host or (Path(__file__).resolve().parent / "hosts" / "js" / "hnac-js.mjs")
    if not js_host.is_file():
        raise HNACError(f"JavaScript host not found: {js_host}")
    context = tempfile.TemporaryDirectory() if workspace is None else None
    root = Path(context.name) if context is not None else workspace
    assert root is not None
    root.mkdir(parents=True, exist_ok=True)
    python_trace = root / "python.trace.jsonl"
    javascript_trace = root / "javascript.trace.jsonl"
    host = _conformance_host()
    host_profile = root / "conformance-host.json"
    host_profile.write_text(json.dumps(host.to_dict(), ensure_ascii=False, indent=2, sort_keys=True), "utf-8")
    try:
        python_result = run_capsule(
            capsule,
            host=host,
            state_root=root / "python-state",
            trace_path=python_trace,
            require_signature=require_signature,
        )
        javascript_result = run_js_host(
            capsule,
            js_host,
            javascript_trace,
            root / "javascript-state",
            require_signature=require_signature,
            host_profile=host_profile,
        )
        comparison = compare_traces(load_trace(python_trace), load_trace(javascript_trace))
        return {
            "contract_version": TRACE_CONTRACT_VERSION,
            "capsule": str(capsule),
            "hosts": {
                "python": python_result["runtime"],
                "javascript": javascript_result["runtime"],
            },
            "selected_profiles": {
                "python": python_result["execution"]["profile"],
                "javascript": javascript_result["execution"]["profile"],
            },
            "state_equivalence": {
                "equivalent": python_result["state"]["state_root"] == javascript_result["state"]["state_root"],
                "python_root": python_result["state"]["state_root"],
                "javascript_root": javascript_result["state"]["state_root"],
                "format": "hnaf.portable-state.v0.5",
            },
            "interface_equivalence": {
                "equivalent": (python_result.get("interface_projection") or {}).get("semantic_snapshot") == (javascript_result.get("interface_projection") or {}).get("semantic_snapshot"),
                "python_snapshot": (python_result.get("interface_projection") or {}).get("semantic_snapshot"),
                "javascript_snapshot": (javascript_result.get("interface_projection") or {}).get("semantic_snapshot"),
                "format": f"hnaf.adaptive-interface.v{(python_result.get('interface_projection') or {}).get('graph_version', '0.6')}" if python_result.get("interface_projection") else None,
            },
            "capability_equivalence": _capability_conformance(capsule, js_host, host, host_profile, require_signature),
            "comparison": comparison,
        }
    finally:
        if context is not None:
            context.cleanup()
