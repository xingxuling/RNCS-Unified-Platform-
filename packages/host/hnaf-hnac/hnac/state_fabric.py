from __future__ import annotations

import base64
import copy
import datetime as dt
import json
import os
import secrets
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from .errors import HNACError
from .util import canonical_json, sha256_bytes

STATE_FORMAT = "hnaf.portable-state.v0.5"
BUNDLE_FORMAT = "hnaf.state-bundle.v0.5"
MIGRATION_FORMAT = "hnaf.state-migrations.v0.5"
PERSISTED_PARTITIONS = ("portable", "device_private", "secret", "cache")
ALL_PARTITIONS = (*PERSISTED_PARTITIONS, "ephemeral")
EXPORTABLE_PARTITIONS = ("portable", "cache")
PBKDF2_ITERATIONS = 240_000


def _utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def _json_clone(value: Any) -> Any:
    try:
        return json.loads(json.dumps(value, ensure_ascii=False, sort_keys=True))
    except (TypeError, ValueError) as exc:
        raise HNACError("State values must be JSON-compatible") from exc


def _validate_partition(partition: str) -> str:
    if partition not in ALL_PARTITIONS:
        raise HNACError(f"Unknown state partition: {partition}")
    return partition


def _validate_mapping(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise HNACError(f"{label} must be a JSON object")
    return _json_clone(value)


def compute_state_root(app_id: str, schema_version: str, partitions: dict[str, dict[str, Any]]) -> str:
    """Return a cross-host content root for semantic state.

    Replica identity, timestamps, generation and history are deliberately excluded.
    Equivalent state therefore has the same root on Python, Node and browser hosts.
    """
    normalized = {
        name: _validate_mapping(partitions.get(name, {}), f"partition {name}")
        for name in sorted(partitions)
        if name in ALL_PARTITIONS and name != "ephemeral"
    }
    payload = {
        "format": STATE_FORMAT,
        "app_id": str(app_id),
        "schema_version": str(schema_version),
        "partitions": normalized,
    }
    return sha256_bytes(canonical_json(payload))


def _derive_key(password: str, salt: bytes, iterations: int = PBKDF2_ITERATIONS) -> bytes:
    if not password:
        raise HNACError("A non-empty password is required for secret state")
    return PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=iterations,
    ).derive(password.encode("utf-8"))


def _encrypt_json(value: Any, password: str, *, aad: bytes) -> dict[str, Any]:
    salt = os.urandom(16)
    nonce = os.urandom(12)
    key = _derive_key(password, salt)
    ciphertext = AESGCM(key).encrypt(nonce, canonical_json(value), aad)
    return {
        "algorithm": "aes-256-gcm",
        "kdf": "pbkdf2-hmac-sha256",
        "iterations": PBKDF2_ITERATIONS,
        "salt": base64.b64encode(salt).decode("ascii"),
        "nonce": base64.b64encode(nonce).decode("ascii"),
        "ciphertext": base64.b64encode(ciphertext).decode("ascii"),
    }


def _decrypt_json(envelope: dict[str, Any], password: str, *, aad: bytes) -> Any:
    try:
        if envelope.get("algorithm") != "aes-256-gcm" or envelope.get("kdf") != "pbkdf2-hmac-sha256":
            raise HNACError("Unsupported secret-state encryption envelope")
        iterations = int(envelope["iterations"])
        if iterations < 100_000:
            raise HNACError("Secret-state KDF is below the minimum work factor")
        salt = base64.b64decode(envelope["salt"], validate=True)
        nonce = base64.b64decode(envelope["nonce"], validate=True)
        ciphertext = base64.b64decode(envelope["ciphertext"], validate=True)
        plaintext = AESGCM(_derive_key(password, salt, iterations)).decrypt(nonce, ciphertext, aad)
        return json.loads(plaintext.decode("utf-8"))
    except (KeyError, ValueError, UnicodeDecodeError, json.JSONDecodeError, InvalidTag) as exc:
        raise HNACError("Secret-state decryption or authentication failed") from exc


