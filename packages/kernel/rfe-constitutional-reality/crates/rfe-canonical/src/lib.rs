//! Dependency-free canonical JSON and SHA-256 primitives used by the RFE native kernel.
//!
//! The canonical encoder intentionally mirrors the Semantic Reference Runtime's
//! `stableStringify` contract for JSON-compatible values:
//! - object keys are sorted by JavaScript UTF-16 code-unit order;
//! - arrays retain input order;
//! - strings use JSON escaping;
//! - no insignificant whitespace is emitted.

use std::cmp::Ordering;
use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Clone, Debug, PartialEq)]
pub enum JsonValue {
    Null,
    Bool(bool),
    Number(String),
    String(String),
    Array(Vec<JsonValue>),
    Object(Vec<(String, JsonValue)>),
}

impl JsonValue {
    #[must_use]
    pub fn get(&self, key: &str) -> Option<&Self> {
        match self {
            Self::Object(entries) => entries
                .iter()
                .find_map(|(candidate, value)| (candidate == key).then_some(value)),
            _ => None,
        }
    }

    pub fn get_mut(&mut self, key: &str) -> Option<&mut Self> {
        match self {
            Self::Object(entries) => entries
                .iter_mut()
                .find_map(|(candidate, value)| (candidate == key).then_some(value)),
            _ => None,
        }
    }

    #[must_use]
    pub fn as_str(&self) -> Option<&str> {
        match self {
            Self::String(value) => Some(value),
            _ => None,
        }
    }

    #[must_use]
    pub fn as_array(&self) -> Option<&[Self]> {
        match self {
            Self::Array(values) => Some(values),
            _ => None,
        }
    }

    pub fn as_array_mut(&mut self) -> Option<&mut Vec<Self>> {
        match self {
            Self::Array(values) => Some(values),
            _ => None,
        }
    }

    #[must_use]
    pub fn as_object(&self) -> Option<&[(String, Self)]> {
        match self {
            Self::Object(entries) => Some(entries),
            _ => None,
        }
    }

    #[must_use]
    pub fn as_u64(&self) -> Option<u64> {
        match self {
            Self::Number(value) => value.parse().ok(),
            _ => None,
        }
    }

    #[must_use]
    pub fn canonical_string(&self) -> String {
        let mut output = String::new();
        self.write_canonical(&mut output);
        output
    }

    fn write_canonical(&self, output: &mut String) {
        match self {
            Self::Null => output.push_str("null"),
            Self::Bool(value) => output.push_str(if *value { "true" } else { "false" }),
            Self::Number(value) => output.push_str(value),
            Self::String(value) => write_json_string(value, output),
            Self::Array(values) => {
                output.push('[');
                for (index, value) in values.iter().enumerate() {
                    if index != 0 {
                        output.push(',');
                    }
                    value.write_canonical(output);
                }
                output.push(']');
            }
            Self::Object(entries) => {
                let mut ordered: Vec<_> = entries.iter().collect();
                ordered.sort_by(|(left, _), (right, _)| utf16_cmp(left, right));
                output.push('{');
                for (index, (key, value)) in ordered.into_iter().enumerate() {
                    if index != 0 {
                        output.push(',');
                    }
                    write_json_string(key, output);
                    output.push(':');
                    value.write_canonical(output);
                }
                output.push('}');
            }
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct JsonError {
    pub offset: usize,
    pub message: String,
}

impl Display for JsonError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            formatter,
            "JSON error at byte {}: {}",
            self.offset, self.message
        )
    }
}

impl Error for JsonError {}

/// Parses one complete JSON value using the canonical kernel's strict parser.
///
/// # Errors
///
/// Returns [`JsonError`] when the input is malformed, contains duplicate object
/// keys, includes an invalid Unicode escape, or has trailing non-whitespace data.
pub fn parse_json(input: &str) -> Result<JsonValue, JsonError> {
    let mut parser = Parser {
        input: input.as_bytes(),
        offset: 0,
    };
    let value = parser.parse_value()?;
    parser.skip_whitespace();
    if parser.offset != parser.input.len() {
        return Err(parser.error("trailing data after JSON value"));
    }
    Ok(value)
}

