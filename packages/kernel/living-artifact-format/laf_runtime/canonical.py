from __future__ import annotations
import hashlib, json
from typing import Any

class LAFError(ValueError):
    pass

def _encode(value: Any) -> str:
    if value is None: return 'null'
    if value is True: return 'true'
    if value is False: return 'false'
    if isinstance(value, int) and not isinstance(value, bool): return str(value)
    if isinstance(value, float):
        raise LAFError('LAF_HASH_FLOAT_FORBIDDEN: use integer or decimal string')
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False, separators=(',', ':'))
    if isinstance(value, (list, tuple)):
        return '[' + ','.join(_encode(v) for v in value) + ']'
    if isinstance(value, dict):
        if not all(isinstance(k, str) for k in value):
            raise LAFError('LAF_HASH_KEY_NOT_STRING')
        keys=sorted(value, key=lambda k:k.encode('utf-8'))
        return '{' + ','.join(_encode(k)+':'+_encode(value[k]) for k in keys) + '}'
    raise LAFError(f'LAF_HASH_TYPE_UNSUPPORTED:{type(value).__name__}')

def canonical_json(value: Any) -> str:
    return _encode(value)

def root_hash(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode('utf-8')).hexdigest()

def is_hex64(value: Any) -> bool:
    return isinstance(value,str) and len(value)==64 and all(c in '0123456789abcdef' for c in value)
