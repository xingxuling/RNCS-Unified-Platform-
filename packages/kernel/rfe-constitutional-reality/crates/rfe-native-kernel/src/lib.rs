//! Native semantic kernel for the RFE C0-C4 conformance suite.
//!
//! This crate deliberately operates on the canonical JSON model while the RIR
//! schema is still evolving. The first executable semantic slice is the
//! proof-native `setFact` transaction used by the door/key/room conformance
//! fixture. It does not call or embed JavaScript.

use rfe_canonical::{sha256_hex, JsonError, JsonValue};
use std::collections::{BTreeMap, BTreeSet};
use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct KernelError {
    pub code: &'static str,
    pub message: String,
}

impl Display for KernelError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}: {}", self.code, self.message)
    }
}

impl Error for KernelError {}

impl From<JsonError> for KernelError {
    fn from(value: JsonError) -> Self {
        Self {
            code: "INVALID_JSON",
            message: value.to_string(),
        }
    }
}

fn error(code: &'static str, message: impl Into<String>) -> KernelError {
    KernelError {
        code,
        message: message.into(),
    }
}

fn object(entries: Vec<(&str, JsonValue)>) -> JsonValue {
    JsonValue::Object(
        entries
            .into_iter()
            .map(|(key, value)| (key.to_owned(), value))
            .collect(),
    )
}

fn string(value: impl Into<String>) -> JsonValue {
    JsonValue::String(value.into())
}
fn number(value: u64) -> JsonValue {
    JsonValue::Number(value.to_string())
}

fn get_required<'a>(value: &'a JsonValue, key: &str) -> Result<&'a JsonValue, KernelError> {
    value
        .get(key)
        .ok_or_else(|| error("MISSING_FIELD", format!("missing field: {key}")))
}

fn get_string<'a>(value: &'a JsonValue, key: &str) -> Result<&'a str, KernelError> {
    get_required(value, key)?
        .as_str()
        .ok_or_else(|| error("INVALID_FIELD", format!("field {key} must be a string")))
}

fn get_u64(value: &JsonValue, key: &str) -> Result<u64, KernelError> {
    get_required(value, key)?.as_u64().ok_or_else(|| {
        error(
            "INVALID_FIELD",
            format!("field {key} must be an unsigned integer"),
        )
    })
}

fn set_object_field(
    value: &mut JsonValue,
    key: &str,
    replacement: JsonValue,
) -> Result<(), KernelError> {
    match value {
        JsonValue::Object(entries) => {
            if let Some((_, current)) = entries.iter_mut().find(|(candidate, _)| candidate == key) {
                *current = replacement;
            } else {
                entries.push((key.to_owned(), replacement));
            }
            Ok(())
        }
        _ => Err(error("INVALID_OBJECT", "expected JSON object")),
    }
}

fn remove_object_field(value: &mut JsonValue, key: &str) {
    if let JsonValue::Object(entries) = value {
        entries.retain(|(candidate, _)| candidate != key);
    }
}

fn js_utf16_sort(values: &mut [JsonValue], field: &str) {
    values.sort_by(|left, right| {
        let left = left
            .get(field)
            .and_then(JsonValue::as_str)
            .unwrap_or_default();
        let right = right
            .get(field)
            .and_then(JsonValue::as_str)
            .unwrap_or_default();
        left.encode_utf16().cmp(right.encode_utf16())
    });
}

fn encode_uri_component(value: &str) -> String {
    let mut output = String::new();
    for byte in value.as_bytes() {
        let allowed = byte.is_ascii_alphanumeric()
            || matches!(
                *byte,
                b'-' | b'_' | b'.' | b'!' | b'~' | b'*' | b'\'' | b'(' | b')'
            );
        if allowed {
            output.push(*byte as char);
        } else {
            use std::fmt::Write as _;
            let _ = write!(output, "%{byte:02X}");
        }
    }
    output
}

fn group_key(prefix: &str, parts: &[&str]) -> String {
    let encoded = parts
        .iter()
        .map(|part| encode_uri_component(part))
        .collect::<Vec<_>>()
        .join(":");
    format!("{prefix}:{encoded}")
}

fn prefixed_hash(prefix: &str, fields: &[&str]) -> String {
    let mut input = prefix.to_owned();
    for field in fields {
        input.push('\0');
        input.push_str(field);
    }
    sha256_hex(input.as_bytes())
}

fn leaf_hash(key: &str, value: &JsonValue) -> String {
    prefixed_hash("smt-leaf", &[key, &value.canonical_string()])
}

fn node_hash(left: &str, right: &str) -> String {
    prefixed_hash("smt-node", &[left, right])
}

fn bucket_hash(records: &[(String, String)]) -> String {
    if records.is_empty() {
        return sha256_hex(b"smt-empty-bucket");
    }
    let mut input = String::from("smt-bucket");
    for (key, hash) in records {
        input.push('\0');
        input.push_str(key);
        input.push('\0');
        input.push_str(hash);
    }
    sha256_hex(input.as_bytes())
}

fn path_bits(key: &str, depth: usize) -> String {
    let digest = prefixed_hash("smt-path", &[key]);
    let mut output = String::with_capacity(depth);
    for character in digest.bytes() {
        let nibble = match character {
            b'0'..=b'9' => character - b'0',
            b'a'..=b'f' => character - b'a' + 10,
            _ => 0,
        };
        for shift in (0..4).rev() {
            output.push(if (nibble >> shift) & 1 == 1 { '1' } else { '0' });
            if output.len() == depth {
                return output;
            }
        }
    }
    output
}