/// Parses JSON and emits the deterministic canonical representation.
///
/// # Errors
///
/// Returns [`JsonError`] when `input` is not valid JSON under the strict parser.
pub fn canonical_json(input: &str) -> Result<String, JsonError> {
    parse_json(input).map(|value| value.canonical_string())
}

#[must_use]
pub fn sha256_hex(bytes: &[u8]) -> String {
    let digest = sha256(bytes);
    let mut output = String::with_capacity(64);
    for byte in digest {
        use std::fmt::Write as _;
        let _ = write!(output, "{byte:02x}");
    }
    output
}

/// Hashes the deterministic canonical JSON representation with SHA-256.
///
/// # Errors
///
/// Returns [`JsonError`] when `input` cannot be parsed as strict JSON.
pub fn canonical_hash(input: &str) -> Result<String, JsonError> {
    canonical_json(input).map(|canonical| sha256_hex(canonical.as_bytes()))
}

fn utf16_cmp(left: &str, right: &str) -> Ordering {
    left.encode_utf16().cmp(right.encode_utf16())
}

fn write_json_string(value: &str, output: &mut String) {
    output.push('"');
    for character in value.chars() {
        match character {
            '"' => output.push_str("\\\""),
            '\\' => output.push_str("\\\\"),
            '\u{0008}' => output.push_str("\\b"),
            '\u{000C}' => output.push_str("\\f"),
            '\n' => output.push_str("\\n"),
            '\r' => output.push_str("\\r"),
            '\t' => output.push_str("\\t"),
            character if character <= '\u{001F}' => {
                use std::fmt::Write as _;
                let _ = write!(output, "\\u{:04x}", character as u32);
            }
            _ => output.push(character),
        }
    }
    output.push('"');
}

struct Parser<'a> {
    input: &'a [u8],
    offset: usize,
}