def _get_path(root: dict[str, Any], path: str) -> tuple[bool, Any]:
    parts = [part for part in path.split(".") if part]
    cursor: Any = root
    for part in parts:
        if not isinstance(cursor, dict) or part not in cursor:
            return False, None
        cursor = cursor[part]
    return True, cursor


def _set_path(root: dict[str, Any], path: str, value: Any) -> None:
    parts = [part for part in path.split(".") if part]
    if not parts:
        raise HNACError("Migration path cannot be empty")
    cursor = root
    for part in parts[:-1]:
        child = cursor.get(part)
        if child is None:
            child = {}
            cursor[part] = child
        if not isinstance(child, dict):
            raise HNACError(f"Migration path crosses a non-object value: {path}")
        cursor = child
    cursor[parts[-1]] = _json_clone(value)


def _delete_path(root: dict[str, Any], path: str) -> None:
    parts = [part for part in path.split(".") if part]
    if not parts:
        raise HNACError("Migration path cannot be empty")
    cursor = root
    for part in parts[:-1]:
        child = cursor.get(part)
        if not isinstance(child, dict):
            return
        cursor = child
    cursor.pop(parts[-1], None)


@dataclass(frozen=True)
class MigrationEdge:
    source: str
    target: str
    operations: tuple[dict[str, Any], ...]


class MigrationGraph:
    def __init__(self, app_id: str, edges: Iterable[MigrationEdge] = ()):
        self.app_id = app_id
        self._edges: dict[tuple[str, str], MigrationEdge] = {}
        for edge in edges:
            self.add(edge.source, edge.target, list(edge.operations))

    def add(self, source: str, target: str, operations: list[dict[str, Any]]) -> None:
        key = (str(source), str(target))
        if key in self._edges:
            raise HNACError(f"Duplicate migration edge: {source} -> {target}")
        if source == target:
            raise HNACError("Migration edge cannot target the same schema version")
        normalized = tuple(_json_clone(operation) for operation in operations)
        self._edges[key] = MigrationEdge(str(source), str(target), normalized)

    def path(self, source: str, target: str) -> list[MigrationEdge]:
        source, target = str(source), str(target)
        if source == target:
            return []
        queue: deque[tuple[str, list[MigrationEdge]]] = deque([(source, [])])
        visited = {source}
        adjacency: dict[str, list[MigrationEdge]] = {}
        for edge in self._edges.values():
            adjacency.setdefault(edge.source, []).append(edge)
        for values in adjacency.values():
            values.sort(key=lambda item: item.target)
        while queue:
            current, route = queue.popleft()
            for edge in adjacency.get(current, []):
                if edge.target == target:
                    return [*route, edge]
                if edge.target not in visited:
                    visited.add(edge.target)
                    queue.append((edge.target, [*route, edge]))
        raise HNACError(f"No deterministic migration path: {source} -> {target}")

    def migrate(
        self,
        partitions: dict[str, dict[str, Any]],
        source: str,
        target: str,
    ) -> tuple[dict[str, dict[str, Any]], list[dict[str, Any]]]:
        result = _json_clone(partitions)
        applied: list[dict[str, Any]] = []
        for edge in self.path(source, target):
            for index, operation in enumerate(edge.operations):
                op = operation.get("op")
                partition = _validate_partition(str(operation.get("partition", "portable")))
                if partition == "ephemeral":
                    raise HNACError("Migrations cannot target ephemeral state")
                target_map = result.setdefault(partition, {})
                if op == "set":
                    _set_path(target_map, str(operation["path"]), operation.get("value"))
                elif op == "delete":
                    _delete_path(target_map, str(operation["path"]))
                elif op in {"rename", "copy"}:
                    found, value = _get_path(target_map, str(operation["from"]))
                    if found:
                        _set_path(target_map, str(operation["to"]), value)
                        if op == "rename":
                            _delete_path(target_map, str(operation["from"]))
                else:
                    raise HNACError(f"Unknown migration operation at {edge.source}->{edge.target}#{index}: {op}")
            applied.append({
                "from": edge.source,
                "to": edge.target,
                "operations": len(edge.operations),
                "edge_root": sha256_bytes(canonical_json({
                    "from": edge.source,
                    "to": edge.target,
                    "operations": list(edge.operations),
                })),
            })
        return result, applied

    @classmethod
    def load(cls, path: Path) -> "MigrationGraph":
        try:
            raw = json.loads(path.read_text("utf-8"))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise HNACError(f"Invalid migration graph: {path}") from exc
        if raw.get("format") != MIGRATION_FORMAT or not isinstance(raw.get("migrations"), list):
            raise HNACError("Unsupported migration graph format")
        graph = cls(str(raw["app_id"]))
        for edge in raw["migrations"]:
            graph.add(str(edge["from"]), str(edge["to"]), list(edge.get("operations", [])))
        return graph


