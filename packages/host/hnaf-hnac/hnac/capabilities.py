from __future__ import annotations

import datetime as dt
import json
import platform
import secrets
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from .errors import HNACError
from .host import HostProfile, default_host_profile
from .manifest import execution_candidates
from .state_fabric import PortableStateStore
from .trace import TraceRecorder

AVAILABLE_EXECUTION_PROFILES = {"wasm-component@1", "wasm-core@1", "declarative-v0"}

CAPABILITY_CATALOG: dict[str, dict[str, Any]] = {
    "host.log": {"versions": ["1"], "methods": ["write"]},
    "host.clock": {"versions": ["1"], "methods": ["now", "now-unix-ms"]},
    "environment.summary": {"versions": ["1"], "methods": ["get"]},
    "storage.kv": {"versions": ["1", "2"], "methods": ["get", "set", "delete"]},
    "storage.state": {"versions": ["1"], "methods": ["get", "set", "delete", "snapshot", "status"]},
}

IMPORT_TO_CAPABILITY = {
    "log_write": "host.log",
    "clock_now": "host.clock",
    "environment_summary": "environment.summary",
    "kv_get": "storage.kv",
    "kv_set": "storage.kv",
}


@dataclass(frozen=True)
class CapabilityLease:
    lease_id: str
    capability: str
    version: str
    scope: str
    issued_utc: str
    expires: str


@dataclass
class NegotiationPlan:
    status: str
    host: dict[str, Any]
    execution: dict[str, Any] | None
    grants: list[dict[str, Any]]
    fallbacks: list[dict[str, str]]
    unresolved: list[str]
    unsupported_profiles: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _select_version(requested: str | None, versions: list[str]) -> str | None:
    if not versions:
        return None
    if requested is None:
        return versions[-1]
    requested_major = requested.split(".", 1)[0]
    compatible = [item for item in versions if item.split(".", 1)[0] == requested_major]
    return compatible[-1] if compatible else None


def negotiate(manifest: dict[str, Any], host: HostProfile | None = None) -> NegotiationPlan:
    host = host or default_host_profile()
    selected = None
    unsupported_profiles: list[str] = []
    for candidate in execution_candidates(manifest):
        profile = candidate["profile"]
        if profile in AVAILABLE_EXECUTION_PROFILES and profile in host.execution_profiles:
            selected = candidate
            break
        unsupported_profiles.append(profile)

    grants: list[dict[str, Any]] = []
    fallbacks: list[dict[str, str]] = []
    unresolved: list[str] = []
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    for request in manifest["capabilities"]:
        cap_id = request["id"]
        implementation = CAPABILITY_CATALOG.get(cap_id)
        host_versions = host.capabilities.get(cap_id, [])
        implemented_versions = implementation["versions"] if implementation else []
        mutually_available = [version for version in host_versions if version in implemented_versions]
        selected_version = _select_version(request.get("version"), mutually_available)
        if selected_version is not None:
            lease = CapabilityLease(
                lease_id=secrets.token_hex(12),
                capability=cap_id,
                version=selected_version,
                scope=request.get("scope", "session"),
                issued_utc=now,
                expires="session-end",
            )
            grants.append(asdict(lease))
        elif request["required"]:
            unresolved.append(cap_id)
        else:
            fallbacks.append({"capability": cap_id, "fallback": request.get("fallback", "unavailable")})

    if selected is None:
        unresolved.append("execution-profile")
    status = "blocked" if unresolved else ("degraded" if fallbacks else "ready")
    host_summary = {
        "id": host.id,
        "family": host.family,
        "interaction_modes": host.interaction_modes,
        "resources": host.resources,
        "policies": host.policies,
    }
    return NegotiationPlan(status, host_summary, selected, grants, fallbacks, unresolved, unsupported_profiles)


class CapabilityBroker:
    def __init__(self, app_id: str, grants: list[dict[str, Any]], state_root: Path, trace: TraceRecorder, *, schema_version: str = "1"):
        self.app_id = app_id
        self.grants = {item["capability"]: item for item in grants}
        self.state_root = state_root
        self.trace = trace
        self.state_root.mkdir(parents=True, exist_ok=True)
        self.state = PortableStateStore(self.state_root, app_id, schema_version=schema_version)

    def _require(self, capability: str, method: str) -> None:
        if capability not in self.grants:
            self.trace.emit("capability.denied", capability=capability, method=method, reason="no-lease")
            raise HNACError(f"Undeclared or ungranted capability use: {capability}")
        methods = CAPABILITY_CATALOG[capability]["methods"]
        if method not in methods:
            self.trace.emit("capability.denied", capability=capability, method=method, reason="unknown-method")
            raise HNACError(f"Unsupported capability method: {capability}/{method}")

    def call(self, capability: str, method: str, args: dict[str, Any]) -> Any:
        self._require(capability, method)
        self.trace.emit("capability.call", capability=capability, method=method, lease_id=self.grants[capability]["lease_id"])
        if capability == "host.log" and method == "write":
            message = str(args.get("message", ""))
            print(message, file=sys.stderr)
            return {"written": True}
        if capability == "host.clock" and method == "now":
            return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
        if capability == "host.clock" and method == "now-unix-ms":
            return int(dt.datetime.now(dt.timezone.utc).timestamp() * 1000)
        if capability == "environment.summary" and method == "get":
            return {
                "system": platform.system(),
                "release": platform.release(),
                "machine": platform.machine(),
                "runtime": "0.8.0",
                "execution": "wasmtime-component-or-core",
            }
        if capability in {"storage.kv", "storage.state"}:
            partition = str(args.get("partition", "portable"))
            key = str(args.get("key", ""))
            if method == "get":
                return self.state.get(key, args.get("default", ""), partition=partition)
            if method == "set":
                return self.state.set(key, args.get("value"), partition=partition)
            if method == "delete":
                return self.state.delete(key, partition=partition)
            if method == "snapshot":
                return self.state.snapshot(label=str(args.get("label")) if args.get("label") is not None else None)
            if method == "status":
                return self.state.status()
        raise HNACError(f"Unsupported capability method: {capability}/{method}")