impl Parser<'_> {
    fn error(&self, message: impl Into<String>) -> JsonError {
        JsonError {
            offset: self.offset,
            message: message.into(),
        }
    }

    fn skip_whitespace(&mut self) {
        while matches!(
            self.input.get(self.offset),
            Some(b' ' | b'\n' | b'\r' | b'\t')
        ) {
            self.offset += 1;
        }
    }

    fn parse_value(&mut self) -> Result<JsonValue, JsonError> {
        self.skip_whitespace();
        match self.input.get(self.offset).copied() {
            Some(b'n') => {
                self.expect_literal(b"null")?;
                Ok(JsonValue::Null)
            }
            Some(b't') => {
                self.expect_literal(b"true")?;
                Ok(JsonValue::Bool(true))
            }
            Some(b'f') => {
                self.expect_literal(b"false")?;
                Ok(JsonValue::Bool(false))
            }
            Some(b'"') => self.parse_string().map(JsonValue::String),
            Some(b'[') => self.parse_array(),
            Some(b'{') => self.parse_object(),
            Some(b'-' | b'0'..=b'9') => self.parse_number().map(JsonValue::Number),
            Some(_) => Err(self.error("unexpected token")),
            None => Err(self.error("unexpected end of input")),
        }
    }

    fn expect_literal(&mut self, literal: &[u8]) -> Result<(), JsonError> {
        let end = self.offset.saturating_add(literal.len());
        if self.input.get(self.offset..end) != Some(literal) {
            return Err(self.error("invalid literal"));
        }
        self.offset = end;
        Ok(())
    }

    fn parse_string(&mut self) -> Result<String, JsonError> {
        if self.input.get(self.offset) != Some(&b'"') {
            return Err(self.error("expected string"));
        }
        self.offset += 1;
        let mut output = String::new();
        let mut raw_start = self.offset;
        while let Some(byte) = self.input.get(self.offset).copied() {
            match byte {
                b'"' => {
                    if raw_start < self.offset {
                        let raw = std::str::from_utf8(&self.input[raw_start..self.offset])
                            .map_err(|_| self.error("invalid UTF-8 in string"))?;
                        output.push_str(raw);
                    }
                    self.offset += 1;
                    return Ok(output);
                }
                b'\\' => {
                    if raw_start < self.offset {
                        let raw = std::str::from_utf8(&self.input[raw_start..self.offset])
                            .map_err(|_| self.error("invalid UTF-8 in string"))?;
                        output.push_str(raw);
                    }
                    self.offset += 1;
                    let escaped = self
                        .input
                        .get(self.offset)
                        .copied()
                        .ok_or_else(|| self.error("unterminated escape"))?;
                    self.offset += 1;
                    match escaped {
                        b'"' => output.push('"'),
                        b'\\' => output.push('\\'),
                        b'/' => output.push('/'),
                        b'b' => output.push('\u{0008}'),
                        b'f' => output.push('\u{000C}'),
                        b'n' => output.push('\n'),
                        b'r' => output.push('\r'),
                        b't' => output.push('\t'),
                        b'u' => {
                            let first = self.parse_hex_quad()?;
                            if (0xD800..=0xDBFF).contains(&first) {
                                if self.input.get(self.offset..self.offset + 2) != Some(b"\\u") {
                                    return Err(self.error("high surrogate without low surrogate"));
                                }
                                self.offset += 2;
                                let second = self.parse_hex_quad()?;
                                if !(0xDC00..=0xDFFF).contains(&second) {
                                    return Err(self.error("invalid low surrogate"));
                                }
                                let scalar = 0x10000
                                    + ((u32::from(first - 0xD800)) << 10)
                                    + u32::from(second - 0xDC00);
                                output.push(
                                    char::from_u32(scalar)
                                        .ok_or_else(|| self.error("invalid Unicode scalar"))?,
                                );
                            } else if (0xDC00..=0xDFFF).contains(&first) {
                                return Err(self.error("unexpected low surrogate"));
                            } else {
                                output.push(
                                    char::from_u32(u32::from(first))
                                        .ok_or_else(|| self.error("invalid Unicode scalar"))?,
                                );
                            }
                        }
                        _ => return Err(self.error("unsupported escape")),
                    }
                    raw_start = self.offset;
                }
                0x00..=0x1F => return Err(self.error("unescaped control character in string")),
                _ => self.offset += 1,
            }
        }
        Err(self.error("unterminated string"))
    }

    fn parse_hex_quad(&mut self) -> Result<u16, JsonError> {
        let end = self.offset.saturating_add(4);
        let slice = self
            .input
            .get(self.offset..end)
            .ok_or_else(|| self.error("short Unicode escape"))?;
        let text = std::str::from_utf8(slice).map_err(|_| self.error("invalid Unicode escape"))?;
        let value =
            u16::from_str_radix(text, 16).map_err(|_| self.error("invalid Unicode escape"))?;
        self.offset = end;
        Ok(value)
    }

    fn parse_array(&mut self) -> Result<JsonValue, JsonError> {
        self.offset += 1;
        self.skip_whitespace();
        let mut values = Vec::new();
        if self.input.get(self.offset) == Some(&b']') {
            self.offset += 1;
            return Ok(JsonValue::Array(values));
        }
        loop {
            values.push(self.parse_value()?);
            self.skip_whitespace();
            match self.input.get(self.offset) {
                Some(b',') => {
                    self.offset += 1;
                }
                Some(b']') => {
                    self.offset += 1;
                    break;
                }
                _ => return Err(self.error("expected ',' or ']'")),
            }
        }
        Ok(JsonValue::Array(values))
    }

    fn parse_object(&mut self) -> Result<JsonValue, JsonError> {
        self.offset += 1;
        self.skip_whitespace();
        let mut entries = Vec::new();
        if self.input.get(self.offset) == Some(&b'}') {
            self.offset += 1;
            return Ok(JsonValue::Object(entries));
        }
        loop {
            self.skip_whitespace();
            let key = self.parse_string()?;
            self.skip_whitespace();
            if self.input.get(self.offset) != Some(&b':') {
                return Err(self.error("expected ':'"));
            }
            self.offset += 1;
            let value = self.parse_value()?;
            if entries.iter().any(|(candidate, _)| candidate == &key) {
                return Err(self.error(format!("duplicate object key: {key}")));
            }
            entries.push((key, value));
            self.skip_whitespace();
            match self.input.get(self.offset) {
                Some(b',') => {
                    self.offset += 1;
                }
                Some(b'}') => {
                    self.offset += 1;
                    break;
                }
                _ => return Err(self.error("expected ',' or '}'")),
            }
        }
        Ok(JsonValue::Object(entries))
    }

    fn parse_number(&mut self) -> Result<String, JsonError> {
        let start = self.offset;
        if self.input.get(self.offset) == Some(&b'-') {
            self.offset += 1;
        }
        match self.input.get(self.offset) {
            Some(b'0') => self.offset += 1,
            Some(b'1'..=b'9') => {
                self.offset += 1;
                while matches!(self.input.get(self.offset), Some(b'0'..=b'9')) {
                    self.offset += 1;
                }
            }
            _ => return Err(self.error("invalid number")),
        }
        if self.input.get(self.offset) == Some(&b'.') {
            self.offset += 1;
            let fraction_start = self.offset;
            while matches!(self.input.get(self.offset), Some(b'0'..=b'9')) {
                self.offset += 1;
            }
            if self.offset == fraction_start {
                return Err(self.error("number requires digits after decimal point"));
            }
        }
        if matches!(self.input.get(self.offset), Some(b'e' | b'E')) {
            self.offset += 1;
            if matches!(self.input.get(self.offset), Some(b'+' | b'-')) {
                self.offset += 1;
            }
            let exponent_start = self.offset;
            while matches!(self.input.get(self.offset), Some(b'0'..=b'9')) {
                self.offset += 1;
            }
            if self.offset == exponent_start {
                return Err(self.error("number requires exponent digits"));
            }
        }
        let value = std::str::from_utf8(&self.input[start..self.offset])
            .map_err(|_| self.error("invalid number encoding"))?;
        Ok(value.to_owned())
    }
}