#[derive(Clone, Debug)]
pub struct StructuralProofTree {
    depth: usize,
    default_hashes: Vec<String>,
    leaves: BTreeMap<String, JsonValue>,
    buckets: BTreeMap<String, BTreeMap<String, String>>,
    nodes: BTreeMap<(usize, String), String>,
}

impl StructuralProofTree {
    #[must_use]
    pub fn new(depth: usize) -> Self {
        let mut default_hashes = vec![String::new(); depth + 1];
        default_hashes[depth] = bucket_hash(&[]);
        for level in (0..depth).rev() {
            default_hashes[level] =
                node_hash(&default_hashes[level + 1], &default_hashes[level + 1]);
        }
        Self {
            depth,
            default_hashes,
            leaves: BTreeMap::new(),
            buckets: BTreeMap::new(),
            nodes: BTreeMap::new(),
        }
    }

    fn node(&self, level: usize, prefix: &str) -> String {
        self.nodes
            .get(&(level, prefix.to_owned()))
            .cloned()
            .unwrap_or_else(|| self.default_hashes[level].clone())
    }

    fn set_node(&mut self, level: usize, prefix: String, hash: String) {
        let key = (level, prefix);
        if hash == self.default_hashes[level] {
            self.nodes.remove(&key);
        } else {
            self.nodes.insert(key, hash);
        }
    }

