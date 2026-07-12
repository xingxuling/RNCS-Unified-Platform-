from __future__ import annotations

from pathlib import Path
from typing import Any

from .capabilities import CapabilityBroker, negotiate
from .adaptive_interface import compile_projection, interface_from_capsule_files
from .errors import HNACError
from .execution import DeclarativeExecutor, WasmComponentExecutor, WasmCoreExecutor
from .host import HostProfile, default_host_profile
from .manifest import execution_candidates
from .trace import TraceRecorder
from .trust import verify

RUNTIME_VERSION = "0.8.0"

EXECUTORS = {
    "declarative-v0": DeclarativeExecutor,
    "wasm-core@1": WasmCoreExecutor,
    "wasm-component@1": WasmComponentExecutor,
}


def _verify_and_negotiate(
    capsule: Path,
    host: HostProfile,
    require_signature: bool,
) -> tuple[dict[str, Any], Any]:
    effective_signature = require_signature or bool(host.policies.get("require_signature", False))
    verified = verify(capsule, require_signature=effective_signature)
    plan = negotiate(verified["manifest"], host)
    return verified, plan


def _component_contract_if_selected(verified: dict[str, Any], plan: Any) -> dict[str, Any] | None:
    if plan.execution is None or plan.execution["profile"] != "wasm-component@1":
        return None
    executor = WasmComponentExecutor()
    grants = {item["capability"] for item in plan.grants}
    return executor.inspect_contract(
        verified["files"][plan.execution["entry"]],
        verified["manifest"],
        grants,
    )


def plan_capsule(capsule: Path, *, host: HostProfile | None = None, require_signature: bool = False) -> dict[str, Any]:
    host = host or default_host_profile()
    verified, plan = _verify_and_negotiate(capsule, host, require_signature)
    result = {
        "runtime": RUNTIME_VERSION,
        "app": verified["manifest"]["app"],
        "format_version": verified["manifest"]["format_version"],
        "signature": verified["signature"],
        "integrity_files": len(verified["integrity"]["files"]),
        "negotiation": plan.to_dict(),
    }
    graph = interface_from_capsule_files(verified["manifest"], verified["files"])
    if graph is not None:
        result["interface_projection"] = compile_projection(graph, host)
    contract = _component_contract_if_selected(verified, plan)
    if contract is not None:
        result["component_contract"] = contract
    return result


def contract_capsule(capsule: Path, *, require_signature: bool = False) -> dict[str, Any]:
    verified = verify(capsule, require_signature=require_signature)
    manifest = verified["manifest"]
    candidate = next((item for item in execution_candidates(manifest) if item["profile"] == "wasm-component@1"), None)
    if candidate is None:
        raise HNACError("Capsule has no wasm-component@1 execution candidate")
    declared = {item["id"] for item in manifest["capabilities"]}
    executor = WasmComponentExecutor()
    return {
        "runtime": RUNTIME_VERSION,
        "app": manifest["app"],
        "entry": candidate["entry"],
        "world": candidate.get("world"),
        "contract": executor.inspect_contract(verified["files"][candidate["entry"]], manifest, declared),
    }


def run_capsule(
    capsule: Path,
    *,
    state_root: Path | None = None,
    trace_path: Path | None = None,
    require_signature: bool = False,
    host: HostProfile | None = None,
) -> dict[str, Any]:
    host = host or default_host_profile()
    verified, plan = _verify_and_negotiate(capsule, host, require_signature)
    manifest = verified["manifest"]
    trace = TraceRecorder(trace_path)
    trace.emit("host.context", host=host.to_dict())
    trace.emit("capsule.verified", app_id=manifest["app"]["id"], signature=verified["signature"])
    trace.emit("capability.negotiated", **plan.to_dict())
    if plan.status == "blocked" or plan.execution is None:
        raise HNACError(f"Launch blocked; unresolved={plan.unresolved}; profiles={plan.unsupported_profiles}")

    app_state = state_root or Path.home() / ".hnac" / "apps" / manifest["app"]["id"]
    schema_version = str(manifest.get("state", {}).get("schema_version", "1"))
    broker = CapabilityBroker(manifest["app"]["id"], plan.grants, app_state, trace, schema_version=schema_version)
    profile = plan.execution["profile"]
    executor_type = EXECUTORS.get(profile)
    if executor_type is None:
        raise HNACError(f"No executor registered for {profile}")
    executor = executor_type()
    limits = manifest.get("execution", {}).get("limits", {})
    trace.emit("execution.started", profile=profile, entry=plan.execution["entry"], limits=limits)
    result = executor.execute(verified["files"][plan.execution["entry"]], broker, manifest, limits)
    trace.emit("execution.completed", result=result)
    state_policy = manifest.get("state", {})
    snapshot = None
    if state_policy.get("autosnapshot", manifest.get("format_version") in {"0.5", "0.6", "0.7", "0.8"}):
        snapshot = broker.state.snapshot(label="capsule-run")
    interface_graph = interface_from_capsule_files(manifest, verified["files"])
    interface_projection = compile_projection(interface_graph, host) if interface_graph is not None else None
    if interface_projection is not None:
        trace.emit(
            "interface.projected",
            profile=interface_projection["profile"],
            semantic_snapshot=interface_projection["semantic_snapshot"],
        )
    return {
        "runtime": RUNTIME_VERSION,
        "app": manifest["app"],
        "signature": verified["signature"],
        "negotiation": plan.to_dict(),
        "execution": result,
        "state": broker.state.status(),
        "interface_projection": interface_projection,
        "snapshot": ({
            "snapshot_root": snapshot["snapshot_root"],
            "state_root": snapshot["state_root"],
            "generation": snapshot["generation"],
        } if snapshot is not None else None),
        "trace_events": len(trace.events),
    }


def inspect_capsule(capsule: Path, *, host: HostProfile | None = None) -> dict[str, Any]:
    return plan_capsule(capsule, host=host)
