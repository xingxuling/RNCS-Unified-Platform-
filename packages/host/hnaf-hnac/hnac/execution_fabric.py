from __future__ import annotations

import base64
import copy
import json
import math
import os
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from .errors import HNACError
from .vendor import cnp_v01 as cnp

try:
    from websockets.sync.client import connect as websocket_connect
except Exception:  # pragma: no cover - dependency guard
    websocket_connect = None


EXECUTION_VERSION = "0.8"
EXECUTION_FORMAT = "hnaf.remote-execution-fabric.v0.8"
ATTEMPT_FORMAT = "hnaf.provider-attempt.v0.8"


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_time(value: str | None) -> float:
    if not value:
        return time.time()
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
    except ValueError as exc:
        raise HNACError(f"Invalid ISO-8601 time: {value}") from exc


def atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        handle.write(payload)
        temp = Path(handle.name)
    os.replace(temp, path)


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return copy.deepcopy(default)
    try:
        return json.loads(path.read_text("utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise HNACError(f"Execution metadata is corrupt: {path}") from exc


def _signed_payload(capability: dict[str, Any]) -> dict[str, Any]:
    payload = copy.deepcopy(capability)
    payload.pop("supply_chain", None)
    return payload


def verify_capability_signature(capability: dict[str, Any]) -> dict[str, Any]:
    supply = capability.get("supply_chain")
    if not isinstance(supply, dict):
        raise HNACError(f"Provider capability is unsigned: {capability.get('capability_id', '<unknown>')}")
    if supply.get("algorithm") != "ed25519":
        raise HNACError("Only ed25519 provider signatures are accepted")
    signed_root = cnp.sha256_root(_signed_payload(capability))
    if signed_root != supply.get("signed_root"):
        raise HNACError(f"Provider signed_root mismatch: {capability.get('capability_id')}")
    try:
        public_key = Ed25519PublicKey.from_public_bytes(base64.b64decode(str(supply["public_key_b64"]), validate=True))
        signature = base64.b64decode(str(supply["signature_b64"]), validate=True)
        public_key.verify(signature, signed_root.encode("ascii"))
    except (KeyError, ValueError, InvalidSignature) as exc:
        raise HNACError(f"Provider signature verification failed: {capability.get('capability_id')}") from exc
    return {
        "capability_id": capability.get("capability_id"),
        "signer_id": str(supply.get("signer_id", "")),
        "signed_root": signed_root,
        "algorithm": "ed25519",
        "verified": True,
    }


def verify_provider_registry(providers: list[dict[str, Any]], *, require_signed: bool) -> dict[str, Any]:
    verified: list[dict[str, Any]] = []
    unsigned: list[str] = []
    for provider in providers:
        for capability in provider.get("capabilities", []):
            if capability.get("supply_chain"):
                verified.append(verify_capability_signature(capability))
            else:
                unsigned.append(str(capability.get("capability_id", "unknown")))
    if require_signed and unsigned:
        raise HNACError("Unsigned provider capabilities are forbidden: " + ", ".join(sorted(unsigned)))
    result = {
        "format": "hnaf.provider-supply-chain-verification.v0.8",
        "required": require_signed,
        "verified": sorted(verified, key=lambda item: (str(item["capability_id"]), str(item["signer_id"]))),
        "unsigned": sorted(unsigned),
    }
    result["verification_root"] = cnp.sha256_root(result)
    return result


@dataclass(frozen=True)
class ExecutionPolicy:
    allowed_transports: tuple[str, ...]
    allowed_executables: tuple[str, ...]
    allowed_network_hosts: tuple[str, ...]
    environment_allowlist: tuple[str, ...]
    timeout_ms: int
    max_retries: int
    retry_backoff_ms: int
    max_output_bytes: int
    cpu_millis: int
    memory_mb: int
    network_kb: int
    circuit_failure_threshold: int
    circuit_reset_seconds: int
    idempotency_ttl_seconds: int
    require_signed_providers: bool
    commit_receipts_to_rfe: bool

    @classmethod
    def from_manifest(cls, manifest: dict[str, Any]) -> "ExecutionPolicy":
        raw = manifest.get("execution_fabric") or {}
        quota = raw.get("resource_quota") or {}
        circuit = raw.get("circuit_breaker") or {}
        idem = raw.get("idempotency") or {}
        sandbox = raw.get("sandbox") or {}
        transports = tuple(str(item) for item in raw.get("allowed_transports", ["hnaf-builtin", "reality-one-gateway"]))
        return cls(
            allowed_transports=transports,
            allowed_executables=tuple(str(item) for item in sandbox.get("allowed_executables", [])),
            allowed_network_hosts=tuple(str(item).lower() for item in sandbox.get("allowed_network_hosts", [])),
            environment_allowlist=tuple(str(item) for item in sandbox.get("environment_allowlist", [])),
            timeout_ms=max(1, int(raw.get("timeout_ms", 10_000))),
            max_retries=max(0, int(raw.get("max_retries", 0))),
            retry_backoff_ms=max(0, int(raw.get("retry_backoff_ms", 50))),
            max_output_bytes=max(1, int(sandbox.get("max_output_bytes", 1_048_576))),
            cpu_millis=max(1, int(quota.get("cpu_millis", 10_000))),
            memory_mb=max(8, int(quota.get("memory_mb", 256))),
            network_kb=max(0, int(quota.get("network_kb", 1024))),
            circuit_failure_threshold=max(1, int(circuit.get("failure_threshold", 3))),
            circuit_reset_seconds=max(1, int(circuit.get("reset_seconds", 30))),
            idempotency_ttl_seconds=max(1, int(idem.get("ttl_seconds", 86_400))),
            require_signed_providers=bool(raw.get("require_signed_providers", False)),
            commit_receipts_to_rfe=bool(raw.get("commit_receipts_to_rfe", False)),
        )

    def as_dict(self) -> dict[str, Any]:
        return {
            "allowed_transports": list(self.allowed_transports),
            "allowed_executables": list(self.allowed_executables),
            "allowed_network_hosts": list(self.allowed_network_hosts),
            "environment_allowlist": list(self.environment_allowlist),
            "timeout_ms": self.timeout_ms,
            "max_retries": self.max_retries,
            "retry_backoff_ms": self.retry_backoff_ms,
            "max_output_bytes": self.max_output_bytes,
            "resource_quota": {"cpu_millis": self.cpu_millis, "memory_mb": self.memory_mb, "network_kb": self.network_kb},
            "circuit_breaker": {"failure_threshold": self.circuit_failure_threshold, "reset_seconds": self.circuit_reset_seconds},
            "idempotency": {"ttl_seconds": self.idempotency_ttl_seconds},
            "require_signed_providers": self.require_signed_providers,
            "commit_receipts_to_rfe": self.commit_receipts_to_rfe,
        }


class IdempotencyLedger:
    def __init__(self, root: Path):
        self.path = root / ".hnaf-execution" / "idempotency.json"

    def get(self, key: str, *, now_epoch: float) -> dict[str, Any] | None:
        data = read_json(self.path, {"entries": {}})
        item = data.get("entries", {}).get(key)
        if not isinstance(item, dict):
            return None
        if float(item.get("expires_at_epoch", 0)) < now_epoch:
            data["entries"].pop(key, None)
            atomic_json(self.path, data)
            return None
        return copy.deepcopy(item.get("receipt"))

    def put(self, key: str, receipt: dict[str, Any], *, now_epoch: float, ttl_seconds: int) -> None:
        data = read_json(self.path, {"entries": {}})
        data.setdefault("entries", {})[key] = {
            "expires_at_epoch": int(now_epoch + ttl_seconds),
            "receipt": copy.deepcopy(receipt),
        }
        atomic_json(self.path, data)


class CircuitBreakerStore:
    def __init__(self, root: Path):
        self.path = root / ".hnaf-execution" / "circuits.json"

    def _data(self) -> dict[str, Any]:
        return read_json(self.path, {"providers": {}})

    def state(self, provider_id: str, *, now_epoch: float) -> dict[str, Any]:
        data = self._data()
        item = copy.deepcopy(data.get("providers", {}).get(provider_id, {"failures": 0, "open_until_epoch": 0}))
        if float(item.get("open_until_epoch", 0)) <= now_epoch and item.get("state") == "open":
            item = {"failures": 0, "open_until_epoch": 0, "state": "half-open"}
            data.setdefault("providers", {})[provider_id] = item
            atomic_json(self.path, data)
        return item

    def success(self, provider_id: str) -> None:
        data = self._data()
        data.setdefault("providers", {})[provider_id] = {"failures": 0, "open_until_epoch": 0, "state": "closed"}
        atomic_json(self.path, data)

    def failure(self, provider_id: str, *, now_epoch: float, threshold: int, reset_seconds: int) -> dict[str, Any]:
        data = self._data()
        current = data.setdefault("providers", {}).get(provider_id, {"failures": 0, "open_until_epoch": 0, "state": "closed"})
        failures = int(current.get("failures", 0)) + 1
        opened = failures >= threshold
        item = {
            "failures": failures,
            "open_until_epoch": int(now_epoch + reset_seconds) if opened else 0,
            "state": "open" if opened else "closed",
        }
        data["providers"][provider_id] = item
        atomic_json(self.path, data)
        return item


def _network_host_allowed(url: str, policy: ExecutionPolicy) -> None:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"http", "https", "ws", "wss"} or not parsed.hostname:
        raise HNACError(f"Invalid remote Provider URL: {url}")
    if policy.allowed_network_hosts and parsed.hostname.lower() not in policy.allowed_network_hosts:
        raise HNACError(f"Remote Provider host is outside sandbox allowlist: {parsed.hostname}")


def _enforce_network_budget(request_size: int, response_size: int, policy: ExecutionPolicy) -> None:
    if policy.network_kb <= 0 and request_size + response_size > 0:
        raise HNACError("Network quota is zero")
    if request_size + response_size > policy.network_kb * 1024:
        raise HNACError("Provider exceeded network_kb quota")


def _http_execute(transport: dict[str, Any], payload: dict[str, Any], context: dict[str, Any], policy: ExecutionPolicy) -> Any:
    url = str(transport.get("url", ""))
    _network_host_allowed(url, policy)
    body = json.dumps({"payload": payload, "context": context}, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    headers = {"content-type": "application/json", "accept": "application/json", "idempotency-key": str(context["idempotency_key"])}
    for key, value in (transport.get("headers") or {}).items():
        headers[str(key)] = str(value)
    request = urllib.request.Request(url, data=body, headers=headers, method=str(transport.get("method", "POST")).upper())
    try:
        with urllib.request.urlopen(request, timeout=policy.timeout_ms / 1000) as response:
            raw = response.read(policy.max_output_bytes + 1)
    except (urllib.error.URLError, TimeoutError) as exc:
        raise HNACError(f"HTTP Provider failed: {exc}") from exc
    if len(raw) > policy.max_output_bytes:
        raise HNACError("HTTP Provider exceeded max_output_bytes")
    _enforce_network_budget(len(body), len(raw), policy)
    try:
        return json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HNACError("HTTP Provider returned invalid UTF-8 JSON") from exc


def _websocket_execute(transport: dict[str, Any], payload: dict[str, Any], context: dict[str, Any], policy: ExecutionPolicy) -> Any:
    if websocket_connect is None:
        raise HNACError("websockets package is unavailable")
    url = str(transport.get("url", ""))
    _network_host_allowed(url, policy)
    body = json.dumps({"payload": payload, "context": context}, ensure_ascii=False, separators=(",", ":"))
    try:
        with websocket_connect(url, open_timeout=policy.timeout_ms / 1000, close_timeout=1) as socket:
            socket.send(body)
            raw = socket.recv(timeout=policy.timeout_ms / 1000)
    except Exception as exc:
        raise HNACError(f"WebSocket Provider failed: {exc}") from exc
    if isinstance(raw, bytes):
        raw_bytes = raw
    else:
        raw_bytes = str(raw).encode("utf-8")
    if len(raw_bytes) > policy.max_output_bytes:
        raise HNACError("WebSocket Provider exceeded max_output_bytes")
    _enforce_network_budget(len(body.encode("utf-8")), len(raw_bytes), policy)
    try:
        return json.loads(raw_bytes.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HNACError("WebSocket Provider returned invalid UTF-8 JSON") from exc


def _resource_limiter(policy: ExecutionPolicy) -> Callable[[], None] | None:
    if os.name != "posix":
        return None
    import resource

    def apply() -> None:
        cpu_seconds = max(1, math.ceil(policy.cpu_millis / 1000))
        memory_bytes = policy.memory_mb * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds))
        resource.setrlimit(resource.RLIMIT_AS, (memory_bytes, memory_bytes))
        resource.setrlimit(resource.RLIMIT_FSIZE, (policy.max_output_bytes, policy.max_output_bytes))
        resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))

    return apply