class PortableStateStore:
    """Partitioned, content-addressed application state.

    The root directory is host-local. Only explicit export bundles cross host boundaries.
    Device-private and ephemeral state are never included in bundles. Secret state can only
    cross the boundary inside an authenticated encrypted envelope.
    """

    def __init__(
        self,
        root: Path,
        app_id: str,
        *,
        schema_version: str = "1",
        replica_id: str | None = None,
    ):
        self.root = Path(root)
        self.app_id = str(app_id)
        self.metadata_path = self.root / "metadata.json"
        self.partitions_dir = self.root / "partitions"
        self.snapshots_dir = self.root / "snapshots"
        self.conflicts_dir = self.root / "conflicts"
        self.legacy_kv_path = self.root / "kv.json"
        self._ephemeral: dict[str, Any] = {}
        self.root.mkdir(parents=True, exist_ok=True)
        self.partitions_dir.mkdir(parents=True, exist_ok=True)
        self.snapshots_dir.mkdir(parents=True, exist_ok=True)
        self.conflicts_dir.mkdir(parents=True, exist_ok=True)
        if self.metadata_path.exists():
            self.metadata = self._read_json(self.metadata_path, "state metadata")
            if self.metadata.get("format") != STATE_FORMAT:
                raise HNACError("Unsupported local state format")
            if self.metadata.get("app_id") != self.app_id:
                raise HNACError("State root belongs to a different application")
            if schema_version != "1" and str(self.metadata.get("schema_version")) != str(schema_version):
                raise HNACError("State schema version differs from the requested runtime schema")
        else:
            self.metadata = {
                "format": STATE_FORMAT,
                "app_id": self.app_id,
                "schema_version": str(schema_version),
                "replica_id": replica_id or f"replica-{secrets.token_hex(12)}",
                "generation": 0,
                "current_snapshot_root": None,
                "created_utc": _utc_now(),
                "updated_utc": _utc_now(),
            }
            self._write_json(self.metadata_path, self.metadata)
        self._adopt_legacy_kv()
        for partition in PERSISTED_PARTITIONS:
            path = self._partition_path(partition)
            if not path.exists():
                self._write_json(path, {})

    @property
    def schema_version(self) -> str:
        return str(self.metadata["schema_version"])

    @property
    def replica_id(self) -> str:
        return str(self.metadata["replica_id"])

    def _partition_path(self, partition: str) -> Path:
        _validate_partition(partition)
        if partition == "ephemeral":
            raise HNACError("Ephemeral state has no persisted path")
        return self.partitions_dir / f"{partition}.json"

    @staticmethod
    def _read_json(path: Path, label: str) -> dict[str, Any]:
        try:
            value = json.loads(path.read_text("utf-8"))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise HNACError(f"Invalid {label}: {path}") from exc
        return _validate_mapping(value, label)

    @staticmethod
    def _write_json(path: Path, value: Any) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        temp = path.with_suffix(path.suffix + ".tmp")
        temp.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True), "utf-8")
        os.replace(temp, path)

    def _adopt_legacy_kv(self) -> None:
        portable_path = self._partition_path("portable")
        if portable_path.exists() or not self.legacy_kv_path.exists():
            return
        legacy = self._read_json(self.legacy_kv_path, "legacy kv state")
        self._write_json(portable_path, legacy)

    def _mirror_legacy_kv(self, value: dict[str, Any]) -> None:
        self._write_json(self.legacy_kv_path, value)

    def read_partition(self, partition: str) -> dict[str, Any]:
        partition = _validate_partition(partition)
        if partition == "ephemeral":
            return _json_clone(self._ephemeral)
        return self._read_json(self._partition_path(partition), f"{partition} partition")

    def write_partition(self, partition: str, value: dict[str, Any]) -> None:
        partition = _validate_partition(partition)
        normalized = _validate_mapping(value, f"{partition} partition")
        if partition == "ephemeral":
            self._ephemeral = normalized
            return
        self._write_json(self._partition_path(partition), normalized)
        if partition == "portable":
            self._mirror_legacy_kv(normalized)
        self.metadata["updated_utc"] = _utc_now()
        self._write_json(self.metadata_path, self.metadata)

    def get(self, key: str, default: Any = None, *, partition: str = "portable") -> Any:
        values = self.read_partition(partition)
        return _json_clone(values.get(str(key), default))

    def set(self, key: str, value: Any, *, partition: str = "portable") -> dict[str, Any]:
        values = self.read_partition(partition)
        values[str(key)] = _json_clone(value)
        self.write_partition(partition, values)
        return {"stored": True, "partition": partition, "key": str(key), "state_root": self.state_root()}

    def delete(self, key: str, *, partition: str = "portable") -> dict[str, Any]:
        values = self.read_partition(partition)
        existed = str(key) in values
        values.pop(str(key), None)
        self.write_partition(partition, values)
        return {"deleted": existed, "partition": partition, "key": str(key), "state_root": self.state_root()}

    def persisted_partitions(self, *, include_cache: bool = True) -> dict[str, dict[str, Any]]:
        names = [name for name in PERSISTED_PARTITIONS if include_cache or name != "cache"]
        return {name: self.read_partition(name) for name in names}

    def state_root(self, *, include_cache: bool = True) -> str:
        return compute_state_root(self.app_id, self.schema_version, self.persisted_partitions(include_cache=include_cache))

    def snapshot(self, *, label: str | None = None) -> dict[str, Any]:
        partitions = self.persisted_partitions(include_cache=True)
        generation = int(self.metadata.get("generation", 0)) + 1
        core = {
            "format": STATE_FORMAT,
            "app_id": self.app_id,
            "schema_version": self.schema_version,
            "replica_id": self.replica_id,
            "generation": generation,
            "parent_snapshot_root": self.metadata.get("current_snapshot_root"),
            "state_root": compute_state_root(self.app_id, self.schema_version, partitions),
            "partitions": partitions,
            "label": label,
        }
        snapshot_root = sha256_bytes(canonical_json(core))
        record = {**core, "snapshot_root": snapshot_root, "created_utc": _utc_now()}
        self._write_json(self.snapshots_dir / f"{snapshot_root}.json", record)
        self.metadata["generation"] = generation
        self.metadata["current_snapshot_root"] = snapshot_root
        self.metadata["updated_utc"] = _utc_now()
        self._write_json(self.metadata_path, self.metadata)
        return record

    def restore(self, snapshot_root: str) -> dict[str, Any]:
        record = self._read_json(self.snapshots_dir / f"{snapshot_root}.json", "state snapshot")
        expected = record.pop("created_utc", None)
        declared_root = record.pop("snapshot_root", None)
        actual_root = sha256_bytes(canonical_json(record))
        if declared_root != snapshot_root or actual_root != snapshot_root:
            raise HNACError("State snapshot root mismatch")
        if record.get("app_id") != self.app_id:
            raise HNACError("Snapshot belongs to a different application")
        for partition in PERSISTED_PARTITIONS:
            self.write_partition(partition, record.get("partitions", {}).get(partition, {}))
        self.metadata["schema_version"] = str(record["schema_version"])
        self.metadata["generation"] = int(record["generation"])
        self.metadata["current_snapshot_root"] = snapshot_root
        self.metadata["updated_utc"] = _utc_now()
        self._write_json(self.metadata_path, self.metadata)
        return {"restored": True, "snapshot_root": snapshot_root, "state_root": self.state_root(), "created_utc": expected}

    def export_bundle(
        self,
        output: Path,
        *,
        include_cache: bool = False,
        include_secret: bool = False,
        password: str | None = None,
    ) -> dict[str, Any]:
        portable = self.read_partition("portable")
        plain_partitions: dict[str, dict[str, Any]] = {"portable": portable}
        if include_cache:
            plain_partitions["cache"] = self.read_partition("cache")
        core: dict[str, Any] = {
            "format": BUNDLE_FORMAT,
            "app_id": self.app_id,
            "schema_version": self.schema_version,
            "source_replica_id": self.replica_id,
            "source_generation": int(self.metadata.get("generation", 0)),
            "source_snapshot_root": self.metadata.get("current_snapshot_root"),
            "partitions": plain_partitions,
            "excluded_partitions": ["device_private", "ephemeral", *([] if include_secret else ["secret"])],
        }
        if include_secret:
            if password is None:
                raise HNACError("Secret export requires a password")
            aad = canonical_json({
                "format": BUNDLE_FORMAT,
                "app_id": self.app_id,
                "schema_version": self.schema_version,
                "source_replica_id": self.replica_id,
            })
            core["secret_envelope"] = _encrypt_json(self.read_partition("secret"), password, aad=aad)
        bundle_root = sha256_bytes(canonical_json(core))
        bundle = {**core, "bundle_root": bundle_root, "created_utc": _utc_now()}
        self._write_json(Path(output), bundle)
        return {
            "output": str(output),
            "bundle_root": bundle_root,
            "state_root": compute_state_root(self.app_id, self.schema_version, plain_partitions),
            "partitions": sorted(plain_partitions),
            "secret_encrypted": include_secret,
        }

    @staticmethod
    def verify_bundle(path: Path) -> dict[str, Any]:
        try:
            bundle = json.loads(Path(path).read_text("utf-8"))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise HNACError(f"Invalid state bundle: {path}") from exc
        if bundle.get("format") != BUNDLE_FORMAT:
            raise HNACError("Unsupported state bundle format")
        declared = bundle.get("bundle_root")
        core = {key: value for key, value in bundle.items() if key not in {"bundle_root", "created_utc"}}
        actual = sha256_bytes(canonical_json(core))
        if declared != actual:
            raise HNACError("State bundle root mismatch")
        partitions = bundle.get("partitions")
        if not isinstance(partitions, dict) or "portable" not in partitions:
            raise HNACError("State bundle must contain the portable partition")
        forbidden = {"device_private", "ephemeral"}.intersection(partitions)
        if forbidden:
            raise HNACError(f"State bundle leaks non-exportable partitions: {sorted(forbidden)}")
        return bundle

    @staticmethod
    def _merge_maps(
        local: dict[str, Any],
        remote: dict[str, Any],
        *,
        policy: str,
        partition: str,
        bundle_root: str,
    ) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        conflicts: list[dict[str, Any]] = []
        keys = sorted(set(local) | set(remote))
        merged: dict[str, Any] = {}
        for key in keys:
            has_local, has_remote = key in local, key in remote
            if has_local and has_remote and local[key] != remote[key]:
                record_core = {
                    "partition": partition,
                    "key": key,
                    "local": local[key],
                    "remote": remote[key],
                    "source_bundle_root": bundle_root,
                }
                conflicts.append({**record_core, "conflict_root": sha256_bytes(canonical_json(record_core))})
                merged[key] = remote[key] if policy == "prefer-remote" else local[key]
            elif has_remote:
                merged[key] = remote[key]
            else:
                merged[key] = local[key]
        return merged, conflicts

    def import_bundle(
        self,
        path: Path,
        *,
        password: str | None = None,
        policy: str = "reject",
        migrations: MigrationGraph | None = None,
    ) -> dict[str, Any]:
        if policy not in {"reject", "prefer-local", "prefer-remote", "record-conflicts"}:
            raise HNACError(f"Unknown reconciliation policy: {policy}")
        bundle = self.verify_bundle(path)
        if bundle["app_id"] != self.app_id:
            raise HNACError("State bundle belongs to a different application")
        incoming = _json_clone(bundle["partitions"])
        if "secret_envelope" in bundle:
            if password is None:
                raise HNACError("This state bundle contains encrypted secret state")
            aad = canonical_json({
                "format": BUNDLE_FORMAT,
                "app_id": bundle["app_id"],
                "schema_version": bundle["schema_version"],
                "source_replica_id": bundle["source_replica_id"],
            })
            incoming["secret"] = _validate_mapping(
                _decrypt_json(bundle["secret_envelope"], password, aad=aad),
                "decrypted secret partition",
            )
        source_schema = str(bundle["schema_version"])
        migration_report: list[dict[str, Any]] = []
        if source_schema != self.schema_version:
            if migrations is None or migrations.app_id != self.app_id:
                raise HNACError(f"State migration required: {source_schema} -> {self.schema_version}")
            incoming, migration_report = migrations.migrate(incoming, source_schema, self.schema_version)

        local_portable = self.read_partition("portable")
        remote_portable = _validate_mapping(incoming.get("portable", {}), "portable partition")
        if policy == "reject" and local_portable and local_portable != remote_portable:
            raise HNACError("Portable state conflict; select an explicit reconciliation policy")

        all_conflicts: list[dict[str, Any]] = []
        for partition in ("portable", "secret", "cache"):
            if partition not in incoming:
                continue
            local = self.read_partition(partition)
            remote = _validate_mapping(incoming[partition], f"incoming {partition} partition")
            merge_policy = "prefer-remote" if policy == "reject" else policy
            merged, conflicts = self._merge_maps(
                local,
                remote,
                policy=merge_policy,
                partition=partition,
                bundle_root=bundle["bundle_root"],
            )
            self.write_partition(partition, merged)
            all_conflicts.extend(conflicts)

        for conflict in all_conflicts:
            self._write_json(self.conflicts_dir / f"{conflict['conflict_root']}.json", {
                **conflict,
                "resolution_policy": policy,
                "recorded_utc": _utc_now(),
            })
        snapshot = self.snapshot(label=f"import:{bundle['bundle_root'][:12]}")
        return {
            "imported": True,
            "bundle_root": bundle["bundle_root"],
            "snapshot_root": snapshot["snapshot_root"],
            "state_root": snapshot["state_root"],
            "conflicts": len(all_conflicts),
            "conflict_roots": [item["conflict_root"] for item in all_conflicts],
            "migration_path": migration_report,
            "policy": policy,
        }

    def status(self) -> dict[str, Any]:
        partitions = self.persisted_partitions(include_cache=True)
        return {
            "format": STATE_FORMAT,
            "app_id": self.app_id,
            "schema_version": self.schema_version,
            "replica_id": self.replica_id,
            "generation": int(self.metadata.get("generation", 0)),
            "current_snapshot_root": self.metadata.get("current_snapshot_root"),
            "state_root": compute_state_root(self.app_id, self.schema_version, partitions),
            "partition_roots": {
                name: sha256_bytes(canonical_json(value))
                for name, value in partitions.items()
            },
            "partition_keys": {name: len(value) for name, value in partitions.items()},
            "conflicts": len(list(self.conflicts_dir.glob("*.json"))),
        }
