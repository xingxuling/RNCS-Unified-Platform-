from __future__ import annotations
import hashlib, json, math
from typing import Any
from .errors import ValidationError

def _utf16_key(value: str) -> bytes:
    return value.encode('utf-16-be', errors='surrogatepass')

def _number(value: int | float) -> str:
    if isinstance(value, bool):
        raise ValidationError('RFE_CANONICAL_BOOL_AS_NUMBER', 'boolean is not a numeric value')
    if isinstance(value, int):
        return str(value)
    if not math.isfinite(value):
        raise ValidationError('RFE_CANONICAL_NON_FINITE', 'NaN and Infinity are forbidden')
    if value == 0:
        return '0'
    if value.is_integer() and abs(value) <= 9007199254740991:
        return str(int(value))
    text = json.dumps(value, ensure_ascii=False, allow_nan=False, separators=(',', ':'))
    # Normalize exponent spelling toward JSON.stringify for ordinary IEEE-754 values.
    if 'e' in text or 'E' in text:
        mantissa, exponent = text.lower().split('e')
        sign = ''
        if exponent.startswith(('+','-')):
            sign, exponent = exponent[0], exponent[1:]
        exponent = exponent.lstrip('0') or '0'
        if sign == '+': sign = '+'
        text = f'{mantissa}e{sign}{exponent}'
    return text

def canonical_json(value: Any) -> str:
    if value is None: return 'null'
    if value is True: return 'true'
    if value is False: return 'false'
    if isinstance(value, (int, float)) and not isinstance(value, bool): return _number(value)
    if isinstance(value, str): return json.dumps(value, ensure_ascii=False, separators=(',', ':'))
    if isinstance(value, (list, tuple)):
        return '[' + ','.join(canonical_json(v) for v in value) + ']'
    if isinstance(value, dict):
        if any(not isinstance(k, str) for k in value):
            raise ValidationError('RFE_CANONICAL_KEY_NOT_STRING', 'all object keys must be strings')
        keys = sorted(value, key=_utf16_key)
        return '{' + ','.join(canonical_json(k)+':'+canonical_json(value[k]) for k in keys) + '}'
    raise ValidationError('RFE_CANONICAL_UNSUPPORTED', f'unsupported type: {type(value).__name__}')

def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def root_hash(value: Any) -> str:
    return sha256_hex(canonical_json(value).encode('utf-8'))

def with_integrity(value: dict[str, Any], field: str='integrityHash') -> dict[str, Any]:
    body = {k:v for k,v in value.items() if k != field}
    return {**body, field: root_hash(body)}

def verify_integrity(value: dict[str, Any], field: str='integrityHash') -> bool:
    expected = value.get(field)
    return isinstance(expected, str) and expected == root_hash({k:v for k,v in value.items() if k != field})