def _process_execute(transport: dict[str, Any], payload: dict[str, Any], context: dict[str, Any], policy: ExecutionPolicy) -> Any:
    command = transport.get("command")
    if not isinstance(command, list) or not command or not all(isinstance(item, str) and item for item in command):
        raise HNACError("Process Provider command must be a non-empty string array")
    executable = command[0]
    resolved = str(Path(executable).resolve()) if os.path.sep in executable else executable
    allowed = set(policy.allowed_executables)
    if allowed and executable not in allowed and resolved not in allowed and Path(executable).name not in allowed:
        raise HNACError(f"Process executable is outside sandbox allowlist: {executable}")
    env = {key: os.environ[key] for key in policy.environment_allowlist if key in os.environ}
    env.update({"HNAF_IDEMPOTENCY_KEY": str(context["idempotency_key"]), "HNAF_EXECUTION_VERSION": EXECUTION_VERSION})
    request = json.dumps({"payload": payload, "context": context}, ensure_ascii=False, separators=(",", ":")) + "\n"
    cwd = transport.get("cwd")
    try:
        process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env,
            cwd=str(cwd) if cwd else None,
            start_new_session=True,
        )
    except OSError as exc:
        raise HNACError(f"Process Provider could not start: {exc}") from exc
    if os.name == "posix":
        try:
            import resource
            if hasattr(resource, "prlimit"):
                cpu_seconds = max(1, math.ceil(policy.cpu_millis / 1000))
                memory_bytes = policy.memory_mb * 1024 * 1024
                resource.prlimit(process.pid, resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds))
                resource.prlimit(process.pid, resource.RLIMIT_AS, (memory_bytes, memory_bytes))
                resource.prlimit(process.pid, resource.RLIMIT_FSIZE, (policy.max_output_bytes, policy.max_output_bytes))
                resource.prlimit(process.pid, resource.RLIMIT_NOFILE, (64, 64))
        except (OSError, ValueError):
            process.kill()
            process.wait(timeout=1)
            raise HNACError("Process Provider resource limits could not be applied")
    try:
        stdout, stderr = process.communicate(request, timeout=policy.timeout_ms / 1000)
    except subprocess.TimeoutExpired as exc:
        process.kill()
        process.communicate()
        raise HNACError("Process Provider timed out") from exc
    raw = stdout.encode("utf-8")
    if len(raw) > policy.max_output_bytes:
        raise HNACError("Process Provider exceeded max_output_bytes")
    if process.returncode != 0:
        raise HNACError(f"Process Provider exited with {process.returncode}: {stderr[:4096].strip()}")
    try:
        return json.loads(stdout)
    except json.JSONDecodeError as exc:
        raise HNACError("Process Provider returned invalid JSON") from exc


