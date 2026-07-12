from __future__ import annotations
import hashlib, json, math
from typing import Any

class ContractError(ValueError):
    pass

def _key_order(key: str) -> bytes:
    return key.encode('utf-8')

def _encode(value: Any) -> str:
    if value is None: return 'null'
    if value is True: return 'true'
    if value is False: return 'false'
    if isinstance(value, int) and not isinstance(value, bool): return str(value)
    if isinstance(value, float):
        raise ContractError('RNCS_HASH_FLOAT_FORBIDDEN: use an integer or decimal string')
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False, separators=(',', ':'))
    if isinstance(value, (list, tuple)):
        return '[' + ','.join(_encode(item) for item in value) + ']'
    if isinstance(value, dict):
        for key in value:
            if not isinstance(key, str): raise ContractError('RNCS_HASH_KEY_NOT_STRING')
        keys = sorted(value.keys(), key=_key_order)
        return '{' + ','.join(_encode(key)+':'+_encode(value[key]) for key in keys) + '}'
    raise ContractError(f'RNCS_HASH_TYPE_UNSUPPORTED:{type(value).__name__}')

def canonical_json(value: Any) -> str:
    return _encode(value)

def root_hash(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode('utf-8')).hexdigest()

def without(value: dict[str, Any], *fields: str) -> dict[str, Any]:
    return {k: v for k, v in value.items() if k not in fields}

def is_hex64(value: Any) -> bool:
    return isinstance(value, str) and len(value)==64 and all(c in '0123456789abcdef' for c in value)