    fn recompute_path(&mut self, path: &str) {
        let records = self
            .buckets
            .get(path)
            .map(|bucket| {
                bucket
                    .iter()
                    .map(|(key, hash)| (key.clone(), hash.clone()))
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        self.set_node(self.depth, path.to_owned(), bucket_hash(&records));
        for level in (0..self.depth).rev() {
            let prefix = &path[..level];
            let left = self.node(level + 1, &format!("{prefix}0"));
            let right = self.node(level + 1, &format!("{prefix}1"));
            self.set_node(level, prefix.to_owned(), node_hash(&left, &right));
        }
    }

    pub fn set(&mut self, key: impl Into<String>, value: JsonValue) {
        let key = key.into();
        let path = path_bits(&key, self.depth);
        let hash = leaf_hash(&key, &value);
        self.buckets
            .entry(path.clone())
            .or_default()
            .insert(key.clone(), hash);
        self.leaves.insert(key, value);
        self.recompute_path(&path);
    }

    #[must_use]
    pub fn root(&self) -> String {
        self.node(0, "")
    }
}

#[derive(Clone, Debug)]
pub struct NativeWorld {
    document: JsonValue,
}

impl NativeWorld {
    /// Creates a native world from a complete RIR document.
    ///
    /// # Errors
    ///
    /// Returns [`KernelError`] when a required world field is missing.
    pub fn from_document(document: JsonValue) -> Result<Self, KernelError> {
        for field in [
            "specVersion",
            "worldId",
            "branchId",
            "time",
            "revision",
            "identities",
            "facts",
            "relations",
            "constraints",
            "affordanceRules",
        ] {
            let _ = get_required(&document, field)?;
        }
        Ok(Self { document })
    }

    #[must_use]
    pub fn document(&self) -> &JsonValue {
        &self.document
    }

    #[must_use]
    pub fn into_document(self) -> JsonValue {
        self.document
    }

    #[must_use]
    pub fn current_fact(&self, subject: &str, predicate: &str) -> Option<&JsonValue> {
        let time = self.document.get("time")?.as_u64()?;
        self.document.get("facts")?.as_array()?.iter().find(|fact| {
            let matches = fact.get("subject").and_then(JsonValue::as_str) == Some(subject)
                && fact.get("predicate").and_then(JsonValue::as_str) == Some(predicate);
            let from = fact
                .get("validFrom")
                .and_then(JsonValue::as_u64)
                .unwrap_or(0);
            let to = match fact.get("validTo") {
                Some(JsonValue::Number(value)) => value.parse::<u64>().ok(),
                _ => None,
            };
            matches && time >= from && to.is_none_or(|end| time < end)
        })
    }

    fn next_record_id(&self, prefix: &str, collection: &str) -> Result<String, KernelError> {
        let values = get_required(&self.document, collection)?
            .as_array()
            .ok_or_else(|| error("INVALID_COLLECTION", collection))?;
        let mut index = values.len() as u64 + 1;
        let ids = values
            .iter()
            .filter_map(|value| value.get("id").and_then(JsonValue::as_str))
            .collect::<BTreeSet<_>>();
        while ids.contains(format!("{prefix}:{index}").as_str()) {
            index += 1;
        }
        Ok(format!("{prefix}:{index}"))
    }

    /// Applies one normalized fact transition and returns its compact inverse.
    ///
    /// # Errors
    ///
    /// Returns [`KernelError`] when the fact is malformed or the world fact
    /// collection cannot be updated consistently.
    pub fn apply_set_fact(
        &mut self,
        fact_input: &JsonValue,
    ) -> Result<(JsonValue, JsonValue), KernelError> {
        let subject = get_string(fact_input, "subject")?.to_owned();
        let predicate = get_string(fact_input, "predicate")?.to_owned();
        let value = get_required(fact_input, "value")?.clone();
        let time = self
            .document
            .get("time")
            .and_then(JsonValue::as_u64)
            .unwrap_or(0);
        let id = fact_input
            .get("id")
            .and_then(JsonValue::as_str)
            .map(str::to_owned)
            .unwrap_or(self.next_record_id("fact", "facts")?);
        let mut restored = Vec::new();
        let facts = self
            .document
            .get_mut("facts")
            .and_then(JsonValue::as_array_mut)
            .ok_or_else(|| error("INVALID_WORLD", "facts must be an array"))?;
        for existing in facts.iter_mut() {
            let matches = existing.get("subject").and_then(JsonValue::as_str)
                == Some(subject.as_str())
                && existing.get("predicate").and_then(JsonValue::as_str)
                    == Some(predicate.as_str());
            let valid_to_open = matches!(existing.get("validTo"), Some(JsonValue::Null));
            let valid_from = existing
                .get("validFrom")
                .and_then(JsonValue::as_u64)
                .unwrap_or(0);
            if matches && valid_to_open && time >= valid_from {
                let prior = existing.get("validTo").cloned().unwrap_or(JsonValue::Null);
                restored.push(object(vec![
                    ("id", string(get_string(existing, "id")?)),
                    ("validTo", prior),
                ]));
                set_object_field(existing, "validTo", number(time))?;
            }
        }
        let normalized = object(vec![
            ("id", string(id.clone())),
            ("subject", string(subject.clone())),
            ("predicate", string(predicate.clone())),
            ("value", value),
            ("validFrom", number(time)),
            ("validTo", JsonValue::Null),
            (
                "source",
                fact_input
                    .get("source")
                    .cloned()
                    .unwrap_or_else(|| string("source:runtime")),
            ),
            (
                "confidence",
                fact_input
                    .get("confidence")
                    .cloned()
                    .unwrap_or_else(|| number(1)),
            ),
            (
                "visibility",
                fact_input
                    .get("visibility")
                    .cloned()
                    .unwrap_or_else(|| object(vec![("type", string("public"))])),
            ),
            (
                "authority",
                fact_input
                    .get("authority")
                    .cloned()
                    .unwrap_or_else(|| string("authority:system")),
            ),
        ]);
        facts.push(normalized.clone());
        js_utf16_sort(facts, "id");
        let inverse = object(vec![
            ("op", string("restoreFactDelta")),
            ("subject", string(subject)),
            ("predicate", string(predicate)),
            ("removeIds", JsonValue::Array(vec![string(id)])),
            ("restore", JsonValue::Array(restored)),
        ]);
        Ok((normalized, inverse))
    }

    /// Sets the world's logical time.
    ///
    /// # Errors
    ///
    /// Returns [`KernelError`] when the world document is not an object.
    pub fn set_time(&mut self, time: u64) -> Result<(), KernelError> {
        set_object_field(&mut self.document, "time", number(time))
    }

    /// Sets the authoritative world revision.
    ///
    /// # Errors
    ///
    /// Returns [`KernelError`] when the world document is not an object.
    pub fn set_revision(&mut self, revision: u64) -> Result<(), KernelError> {
        set_object_field(&mut self.document, "revision", number(revision))
    }

    /// Computes the structural proof root for the current world.
    ///
    /// # Errors
    ///
    /// Returns [`KernelError`] when required collections or semantic records are
    /// malformed.
    pub fn structural_root(&self, depth: usize) -> Result<String, KernelError> {
        let mut tree = StructuralProofTree::new(depth);
        let state_fields = [
            "specVersion",
            "worldId",
            "seed",
            "time",
            "constitution",
            "branchId",
            "branchInfo",
            "revision",
        ];
        for field in state_fields {
            tree.set(
                format!("meta:{field}"),
                get_required(&self.document, field)?.clone(),
            );
        }
        let mut identities = get_required(&self.document, "identities")?
            .as_array()
            .ok_or_else(|| error("INVALID_WORLD", "identities must be an array"))?
            .to_vec();
        js_utf16_sort(&mut identities, "id");
        for identity in identities {
            let id = get_string(&identity, "id")?;
            tree.set(format!("identity:{id}"), identity.clone());
        }
        let mut fact_groups: BTreeMap<String, Vec<JsonValue>> = BTreeMap::new();
        for fact in get_required(&self.document, "facts")?
            .as_array()
            .ok_or_else(|| error("INVALID_WORLD", "facts must be an array"))?
        {
            let subject = get_string(fact, "subject")?;
            let predicate = get_string(fact, "predicate")?;
            fact_groups
                .entry(group_key("factset", &[subject, predicate]))
                .or_default()
                .push(fact.clone());
        }
        for (key, mut facts) in fact_groups {
            js_utf16_sort(&mut facts, "id");
            tree.set(key, JsonValue::Array(facts));
        }
        let mut relation_groups: BTreeMap<String, Vec<JsonValue>> = BTreeMap::new();
        for relation in get_required(&self.document, "relations")?
            .as_array()
            .ok_or_else(|| error("INVALID_WORLD", "relations must be an array"))?
        {
            let relation_type = get_string(relation, "type")?;
            let from = get_string(relation, "from")?;
            let to = get_string(relation, "to")?;
            relation_groups
                .entry(group_key("relationset", &[relation_type, from, to]))
                .or_default()
                .push(relation.clone());
        }
        for (key, mut relations) in relation_groups {
            js_utf16_sort(&mut relations, "id");
            tree.set(key, JsonValue::Array(relations));
        }
        let mut constraints = get_required(&self.document, "constraints")?
            .as_array()
            .ok_or_else(|| error("INVALID_WORLD", "constraints must be an array"))?
            .to_vec();
        js_utf16_sort(&mut constraints, "id");
        for constraint in constraints {
            let id = get_string(&constraint, "id")?;
            tree.set(format!("constraint:{id}"), constraint.clone());
        }
        let mut affordances = get_required(&self.document, "affordanceRules")?
            .as_array()
            .ok_or_else(|| error("INVALID_WORLD", "affordanceRules must be an array"))?
            .to_vec();
        js_utf16_sort(&mut affordances, "id");
        for affordance in affordances {
            let id = get_string(&affordance, "id")?;
            tree.set(format!("affordance:{id}"), affordance.clone());
        }
        Ok(tree.root())
    }

    /// Commits the C2 proof-native single-`setFact` transaction slice.
    ///
    /// # Errors
    ///
    /// Returns [`KernelError`] when the transaction is unsupported, malformed, or
    /// cannot produce a consistent proof-native event.
    // This orchestration remains contiguous so the authoritative transition can be
    // audited from pre-state proof through event publication.
    #[allow(clippy::too_many_lines)]
    pub fn commit_set_fact(
        &mut self,
        transaction: &JsonValue,
        proof_depth: usize,
    ) -> Result<JsonValue, KernelError> {
        let transaction_id = get_string(transaction, "id")?.to_owned();
        let authority = get_string(transaction, "authority")?.to_owned();
        let operations = get_required(transaction, "operations")?
            .as_array()
            .ok_or_else(|| error("INVALID_TRANSACTION", "operations must be an array"))?;
        if operations.len() != 1 || get_string(&operations[0], "op")? != "setFact" {
            return Err(error(
                "UNSUPPORTED_TRANSACTION",
                "native v0.2.0 slice accepts one setFact operation",
            ));
        }
        let before_root = self.structural_root(proof_depth)?;
        let before_revision = get_u64(&self.document, "revision")?;
        let logical_time = get_u64(&self.document, "time")?;
        let (fact, inverse) = self.apply_set_fact(get_required(&operations[0], "fact")?)?;
        self.set_revision(before_revision + 1)?;
        let after_root = self.structural_root(proof_depth)?;
        let subject = get_string(&fact, "subject")?;
        let predicate = get_string(&fact, "predicate")?;
        let touched = vec![
            string(format!("fact:*:{predicate}")),
            string(format!("fact:{subject}:{predicate}")),
            string(format!("identity:{subject}")),
        ];
        let touched_set = touched
            .iter()
            .filter_map(JsonValue::as_str)
            .collect::<BTreeSet<_>>();
        let constraints =
            affected_rule_ids(get_required(&self.document, "constraints")?, &touched_set)?;
        let affordances = affected_rule_ids(
            get_required(&self.document, "affordanceRules")?,
            &touched_set,
        )?;
        let normalized_operation = object(vec![("op", string("setFact")), ("fact", fact)]);
        let previous_event_hash = self
            .document
            .get("events")
            .and_then(JsonValue::as_array)
            .and_then(|events| events.last())
            .and_then(|event| event.get("eventHash"))
            .cloned()
            .unwrap_or(JsonValue::Null);
        let mut event = object(vec![
            ("id", string(transaction_id)),
            ("type", string("transaction.committed")),
            ("sequence", number(before_revision + 1)),
            (
                "branchId",
                get_required(&self.document, "branchId")?.clone(),
            ),
            ("logicalTime", number(logical_time)),
            ("revision", number(before_revision + 1)),
            ("authority", string(authority)),
            ("operations", JsonValue::Array(vec![normalized_operation])),
            ("inverseOperations", JsonValue::Array(vec![inverse])),
            (
                "env",
                transaction
                    .get("env")
                    .cloned()
                    .unwrap_or_else(|| JsonValue::Object(Vec::new())),
            ),
            ("hashMode", string("proof-native-v1")),
            ("beforeHash", string(before_root.clone())),
            ("afterHash", string(after_root.clone())),
            ("beforeProofRoot", string(before_root)),
            ("afterProofRoot", string(after_root)),
            ("previousEventHash", previous_event_hash),
            ("eventHash", JsonValue::Null),
            (
                "affectedRules",
                object(vec![
                    ("touched", JsonValue::Array(touched)),
                    (
                        "constraints",
                        JsonValue::Array(constraints.into_iter().map(string).collect()),
                    ),
                    (
                        "affordances",
                        JsonValue::Array(affordances.into_iter().map(string).collect()),
                    ),
                ]),
            ),
            (
                "metadata",
                transaction
                    .get("metadata")
                    .cloned()
                    .unwrap_or_else(|| JsonValue::Object(Vec::new())),
            ),
        ]);
        let event_hash = authoritative_event_hash(&event);
        set_object_field(&mut event, "eventHash", string(event_hash))?;
        if let Some(events) = self
            .document
            .get_mut("events")
            .and_then(JsonValue::as_array_mut)
        {
            events.push(event.clone());
        }
        Ok(event)
    }
}

fn affected_rule_ids(
    rules: &JsonValue,
    touched: &BTreeSet<&str>,
) -> Result<Vec<String>, KernelError> {
    let mut output = Vec::new();
    for rule in rules
        .as_array()
        .ok_or_else(|| error("INVALID_RULES", "rules must be an array"))?
    {
        let dependencies = rule
            .get("dependencies")
            .and_then(JsonValue::as_array)
            .unwrap_or(&[]);
        if dependencies
            .iter()
            .filter_map(JsonValue::as_str)
            .any(|dependency| touched.contains(dependency))
        {
            output.push(get_string(rule, "id")?.to_owned());
        }
    }
    output.sort_by(|left, right| left.encode_utf16().cmp(right.encode_utf16()));
    Ok(output)
}

#[must_use]
pub fn authoritative_event_hash(event: &JsonValue) -> String {
    let mut payload = event.clone();
    remove_object_field(&mut payload, "eventHash");
    remove_object_field(&mut payload, "inverseOperations");
    sha256_hex(payload.canonical_string().as_bytes())
}

impl NativeWorld {
    #[must_use]
    pub fn state_hash(&self) -> String {
        let mut state = self.document.clone();
        let _ = set_object_field(&mut state, "events", JsonValue::Array(Vec::new()));
        remove_object_field(&mut state, "history");
        sha256_hex(state.canonical_string().as_bytes())
    }

    #[must_use]
    pub fn reality_hash(&self) -> String {
        let mut state = self.document.clone();
        let _ = set_object_field(&mut state, "events", JsonValue::Array(Vec::new()));
        remove_object_field(&mut state, "history");
        remove_object_field(&mut state, "revision");
        remove_object_field(&mut state, "branchId");
        remove_object_field(&mut state, "branchInfo");
        sha256_hex(state.canonical_string().as_bytes())
    }

    /// Commits a deterministic legacy event used by the C3 scheduler slice.
    ///
    /// # Errors
    ///
    /// Returns [`KernelError`] when an operation is unsupported or the resulting
    /// event cannot be normalized and appended consistently.
    // Keep event normalization and publication in one auditable transition.
    #[allow(clippy::too_many_lines)]
    pub fn commit_legacy(
        &mut self,
        event_id: &str,
        authority: &str,
        operations: &[JsonValue],
        metadata: JsonValue,
    ) -> Result<JsonValue, KernelError> {
        let before_hash = self.state_hash();
        let before_revision = get_u64(&self.document, "revision")?;
        let mut normalized = Vec::new();
        let mut touched = BTreeSet::new();
        for operation in operations {
            match get_string(operation, "op")? {
                "setTime" => {
                    let time = get_u64(operation, "time")?;
                    self.set_time(time)?;
                    normalized.push(object(vec![
                        ("op", string("setTime")),
                        ("time", number(time)),
                    ]));
                    touched.insert("time".to_owned());
                }
                "setFact" => {
                    let (fact, _) = self.apply_set_fact(get_required(operation, "fact")?)?;
                    let subject = get_string(&fact, "subject")?.to_owned();
                    let predicate = get_string(&fact, "predicate")?.to_owned();
                    touched.insert(format!("fact:*:{predicate}"));
                    touched.insert(format!("fact:{subject}:{predicate}"));
                    touched.insert(format!("identity:{subject}"));
                    normalized.push(object(vec![("op", string("setFact")), ("fact", fact)]));
                }
                other => {
                    return Err(error(
                        "UNSUPPORTED_OPERATION",
                        format!("legacy native slice does not support {other}"),
                    ))
                }
            }
        }
        self.set_revision(before_revision + 1)?;
        let after_hash = self.state_hash();
        let logical_time = get_u64(&self.document, "time")?;
        let previous_event_hash = self
            .document
            .get("events")
            .and_then(JsonValue::as_array)
            .and_then(|events| events.last())
            .and_then(|event| event.get("eventHash"))
            .cloned()
            .unwrap_or(JsonValue::Null);
        let touched_refs = touched.iter().map(String::as_str).collect::<BTreeSet<_>>();
        let constraints =
            affected_rule_ids(get_required(&self.document, "constraints")?, &touched_refs)?;
        let affordances = affected_rule_ids(
            get_required(&self.document, "affordanceRules")?,
            &touched_refs,
        )?;
        let mut event = object(vec![
            ("id", string(event_id)),
            ("type", string("transaction.committed")),
            ("sequence", number(before_revision + 1)),
            (
                "branchId",
                get_required(&self.document, "branchId")?.clone(),
            ),
            ("logicalTime", number(logical_time)),
            ("revision", number(before_revision + 1)),
            ("authority", string(authority)),
            ("operations", JsonValue::Array(normalized)),
            ("inverseOperations", JsonValue::Array(Vec::new())),
            ("env", JsonValue::Object(Vec::new())),
            ("hashMode", string("legacy-state-v1")),
            ("beforeHash", string(before_hash)),
            ("afterHash", string(after_hash)),
            ("beforeProofRoot", JsonValue::Null),
            ("afterProofRoot", JsonValue::Null),
            ("previousEventHash", previous_event_hash),
            ("eventHash", JsonValue::Null),
            (
                "affectedRules",
                object(vec![
                    (
                        "touched",
                        JsonValue::Array(touched.into_iter().map(string).collect()),
                    ),
                    (
                        "constraints",
                        JsonValue::Array(constraints.into_iter().map(string).collect()),
                    ),
                    (
                        "affordances",
                        JsonValue::Array(affordances.into_iter().map(string).collect()),
                    ),
                ]),
            ),
            ("metadata", metadata),
        ]);
        let event_hash = authoritative_event_hash(&event);
        set_object_field(&mut event, "eventHash", string(event_hash))?;
        self.document
            .get_mut("events")
            .and_then(JsonValue::as_array_mut)
            .ok_or_else(|| error("INVALID_WORLD", "events must be an array"))?
            .push(event.clone());
        Ok(event)
    }
}

#[derive(Clone, Debug)]
struct NativeTask {
    id: String,
    base_id: String,
    occurrence: u64,
    due_time: u64,
    priority: i64,
    depends_on: Vec<String>,
    recurrence_interval: Option<u64>,
    recurrence_count: Option<u64>,
    transaction: JsonValue,
    status: String,
}

fn signed_number(value: &JsonValue) -> Option<i64> {
    match value {
        JsonValue::Number(number) => number.parse().ok(),
        _ => None,
    }
}

fn parse_task(value: &JsonValue) -> Result<NativeTask, KernelError> {
    let recurrence = value.get("recurrence");
    Ok(NativeTask {
        id: get_string(value, "id")?.to_owned(),
        base_id: value
            .get("baseId")
            .and_then(JsonValue::as_str)
            .unwrap_or(get_string(value, "id")?)
            .to_owned(),
        occurrence: value
            .get("occurrence")
            .and_then(JsonValue::as_u64)
            .unwrap_or(1),
        due_time: get_u64(value, "dueTime")?,
        priority: value.get("priority").and_then(signed_number).unwrap_or(0),
        depends_on: value
            .get("dependsOn")
            .and_then(JsonValue::as_array)
            .unwrap_or(&[])
            .iter()
            .filter_map(JsonValue::as_str)
            .map(str::to_owned)
            .collect(),
        recurrence_interval: recurrence
            .and_then(|item| item.get("interval"))
            .and_then(JsonValue::as_u64),
        recurrence_count: recurrence
            .and_then(|item| item.get("count"))
            .and_then(JsonValue::as_u64),
        transaction: get_required(value, "transaction")?.clone(),
        status: "scheduled".to_owned(),
    })
}

#[derive(Clone, Debug)]
pub struct SchedulerRun {
    pub world: NativeWorld,
    pub execution_order: Vec<String>,
}

/// Executes the deterministic C3 causal plan through `target_time`.
///
/// # Errors
///
/// Returns [`KernelError`] when the plan, a task dependency, or a scheduled
/// transaction is invalid.
// The scheduling loop stays contiguous to make ordering and recurrence auditable.
#[allow(clippy::too_many_lines)]
pub fn execute_causal_plan(
    base_world: JsonValue,
    plan: &JsonValue,
    target_time: u64,
) -> Result<SchedulerRun, KernelError> {
    let scheduler_id = get_string(plan, "schedulerId")?.to_owned();
    let mut tasks = get_required(plan, "tasks")?
        .as_array()
        .ok_or_else(|| error("INVALID_PLAN", "tasks must be an array"))?
        .iter()
        .map(parse_task)
        .collect::<Result<Vec<_>, _>>()?;
    let mut world = NativeWorld::from_document(base_world)?;
    let mut executed = BTreeSet::new();
    let mut execution_order = Vec::new();
    loop {
        let mut candidates = tasks
            .iter()
            .enumerate()
            .filter(|(_, task)| {
                task.status == "scheduled"
                    && task.due_time <= target_time
                    && task
                        .depends_on
                        .iter()
                        .all(|dependency| executed.contains(dependency))
            })
            .map(|(index, task)| (index, task.due_time, task.priority, task.id.clone()))
            .collect::<Vec<_>>();
        candidates.sort_by(|left, right| {
            left.1
                .cmp(&right.1)
                .then_with(|| right.2.cmp(&left.2))
                .then_with(|| left.3.encode_utf16().cmp(right.3.encode_utf16()))
        });
        let Some((index, _, _, _)) = candidates.into_iter().next() else {
            break;
        };
        let task = tasks[index].clone();
        let authority = task
            .transaction
            .get("authority")
            .and_then(JsonValue::as_str)
            .unwrap_or("authority:scheduler")
            .to_owned();
        let mut operations = vec![object(vec![
            ("op", string("setTime")),
            ("time", number(task.due_time)),
        ])];
        operations.extend(
            task.transaction
                .get("operations")
                .and_then(JsonValue::as_array)
                .unwrap_or(&[])
                .iter()
                .cloned(),
        );
        let execution_key = format!(
            "{scheduler_id}:{}:{}:{}",
            task.base_id, task.occurrence, task.due_time
        );
        let metadata = object(vec![(
            "causalScheduler",
            object(vec![
                ("schedulerId", string(scheduler_id.clone())),
                ("taskId", string(task.id.clone())),
                ("baseId", string(task.base_id.clone())),
                ("occurrence", number(task.occurrence)),
                ("dueTime", number(task.due_time)),
                ("priority", JsonValue::Number(task.priority.to_string())),
                ("executionKey", string(execution_key)),
            ]),
        )]);
        let _ = world.commit_legacy(
            &format!("event:causal:{}", task.id),
            &authority,
            &operations,
            metadata,
        )?;
        "executed".clone_into(&mut tasks[index].status);
        executed.insert(task.id.clone());
        execution_order.push(task.id.clone());
        if let (Some(interval), Some(count)) = (task.recurrence_interval, task.recurrence_count) {
            if task.occurrence < count {
                let occurrence = task.occurrence + 1;
                tasks.push(NativeTask {
                    id: format!("{}@{occurrence}", task.base_id),
                    base_id: task.base_id,
                    occurrence,
                    due_time: task.due_time + interval,
                    priority: task.priority,
                    depends_on: Vec::new(),
                    recurrence_interval: Some(interval),
                    recurrence_count: Some(count),
                    transaction: task.transaction,
                    status: "scheduled".to_owned(),
                });
            }
        }
    }
    let current_time = get_u64(world.document(), "time")?;
    if current_time != target_time {
        let operation = object(vec![
            ("op", string("setTime")),
            ("time", number(target_time)),
        ]);
        let next_revision = get_u64(world.document(), "revision")? + 1;
        let _ = world.commit_legacy(
            &format!("event:scheduler-clock:{scheduler_id}:{target_time}:{next_revision}"),
            "authority:scheduler",
            &[operation],
            object(vec![
                ("schedulerClockAdvance", JsonValue::Bool(true)),
                ("schedulerId", string(scheduler_id)),
                ("targetTime", number(target_time)),
            ]),
        )?;
    }
    Ok(SchedulerRun {
        world,
        execution_order,
    })
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct GenerationVerification {
    pub generation_id: String,
    pub revision: u64,
    pub object_count: usize,
    pub evidence_root: String,
    pub door_state: String,
}

/// Verifies and materializes the compact C4 continuity-store fixture.
///
/// # Errors
///
/// Returns [`KernelError`] when a pointer, generation, content-addressed object,
/// embedded integrity hash, paged index, or current fact is invalid.
// Verification is deliberately linear and contiguous so every trust boundary is
// visible in one recovery procedure.
#[allow(clippy::too_many_lines)]
pub fn verify_continuity_fixture(
    root: &std::path::Path,
) -> Result<GenerationVerification, KernelError> {
    use std::fs;
    let branch_dir = root.join("branches");
    let pointer_path = fs::read_dir(&branch_dir)
        .map_err(|failure| error("IO", failure.to_string()))?
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .find(|path| path.extension().and_then(|value| value.to_str()) == Some("json"))
        .ok_or_else(|| error("POINTER_NOT_FOUND", "no branch pointer found"))?;
    let pointer = read_verified_json_file(&pointer_path, None)?;
    verify_embedded_integrity(&pointer)?;
    let generation_id = get_string(&pointer, "generationId")?.to_owned();
    let generation_dir = root.join("generations").join(&generation_id);
    let generation = read_verified_json_file(&generation_dir.join("generation.json"), None)?;
    verify_embedded_integrity(&generation)?;
    let committed = fs::read_to_string(generation_dir.join("COMMITTED"))
        .map_err(|failure| error("IO", failure.to_string()))?;
    if committed.trim() != get_string(&generation, "integrityHash")? {
        return Err(error(
            "GENERATION_COMMIT_MISMATCH",
            "COMMITTED marker does not match generation hash",
        ));
    }
    let object_refs = get_required(&generation, "objectRefs")?
        .as_array()
        .ok_or_else(|| error("INVALID_GENERATION", "objectRefs must be an array"))?;
    for reference in object_refs.iter().filter_map(JsonValue::as_str) {
        let _ = read_content_object(root, reference)?;
    }
    let continuity_ref = get_string(&generation, "continuityManifestRef")?;
    let continuity = content_value(&read_content_object(root, continuity_ref)?)?.clone();
    let fact_index_ref = get_string(&continuity, "factGroupIndexRef")?;
    let fact_index = content_value(&read_content_object(root, fact_index_ref)?)?.clone();
    let group_key = "object:door\0state";
    let group_manifest = paged_index_get(root, &fact_index, group_key)?
        .ok_or_else(|| error("FACT_GROUP_NOT_FOUND", group_key))?;
    let segment_catalog_ref = get_string(&continuity, "segmentCatalogIndexRef")?;
    let segment_catalog = content_value(&read_content_object(root, segment_catalog_ref)?)?.clone();
    let mut records: BTreeMap<String, JsonValue> = BTreeMap::new();
    for field in ["baseRefs", "deltaRefs"] {
        for segment_id in group_manifest
            .get(field)
            .and_then(JsonValue::as_array)
            .unwrap_or(&[])
            .iter()
            .filter_map(JsonValue::as_str)
        {
            let catalog_entry = paged_index_get(root, &segment_catalog, segment_id)?
                .ok_or_else(|| error("SEGMENT_NOT_FOUND", segment_id))?;
            let object_ref = get_string(&catalog_entry, "objectRef")?;
            let segment = content_value(&read_content_object(root, object_ref)?)?.clone();
            let kind = get_string(&segment, "kind")?;
            for record in segment
                .get("records")
                .and_then(JsonValue::as_array)
                .unwrap_or(&[])
            {
                if kind.ends_with("-base") {
                    records.insert(get_string(record, "id")?.to_owned(), record.clone());
                } else {
                    for removed in record
                        .get("remove")
                        .and_then(JsonValue::as_array)
                        .unwrap_or(&[])
                        .iter()
                        .filter_map(JsonValue::as_str)
                    {
                        records.remove(removed);
                    }
                    for patched in record
                        .get("patch")
                        .and_then(JsonValue::as_array)
                        .unwrap_or(&[])
                    {
                        records.insert(get_string(patched, "id")?.to_owned(), patched.clone());
                    }
                    for appended in record
                        .get("append")
                        .and_then(JsonValue::as_array)
                        .unwrap_or(&[])
                    {
                        records.insert(get_string(appended, "id")?.to_owned(), appended.clone());
                    }
                }
            }
        }
    }
    let time = get_u64(&generation, "logicalTime")?;
    let door_state = records
        .values()
        .find(|record| {
            let from = record
                .get("validFrom")
                .and_then(JsonValue::as_u64)
                .unwrap_or(0);
            let to = record.get("validTo").and_then(JsonValue::as_u64);
            time >= from && to.is_none_or(|end| time < end)
        })
        .and_then(|record| record.get("value"))
        .and_then(JsonValue::as_str)
        .ok_or_else(|| error("CURRENT_FACT_NOT_FOUND", "door state"))?
        .to_owned();
    Ok(GenerationVerification {
        generation_id,
        revision: get_u64(&generation, "realityRevision")?,
        object_count: object_refs.len(),
        evidence_root: get_string(&generation, "evidenceRoot")?.to_owned(),
        door_state,
    })
}

fn read_verified_json_file(
    path: &std::path::Path,
    expected_hash: Option<&str>,
) -> Result<JsonValue, KernelError> {
    let text = std::fs::read_to_string(path)
        .map_err(|failure| error("IO", format!("{}: {failure}", path.display())))?;
    let value = rfe_canonical::parse_json(&text)?;
    if let Some(expected) = expected_hash {
        let actual = sha256_hex(value.canonical_string().as_bytes());
        if actual != expected {
            return Err(error(
                "OBJECT_HASH_MISMATCH",
                format!("expected {expected}, got {actual}"),
            ));
        }
    }
    Ok(value)
}

fn verify_embedded_integrity(value: &JsonValue) -> Result<(), KernelError> {
    let expected = get_string(value, "integrityHash")?.to_owned();
    let mut body = value.clone();
    remove_object_field(&mut body, "integrityHash");
    let actual = sha256_hex(body.canonical_string().as_bytes());
    if actual != expected {
        return Err(error(
            "INTEGRITY_MISMATCH",
            format!("expected {expected}, got {actual}"),
        ));
    }
    Ok(())
}

fn read_content_object(root: &std::path::Path, reference: &str) -> Result<JsonValue, KernelError> {
    let path = root
        .join("objects")
        .join(&reference[..2])
        .join(format!("{reference}.json"));
    let object = read_verified_json_file(&path, None)?;
    verify_embedded_integrity(&object)?;
    if get_string(&object, "integrityHash")? != reference {
        return Err(error("OBJECT_REFERENCE_MISMATCH", reference));
    }
    Ok(object)
}

fn content_value(object: &JsonValue) -> Result<&JsonValue, KernelError> {
    get_required(object, "value")
}

fn paged_index_get(
    root: &std::path::Path,
    index: &JsonValue,
    key: &str,
) -> Result<Option<JsonValue>, KernelError> {
    let pages = index
        .get("pages")
        .and_then(JsonValue::as_array)
        .ok_or_else(|| error("INVALID_INDEX", "pages must be an array"))?;
    for page in pages {
        let first = get_string(page, "firstKey")?;
        let last = get_string(page, "lastKey")?;
        if key.as_bytes() < first.as_bytes() || key.as_bytes() > last.as_bytes() {
            continue;
        }
        let page_object = read_content_object(root, get_string(page, "ref")?)?;
        let entries = content_value(&page_object)?
            .get("entries")
            .and_then(JsonValue::as_array)
            .ok_or_else(|| error("INVALID_PAGE", "entries must be an array"))?;
        for entry in entries {
            let pair = entry
                .as_array()
                .ok_or_else(|| error("INVALID_PAGE_ENTRY", "entry must be pair"))?;
            if pair.len() == 2 && pair[0].as_str() == Some(key) {
                return Ok(Some(pair[1].clone()));
            }
        }
    }
    Ok(None)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rfe_canonical::parse_json;

    #[test]
    fn structural_empty_tree_is_stable() {
        assert_eq!(StructuralProofTree::new(32).root().len(), 64);
    }

    #[test]
    fn authoritative_hash_excludes_inverse_operations() {
        let left =
            parse_json(r#"{"eventHash":null,"id":"e","inverseOperations":[1],"operations":[]}"#)
                .expect("valid");
        let right = parse_json(
            r#"{"eventHash":"tampered","id":"e","inverseOperations":[2],"operations":[]}"#,
        )
        .expect("valid");
        assert_eq!(
            authoritative_event_hash(&left),
            authoritative_event_hash(&right)
        );
    }
}
