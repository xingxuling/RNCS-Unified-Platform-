from __future__ import annotations

import base64
import datetime as dt
import json
import os
from pathlib import Path
from typing import Any

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

from .capsule import deterministic_zip_write, read_zip_unique
from .errors import HNACError
from .manifest import execution_candidates, validate_manifest
from .util import canonical_json, sha256_bytes


def load_private_key(key_path: Path) -> Ed25519PrivateKey:
    if key_path.exists():
        key = serialization.load_pem_private_key(key_path.read_bytes(), password=None)
        if not isinstance(key, Ed25519PrivateKey):
            raise HNACError("Key is not Ed25519")
        return key
    key_path.parent.mkdir(parents=True, exist_ok=True)
    key = Ed25519PrivateKey.generate()
    key_path.write_bytes(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    try:
        os.chmod(key_path, 0o600)
    except OSError:
        pass
    return key


def sign(capsule: Path, key_path: Path, signer: str) -> dict[str, Any]:
    files = read_zip_unique(capsule)
    if "integrity/index.json" not in files:
        raise HNACError("Capsule has no integrity index")
    index = json.loads(files["integrity/index.json"].decode("utf-8"))
    signed = canonical_json(index)
    key = load_private_key(key_path)
    public_raw = key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    signature = {
        "version": "0.3",
        "algorithm": "ed25519",
        "signer": signer,
        "signed_object": "integrity/index.json",
        "signed_sha256": sha256_bytes(signed),
        "public_key": base64.b64encode(public_raw).decode("ascii"),
        "signature": base64.b64encode(key.sign(signed)).decode("ascii"),
        "created_utc": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
    }
    files["signatures/ed25519.json"] = canonical_json(signature)
    deterministic_zip_write(capsule, files)
    return {"capsule": str(capsule), "signer": signer, "public_key_sha256": sha256_bytes(public_raw)}


def verify(capsule: Path, *, require_signature: bool = False) -> dict[str, Any]:
    files = read_zip_unique(capsule)
    for required in ("hnac.json", "integrity/index.json"):
        if required not in files:
            raise HNACError(f"Missing required file: {required}")
    try:
        manifest = json.loads(files["hnac.json"].decode("utf-8"))
        index = json.loads(files["integrity/index.json"].decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HNACError("Invalid manifest or integrity JSON") from exc
    validate_manifest(manifest)

    indexed = index.get("files")
    if not isinstance(indexed, dict):
        raise HNACError("Invalid integrity index")
    actual_payload = {name for name in files if not name.startswith(("integrity/", "signatures/", "attestations/"))}
    if actual_payload != set(indexed):
        missing = sorted(set(indexed) - actual_payload)
        extra = sorted(actual_payload - set(indexed))
        raise HNACError(f"Integrity file-set mismatch; missing={missing}, extra={extra}")
    for name, record in indexed.items():
        data = files[name]
        if record.get("size") != len(data) or record.get("sha256") != sha256_bytes(data):
            raise HNACError(f"Integrity mismatch: {name}")

    signature_status: dict[str, Any] = {"status": "absent"}
    if "signatures/ed25519.json" in files:
        signature = json.loads(files["signatures/ed25519.json"].decode("utf-8"))
        signed = canonical_json(index)
        if signature.get("signed_sha256") != sha256_bytes(signed):
            raise HNACError("Signature object hash mismatch")
        try:
            public_raw = base64.b64decode(signature["public_key"], validate=True)
            sig_raw = base64.b64decode(signature["signature"], validate=True)
            Ed25519PublicKey.from_public_bytes(public_raw).verify(sig_raw, signed)
        except (KeyError, ValueError, InvalidSignature) as exc:
            raise HNACError("Signature verification failed") from exc
        signature_status = {
            "status": "valid",
            "signer": signature.get("signer", "unknown"),
            "public_key_sha256": sha256_bytes(public_raw),
        }
    elif require_signature:
        raise HNACError("Signature required but absent")

    for candidate in execution_candidates(manifest):
        if candidate["entry"] not in files:
            raise HNACError(f"Execution entry missing: {candidate['entry']}")
        contract = candidate.get("contract")
        if contract and contract not in files:
            raise HNACError(f"Execution contract missing: {contract}")
    return {"manifest": manifest, "files": files, "signature": signature_status, "integrity": index}