def execute_transport(
    *,
    offer: dict[str, Any],
    payload: dict[str, Any],
    context: dict[str, Any],
    policy: ExecutionPolicy,
    builtin: Callable[[str], Any],
    gateway: Callable[[dict[str, Any]], Any] | None = None,
) -> Any:
    transport = offer.get("transport") or {}
    kind = str(transport.get("kind", "local"))
    if kind not in policy.allowed_transports:
        raise HNACError(f"Provider transport is forbidden by execution policy: {kind}")
    if kind in {"hnaf-builtin", "local"}:
        handler = str(transport.get("handler", ""))
        if not handler:
            raise HNACError("Builtin Provider has no handler")
        return builtin(handler)
    if kind == "reality-one-gateway":
        if gateway is None:
            raise HNACError("Reality One Gateway transport is unavailable")
        return gateway(transport)
    if kind == "http":
        return _http_execute(transport, payload, context, policy)
    if kind == "websocket":
        return _websocket_execute(transport, payload, context, policy)
    if kind in {"stdio", "local-process"}:
        return _process_execute(transport, payload, context, policy)
    raise HNACError(f"Unsupported Provider transport: {kind}")


def execute_authorized_chain(
    *,
    offers: list[dict[str, Any]],
    payload: dict[str, Any],
    policy: ExecutionPolicy,
    state_root: Path,
    idempotency_key: str,
    now: str | None,
    builtin_factory: Callable[[dict[str, Any]], Callable[[str], Any]],
    gateway_factory: Callable[[dict[str, Any]], Callable[[dict[str, Any]], Any] | None],
    cancel_path: Path | None = None,
) -> dict[str, Any]:
    effective_now = now or utc_now()
    now_epoch = parse_time(effective_now)
    circuits = CircuitBreakerStore(state_root)
    attempts: list[dict[str, Any]] = []
    selected: dict[str, Any] | None = None
    output: Any = None

    for offer in offers:
        provider_id = str(offer.get("provider_id", "unknown-provider"))
        circuit = circuits.state(provider_id, now_epoch=now_epoch)
        if circuit.get("state") == "open" and float(circuit.get("open_until_epoch", 0)) > now_epoch:
            attempts.append({
                "format": ATTEMPT_FORMAT,
                "provider_id": provider_id,
                "capability_id": offer.get("capability_id"),
                "status": "skipped-circuit-open",
                "circuit": circuit,
            })
            continue
        for retry_index in range(policy.max_retries + 1):
            if cancel_path is not None and cancel_path.exists():
                attempts.append({
                    "format": ATTEMPT_FORMAT,
                    "provider_id": provider_id,
                    "capability_id": offer.get("capability_id"),
                    "status": "cancelled",
                    "retry_index": retry_index,
                })
                return {"status": "cancelled", "attempts": attempts, "selected": None, "result": None}
            started = time.perf_counter()
            attempt = {
                "format": ATTEMPT_FORMAT,
                "provider_id": provider_id,
                "capability_id": offer.get("capability_id"),
                "capability_version": offer.get("capability_version"),
                "descriptor_root": offer.get("descriptor_root"),
                "transport": copy.deepcopy(offer.get("transport", {})),
                "retry_index": retry_index,
                "sandbox": {"policy_root": cnp.sha256_root(policy.as_dict()), "deny_by_default": True},
            }
            context = {
                "format": EXECUTION_FORMAT,
                "idempotency_key": idempotency_key,
                "provider_id": provider_id,
                "capability_id": offer.get("capability_id"),
                "deadline_ms": policy.timeout_ms,
                "issued_at": effective_now,
            }
            try:
                output = execute_transport(
                    offer=offer,
                    payload=payload,
                    context=context,
                    policy=policy,
                    builtin=builtin_factory(offer),
                    gateway=gateway_factory(offer),
                )
                duration = max(0, int((time.perf_counter() - started) * 1000))
                attempt.update({"status": "succeeded", "duration_ms": duration, "result_root": cnp.sha256_root(output)})
                attempts.append(attempt)
                circuits.success(provider_id)
                selected = offer
                break
            except Exception as exc:
                duration = max(0, int((time.perf_counter() - started) * 1000))
                circuit_after = circuits.failure(
                    provider_id,
                    now_epoch=now_epoch,
                    threshold=policy.circuit_failure_threshold,
                    reset_seconds=policy.circuit_reset_seconds,
                )
                attempt.update({
                    "status": "failed",
                    "duration_ms": duration,
                    "error": {"type": type(exc).__name__, "message": str(exc)},
                    "circuit": circuit_after,
                })
                attempts.append(attempt)
                if retry_index < policy.max_retries and policy.retry_backoff_ms:
                    time.sleep(policy.retry_backoff_ms / 1000)
        if selected is not None:
            break
    return {
        "status": "executed" if selected is not None else "failed",
        "attempts": attempts,
        "selected": copy.deepcopy(selected),
        "result": output if selected is not None else None,
    }