// The SHA-256 compression routine intentionally remains contiguous so the
// standard round sequence can be audited against FIPS 180-4.
#[allow(clippy::too_many_lines)]
#[must_use]
pub fn sha256(input: &[u8]) -> [u8; 32] {
    const INITIAL: [u32; 8] = [
        0x6a09_e667,
        0xbb67_ae85,
        0x3c6e_f372,
        0xa54f_f53a,
        0x510e_527f,
        0x9b05_688c,
        0x1f83_d9ab,
        0x5be0_cd19,
    ];
    const K: [u32; 64] = [
        0x428a_2f98,
        0x7137_4491,
        0xb5c0_fbcf,
        0xe9b5_dba5,
        0x3956_c25b,
        0x59f1_11f1,
        0x923f_82a4,
        0xab1c_5ed5,
        0xd807_aa98,
        0x1283_5b01,
        0x2431_85be,
        0x550c_7dc3,
        0x72be_5d74,
        0x80de_b1fe,
        0x9bdc_06a7,
        0xc19b_f174,
        0xe49b_69c1,
        0xefbe_4786,
        0x0fc1_9dc6,
        0x240c_a1cc,
        0x2de9_2c6f,
        0x4a74_84aa,
        0x5cb0_a9dc,
        0x76f9_88da,
        0x983e_5152,
        0xa831_c66d,
        0xb003_27c8,
        0xbf59_7fc7,
        0xc6e0_0bf3,
        0xd5a7_9147,
        0x06ca_6351,
        0x1429_2967,
        0x27b7_0a85,
        0x2e1b_2138,
        0x4d2c_6dfc,
        0x5338_0d13,
        0x650a_7354,
        0x766a_0abb,
        0x81c2_c92e,
        0x9272_2c85,
        0xa2bf_e8a1,
        0xa81a_664b,
        0xc24b_8b70,
        0xc76c_51a3,
        0xd192_e819,
        0xd699_0624,
        0xf40e_3585,
        0x106a_a070,
        0x19a4_c116,
        0x1e37_6c08,
        0x2748_774c,
        0x34b0_bcb5,
        0x391c_0cb3,
        0x4ed8_aa4a,
        0x5b9c_ca4f,
        0x682e_6ff3,
        0x748f_82ee,
        0x78a5_636f,
        0x84c8_7814,
        0x8cc7_0208,
        0x90be_fffa,
        0xa450_6ceb,
        0xbef9_a3f7,
        0xc671_78f2,
    ];

    let bit_length = (input.len() as u64).wrapping_mul(8);
    let mut message = input.to_vec();
    message.push(0x80);
    while message.len() % 64 != 56 {
        message.push(0);
    }
    message.extend_from_slice(&bit_length.to_be_bytes());

    let mut state = INITIAL;
    for chunk in message.chunks_exact(64) {
        let mut schedule = [0u32; 64];
        for (index, word) in chunk.chunks_exact(4).enumerate() {
            schedule[index] = u32::from_be_bytes([word[0], word[1], word[2], word[3]]);
        }
        for index in 16..64 {
            let s0 = schedule[index - 15].rotate_right(7)
                ^ schedule[index - 15].rotate_right(18)
                ^ (schedule[index - 15] >> 3);
            let s1 = schedule[index - 2].rotate_right(17)
                ^ schedule[index - 2].rotate_right(19)
                ^ (schedule[index - 2] >> 10);
            schedule[index] = schedule[index - 16]
                .wrapping_add(s0)
                .wrapping_add(schedule[index - 7])
                .wrapping_add(s1);
        }

        let [mut work_a, mut work_b, mut work_c, mut work_d, mut work_e, mut work_f, mut work_g, mut work_h] =
            state;
        for index in 0..64 {
            let upper_sigma_one =
                work_e.rotate_right(6) ^ work_e.rotate_right(11) ^ work_e.rotate_right(25);
            let choice = (work_e & work_f) ^ ((!work_e) & work_g);
            let temp1 = work_h
                .wrapping_add(upper_sigma_one)
                .wrapping_add(choice)
                .wrapping_add(K[index])
                .wrapping_add(schedule[index]);
            let upper_sigma_zero =
                work_a.rotate_right(2) ^ work_a.rotate_right(13) ^ work_a.rotate_right(22);
            let majority = (work_a & work_b) ^ (work_a & work_c) ^ (work_b & work_c);
            let temp2 = upper_sigma_zero.wrapping_add(majority);
            work_h = work_g;
            work_g = work_f;
            work_f = work_e;
            work_e = work_d.wrapping_add(temp1);
            work_d = work_c;
            work_c = work_b;
            work_b = work_a;
            work_a = temp1.wrapping_add(temp2);
        }
        state[0] = state[0].wrapping_add(work_a);
        state[1] = state[1].wrapping_add(work_b);
        state[2] = state[2].wrapping_add(work_c);
        state[3] = state[3].wrapping_add(work_d);
        state[4] = state[4].wrapping_add(work_e);
        state[5] = state[5].wrapping_add(work_f);
        state[6] = state[6].wrapping_add(work_g);
        state[7] = state[7].wrapping_add(work_h);
    }

    let mut output = [0u8; 32];
    for (index, word) in state.into_iter().enumerate() {
        output[index * 4..index * 4 + 4].copy_from_slice(&word.to_be_bytes());
    }
    output
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sha256_known_vector() {
        assert_eq!(
            sha256_hex(b"abc"),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
    }

    #[test]
    fn canonical_object_sorting() {
        let value = parse_json(r#"{"z":3,"a":1,"nested":{"y":2,"x":1}}"#).expect("valid JSON");
        assert_eq!(
            value.canonical_string(),
            r#"{"a":1,"nested":{"x":1,"y":2},"z":3}"#
        );
    }

    #[test]
    fn unicode_surrogate_pair_parses() {
        let value = parse_json(r#""\ud83c\udf0c""#).expect("valid surrogate pair");
        assert_eq!(value, JsonValue::String("🌌".to_owned()));
    }
}
