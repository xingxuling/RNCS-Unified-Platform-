//! Store-first minimum closed reality loop for RFE v0.3.0.
//!
//! The normal path never constructs a complete RIR world document. It opens the
//! current Generation, loads only the semantic groups required for one decision,
//! commits one touched group plus the authority-event ledger, atomically swaps the
//! branch pointer, and reconstructs an observer-specific materialized view.

use rfe_canonical::{parse_json, sha256_hex, JsonError, JsonValue};
use rfe_native_kernel::{authoritative_event_hash, KernelError};
use std::cmp::Ordering;
use std::collections::BTreeMap;
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LoopError {
    pub code: &'static str,
    pub message: String,
}

impl Display for LoopError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}: {}", self.code, self.message)
    }
}

impl Error for LoopError {}

impl From<JsonError> for LoopError {
    fn from(value: JsonError) -> Self {
        Self {
            code: "INVALID_JSON",
            message: value.to_string(),
        }
    }
}

impl From<KernelError> for LoopError {
    fn from(value: KernelError) -> Self {
        Self {
            code: value.code,
            message: value.message,
        }
    }
}

fn error(code: &'static str, message: impl Into<String>) -> LoopError {
    LoopError {
        code,
        message: message.into(),
    }
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum CrashPoint {
    #[default]
    None,
    BeforePointerSwap,
    AfterPointerSwap,
}

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct StoreMetrics {
    pub object_reads: u64,
    pub object_read_bytes: u64,
    pub object_writes: u64,
    pub object_write_bytes: u64,
    pub generation_reads: u64,
    pub generation_writes: u64,
    pub pointer_swaps: u64,
    pub full_world_materializations: u64,
    pub max_decision_semantic_groups: u64,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ActionCommit {
    pub event: JsonValue,
    pub generation: JsonValue,
}

#[derive(Debug)]
pub struct ClosedLoopStore {
    root: PathBuf,
    metrics: StoreMetrics,
}

fn object(entries: Vec<(&str, JsonValue)>) -> JsonValue {
    JsonValue::Object(
        entries
            .into_iter()
            .map(|(key, value)| (key.to_owned(), value))
            .collect(),
    )
}

fn object_owned(entries: Vec<(String, JsonValue)>) -> JsonValue {
    JsonValue::Object(entries)
}

fn string(value: impl Into<String>) -> JsonValue {
    JsonValue::String(value.into())
}

fn number(value: u64) -> JsonValue {
    JsonValue::Number(value.to_string())
}

fn bool_value(value: bool) -> JsonValue {
    JsonValue::Bool(value)
}

fn get_required<'a>(value: &'a JsonValue, key: &str) -> Result<&'a JsonValue, LoopError> {
    value
        .get(key)
        .ok_or_else(|| error("MISSING_FIELD", format!("missing field: {key}")))
}

fn get_string<'a>(value: &'a JsonValue, key: &str) -> Result<&'a str, LoopError> {
    get_required(value, key)?
        .as_str()
        .ok_or_else(|| error("INVALID_FIELD", format!("field {key} must be a string")))
}

fn get_u64(value: &JsonValue, key: &str) -> Result<u64, LoopError> {
    get_required(value, key)?.as_u64().ok_or_else(|| {
        error(
            "INVALID_FIELD",
            format!("field {key} must be an unsigned integer"),
        )
    })
}

fn get_bool(value: &JsonValue, key: &str) -> Result<bool, LoopError> {
    match get_required(value, key)? {
        JsonValue::Bool(result) => Ok(*result),
        _ => Err(error(
            "INVALID_FIELD",
            format!("field {key} must be a boolean"),
        )),
    }
}

fn set_object_field(
    value: &mut JsonValue,
    key: &str,
    replacement: JsonValue,
) -> Result<(), LoopError> {
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

fn as_map(value: &JsonValue) -> Result<BTreeMap<String, JsonValue>, LoopError> {
    let entries = value
        .as_object()
        .ok_or_else(|| error("INVALID_OBJECT", "expected JSON object"))?;
    Ok(entries.iter().cloned().collect())
}

fn string_map(value: &JsonValue) -> Result<BTreeMap<String, String>, LoopError> {
    let entries = value
        .as_object()
        .ok_or_else(|| error("INVALID_OBJECT", "expected string map"))?;
    entries
        .iter()
        .map(|(key, item)| {
            item.as_str()
                .map(|text| (key.clone(), text.to_owned()))
                .ok_or_else(|| {
                    error(
                        "INVALID_FIELD",
                        format!("map value for {key} must be a string"),
                    )
                })
        })
        .collect()
}

fn utf16_cmp(left: &str, right: &str) -> Ordering {
    left.encode_utf16().cmp(right.encode_utf16())
}

fn sort_strings(values: &mut [String]) {
    values.sort_by(|left, right| utf16_cmp(left, right));
}

fn with_integrity(mut value: JsonValue) -> Result<JsonValue, LoopError> {
    remove_object_field(&mut value, "integrityHash");
    let integrity = sha256_hex(value.canonical_string().as_bytes());
    set_object_field(&mut value, "integrityHash", string(integrity))?;
    Ok(value)
}

fn verify_integrity(value: &JsonValue) -> Result<(), LoopError> {
    let expected = get_string(value, "integrityHash")?.to_owned();
    let mut body = value.clone();
    remove_object_field(&mut body, "integrityHash");
    let actual = sha256_hex(body.canonical_string().as_bytes());
    if actual == expected {
        Ok(())
    } else {
        Err(error(
            "INTEGRITY_MISMATCH",
            format!("expected {expected}, got {actual}"),
        ))
    }
}

fn semantic_root(refs: &BTreeMap<String, String>) -> String {
    let entries = refs
        .iter()
        .filter(|(key, _)| key.as_str() != "event-ledger")
        .map(|(key, value)| (key.clone(), string(value.clone())))
        .collect();
    let payload = object(vec![
        ("format", string("rfe.semantic-root.v1")),
        ("refs", object_owned(entries)),
    ]);
    sha256_hex(payload.canonical_string().as_bytes())
}

fn evidence_root(semantic: &str, event_ledger_ref: &str, parent: Option<&str>) -> String {
    let payload = object(vec![
        ("format", string("rfe.evidence-root.v1")),
        ("semanticRoot", string(semantic)),
        ("eventLedgerRef", string(event_ledger_ref)),
        ("parentEvidenceRoot", parent.map_or(JsonValue::Null, string)),
    ]);
    sha256_hex(payload.canonical_string().as_bytes())
}

fn generation_manifest(
    branch_id: &str,
    revision: u64,
    logical_time: u64,
    parent_generation_id: Option<&str>,
    parent_evidence_root: Option<&str>,
    refs: &BTreeMap<String, String>,
) -> Result<JsonValue, LoopError> {
    let semantic = semantic_root(refs);
    let generation_id = format!("generation:{revision}:{}", &semantic[..16]);
    let refs_value = object_owned(
        refs.iter()
            .map(|(key, value)| (key.clone(), string(value.clone())))
            .collect(),
    );
    with_integrity(object(vec![
        ("format", string("rfe.generation.v0.3")),
        ("branchId", string(branch_id)),
        ("generationId", string(generation_id)),
        (
            "parentGenerationId",
            parent_generation_id.map_or(JsonValue::Null, string),
        ),
        ("realityRevision", number(revision)),
        ("logicalTime", number(logical_time)),
        ("semanticRoot", string(semantic.clone())),
        (
            "evidenceRoot",
            string(evidence_root(
                &semantic,
                refs.get("event-ledger").map_or("", String::as_str),
                parent_evidence_root,
            )),
        ),
        ("refs", refs_value),
    ]))
}

fn pointer_document(generation: &JsonValue) -> Result<JsonValue, LoopError> {
    with_integrity(object(vec![
        ("format", string("rfe.branch-pointer.v0.3")),
        ("branchId", string(get_string(generation, "branchId")?)),
        (
            "generationId",
            string(get_string(generation, "generationId")?),
        ),
        ("revision", number(get_u64(generation, "realityRevision")?)),
    ]))
}

fn is_current(record: &JsonValue, time: u64) -> bool {
    let from = record
        .get("validFrom")
        .and_then(JsonValue::as_u64)
        .unwrap_or(0);
    let to = record.get("validTo").and_then(JsonValue::as_u64);
    time >= from && to.is_none_or(|end| time < end)
}

fn current_record<F>(records: &[JsonValue], time: u64, predicate: F) -> Option<&JsonValue>
where
    F: Fn(&JsonValue) -> bool,
{
    records
        .iter()
        .find(|record| predicate(record) && is_current(record, time))
}

fn group_array<'a>(
    groups: &'a BTreeMap<String, JsonValue>,
    key: &str,
) -> Result<&'a [JsonValue], LoopError> {
    groups
        .get(key)
        .and_then(JsonValue::as_array)
        .ok_or_else(|| error("GROUP_NOT_FOUND", format!("group {key} must be an array")))
}

fn relation_exists(
    groups: &BTreeMap<String, JsonValue>,
    relation_type: &str,
    from: &str,
    to: &str,
    time: u64,
) -> Result<bool, LoopError> {
    let key = format!("relation:{relation_type}");
    Ok(group_array(groups, &key)?.iter().any(|relation| {
        relation.get("from").and_then(JsonValue::as_str) == Some(from)
            && relation.get("to").and_then(JsonValue::as_str) == Some(to)
            && is_current(relation, time)
    }))
}

fn current_location(
    groups: &BTreeMap<String, JsonValue>,
    actor: &str,
    time: u64,
) -> Result<Option<String>, LoopError> {
    Ok(current_record(
        group_array(groups, "relation:located_in")?,
        time,
        |relation| relation.get("from").and_then(JsonValue::as_str) == Some(actor),
    )
    .and_then(|relation| relation.get("to"))
    .and_then(JsonValue::as_str)
    .map(str::to_owned))
}

fn door_state(
    groups: &BTreeMap<String, JsonValue>,
    door: &str,
    time: u64,
) -> Result<Option<String>, LoopError> {
    let key = format!("fact:{door}:state");
    Ok(current_record(group_array(groups, &key)?, time, |_| true)
        .and_then(|fact| fact.get("value"))
        .and_then(JsonValue::as_str)
        .map(str::to_owned))
}

fn matching_owned_key(
    groups: &BTreeMap<String, JsonValue>,
    actor: &str,
    door: &str,
    time: u64,
) -> Result<Option<String>, LoopError> {
    let mut owned = group_array(groups, "relation:owns")?
        .iter()
        .filter(|relation| {
            relation.get("from").and_then(JsonValue::as_str) == Some(actor)
                && is_current(relation, time)
        })
        .filter_map(|relation| {
            relation
                .get("to")
                .and_then(JsonValue::as_str)
                .map(str::to_owned)
        })
        .collect::<Vec<_>>();
    sort_strings(&mut owned);
    for key in owned {
        if relation_exists(groups, "unlocks", &key, door, time)? {
            return Ok(Some(key));
        }
    }
    Ok(None)
}

fn door_for_destination(
    groups: &BTreeMap<String, JsonValue>,
    actor: &str,
    destination: &str,
    time: u64,
) -> Result<Option<String>, LoopError> {
    let Some(location) = current_location(groups, actor, time)? else {
        return Ok(None);
    };
    let mut candidates = group_array(groups, "relation:connects_to")?
        .iter()
        .filter(|relation| {
            relation.get("to").and_then(JsonValue::as_str) == Some(destination)
                && is_current(relation, time)
        })
        .filter_map(|relation| {
            relation
                .get("from")
                .and_then(JsonValue::as_str)
                .map(str::to_owned)
        })
        .collect::<Vec<_>>();
    candidates.retain(|door| {
        relation_exists(groups, "connects_from", door, &location, time).unwrap_or(false)
    });
    sort_strings(&mut candidates);
    Ok(candidates.into_iter().next())
}

fn reason_array(reasons: Vec<&str>) -> JsonValue {
    JsonValue::Array(reasons.into_iter().map(string).collect())
}

fn evaluate_action(
    groups: &BTreeMap<String, JsonValue>,
    actor: &str,
    door: &str,
    action: &str,
    time: u64,
) -> Result<JsonValue, LoopError> {
    let state = door_state(groups, door, time)?;
    let location = current_location(groups, actor, time)?;
    let origin = group_array(groups, "relation:connects_from")?
        .iter()
        .find(|relation| {
            relation.get("from").and_then(JsonValue::as_str) == Some(door)
                && is_current(relation, time)
        })
        .and_then(|relation| relation.get("to"))
        .and_then(JsonValue::as_str)
        .map(str::to_owned);
    let mut reasons = Vec::new();
    match action {
        "unlock" => {
            if state.as_deref() != Some("locked") {
                reasons.push("requires_state:locked");
            }
            if matching_owned_key(groups, actor, door, time)?.is_none() {
                reasons.push("missing_owned_matching_key");
            }
        }
        "open" => {
            if state.as_deref() != Some("unlocked") {
                reasons.push("requires_state:unlocked");
            }
        }
        "pass" => {
            if state.as_deref() != Some("open") {
                reasons.push("requires_state:open");
            }
            if location != origin {
                reasons.push("actor_not_at_door_origin");
            }
        }
        "inspect" => {}
        other => return Err(error("UNSUPPORTED_ACTION", other)),
    }
    Ok(object(vec![
        ("action", string(action)),
        ("available", bool_value(reasons.is_empty())),
        ("reasonCodes", reason_array(reasons)),
    ]))
}

fn query_affordances(
    groups: &BTreeMap<String, JsonValue>,
    actor: &str,
    door: &str,
    time: u64,
) -> Result<JsonValue, LoopError> {
    let decisions = group_array(groups, "affordance:door")?
        .iter()
        .map(|rule| {
            let action = get_string(rule, "action")?;
            evaluate_action(groups, actor, door, action, time)
        })
        .collect::<Result<Vec<_>, _>>()?;
    Ok(JsonValue::Array(decisions))
}

fn plan_next_action(
    groups: &BTreeMap<String, JsonValue>,
    generation: &JsonValue,
    intent: &JsonValue,
) -> Result<JsonValue, LoopError> {
    let actor = get_string(intent, "subject")?;
    let destination = get_string(intent, "target")?;
    let time = get_u64(generation, "logicalTime")?;
    if current_location(groups, actor, time)?.as_deref() == Some(destination) {
        return Ok(object(vec![
            ("status", string("satisfied")),
            ("action", JsonValue::Null),
            ("door", JsonValue::Null),
            ("reasonCodes", JsonValue::Array(Vec::new())),
        ]));
    }
    let Some(door) = door_for_destination(groups, actor, destination, time)? else {
        return Ok(object(vec![
            ("status", string("rejected")),
            ("action", JsonValue::Null),
            ("door", JsonValue::Null),
            ("reasonCodes", reason_array(vec!["no_connected_door"])),
        ]));
    };
    let action = match door_state(groups, &door, time)?.as_deref() {
        Some("locked") => "unlock",
        Some("unlocked") => "open",
        Some("open") => "pass",
        _ => {
            return Ok(object(vec![
                ("status", string("rejected")),
                ("action", JsonValue::Null),
                ("door", string(door)),
                ("reasonCodes", reason_array(vec!["invalid_door_state"])),
            ]));
        }
    };
    let decision = evaluate_action(groups, actor, &door, action, time)?;
    if !get_bool(&decision, "available")? {
        return Ok(object(vec![
            ("status", string("rejected")),
            ("action", JsonValue::Null),
            ("door", string(door)),
            (
                "reasonCodes",
                get_required(&decision, "reasonCodes")?.clone(),
            ),
        ]));
    }
    Ok(object(vec![
        ("status", string("action")),
        ("action", string(action)),
        ("door", string(door)),
        ("reasonCodes", JsonValue::Array(Vec::new())),
    ]))
}

impl ClosedLoopStore {
    /// Bootstraps a content-addressed closed-loop store from the frozen bootstrap fixture.
    ///
    /// # Errors
    ///
    /// Returns [`LoopError`] when fixture groups, object hashes, Generation integrity,
    /// or the branch pointer are invalid.
    pub fn bootstrap(root: impl AsRef<Path>, bootstrap: &JsonValue) -> Result<Self, LoopError> {
        let root = root.as_ref().to_path_buf();
        fs::create_dir_all(root.join("objects"))?;
        fs::create_dir_all(root.join("generations"))?;
        fs::create_dir_all(root.join("branches"))?;
        let mut store = Self {
            root,
            metrics: StoreMetrics::default(),
        };
        let generation = get_required(bootstrap, "generation")?;
        verify_integrity(generation)?;
        let expected_refs = string_map(get_required(generation, "refs")?)?;
        for (key, group) in as_map(get_required(bootstrap, "groups")?)? {
            let actual = store.write_object(&group)?;
            let expected = expected_refs
                .get(&key)
                .ok_or_else(|| error("MISSING_GROUP_REF", key.clone()))?;
            if &actual != expected {
                return Err(error(
                    "GROUP_HASH_MISMATCH",
                    format!("{key}: expected {expected}, got {actual}"),
                ));
            }
        }
        store.write_generation(generation)?;
        store.swap_pointer(generation)?;
        Ok(store)
    }

    /// Opens an existing store without materializing a world document.
    ///
    /// # Errors
    ///
    /// Returns [`LoopError`] when the store directories are missing.
    pub fn open(root: impl AsRef<Path>) -> Result<Self, LoopError> {
        let root = root.as_ref().to_path_buf();
        for directory in ["objects", "generations", "branches"] {
            if !root.join(directory).is_dir() {
                return Err(error("STORE_NOT_FOUND", format!("missing {directory}")));
            }
        }
        Ok(Self {
            root,
            metrics: StoreMetrics::default(),
        })
    }

    #[must_use]
    pub fn root(&self) -> &Path {
        &self.root
    }

    #[must_use]
    pub fn metrics(&self) -> &StoreMetrics {
        &self.metrics
    }

    pub fn reset_metrics(&mut self) {
        self.metrics = StoreMetrics::default();
    }

    fn object_path(&self, reference: &str) -> Result<PathBuf, LoopError> {
        if reference.len() < 2 || !reference.bytes().all(|byte| byte.is_ascii_hexdigit()) {
            return Err(error("INVALID_OBJECT_REF", reference));
        }
        Ok(self
            .root
            .join("objects")
            .join(&reference[..2])
            .join(format!("{reference}.json")))
    }

    fn generation_dir(&self, generation_id: &str) -> PathBuf {
        self.root
            .join("generations")
            .join(sha256_hex(generation_id.as_bytes()))
    }

    fn branch_path(&self, branch_id: &str) -> PathBuf {
        self.root
            .join("branches")
            .join(format!("{}.json", sha256_hex(branch_id.as_bytes())))
    }

    fn write_object(&mut self, value: &JsonValue) -> Result<String, LoopError> {
        let canonical = value.canonical_string();
        let reference = sha256_hex(canonical.as_bytes());
        let path = self.object_path(&reference)?;
        if !path.exists() {
            let parent = path
                .parent()
                .ok_or_else(|| error("INVALID_PATH", path.display().to_string()))?;
            fs::create_dir_all(parent)?;
            fs::write(&path, canonical.as_bytes())?;
            self.metrics.object_writes += 1;
            self.metrics.object_write_bytes += u64::try_from(canonical.len())
                .map_err(|failure| error("INTEGER_OVERFLOW", failure.to_string()))?;
        }
        Ok(reference)
    }

    fn read_object(&mut self, reference: &str) -> Result<JsonValue, LoopError> {
        let path = self.object_path(reference)?;
        let bytes = fs::read(&path)
            .map_err(|failure| error("IO", format!("{}: {failure}", path.display())))?;
        self.metrics.object_reads += 1;
        self.metrics.object_read_bytes += u64::try_from(bytes.len())
            .map_err(|failure| error("INTEGER_OVERFLOW", failure.to_string()))?;
        let text = std::str::from_utf8(&bytes)
            .map_err(|failure| error("INVALID_UTF8", failure.to_string()))?;
        let value = parse_json(text)?;
        let actual = sha256_hex(value.canonical_string().as_bytes());
        if actual != reference {
            return Err(error(
                "OBJECT_HASH_MISMATCH",
                format!("expected {reference}, got {actual}"),
            ));
        }
        Ok(value)
    }

    fn write_generation(&mut self, generation: &JsonValue) -> Result<(), LoopError> {
        verify_integrity(generation)?;
        let generation_id = get_string(generation, "generationId")?;
        let directory = self.generation_dir(generation_id);
        fs::create_dir_all(&directory)?;
        let canonical = generation.canonical_string();
        fs::write(directory.join("generation.json"), canonical.as_bytes())?;
        fs::write(
            directory.join("COMMITTED"),
            get_string(generation, "integrityHash")?.as_bytes(),
        )?;
        self.metrics.generation_writes += 1;
        Ok(())
    }

    fn read_generation(&mut self, generation_id: &str) -> Result<JsonValue, LoopError> {
        let directory = self.generation_dir(generation_id);
        let text = fs::read_to_string(directory.join("generation.json"))?;
        let generation = parse_json(&text)?;
        verify_integrity(&generation)?;
        if get_string(&generation, "generationId")? != generation_id {
            return Err(error("GENERATION_ID_MISMATCH", generation_id));
        }
        let committed = fs::read_to_string(directory.join("COMMITTED"))?;
        if committed != get_string(&generation, "integrityHash")? {
            return Err(error("GENERATION_COMMIT_MISMATCH", generation_id));
        }
        self.metrics.generation_reads += 1;
        Ok(generation)
    }

    fn swap_pointer(&mut self, generation: &JsonValue) -> Result<(), LoopError> {
        let branch_id = get_string(generation, "branchId")?;
        let pointer = pointer_document(generation)?;
        let path = self.branch_path(branch_id);
        let temporary = path.with_extension(format!("{}.tmp", std::process::id()));
        fs::write(&temporary, pointer.canonical_string())?;
        match fs::rename(&temporary, &path) {
            Ok(()) => {}
            Err(failure) if failure.kind() == std::io::ErrorKind::AlreadyExists => {
                fs::remove_file(&path)?;
                fs::rename(&temporary, &path)?;
            }
            Err(failure) => return Err(error("POINTER_SWAP_FAILED", failure.to_string())),
        }
        self.metrics.pointer_swaps += 1;
        Ok(())
    }

    /// Recovers the authoritative Generation selected by the branch pointer.
    ///
    /// # Errors
    ///
    /// Returns [`LoopError`] when the pointer, Generation, or commit marker is invalid.
    pub fn current_generation(&mut self, branch_id: &str) -> Result<JsonValue, LoopError> {
        let path = self.branch_path(branch_id);
        let pointer = parse_json(&fs::read_to_string(&path)?)?;
        verify_integrity(&pointer)?;
        if get_string(&pointer, "branchId")? != branch_id {
            return Err(error("BRANCH_POINTER_MISMATCH", branch_id));
        }
        self.read_generation(get_string(&pointer, "generationId")?)
    }

    fn load_group(&mut self, generation: &JsonValue, key: &str) -> Result<JsonValue, LoopError> {
        let refs = string_map(get_required(generation, "refs")?)?;
        let reference = refs
            .get(key)
            .ok_or_else(|| error("GROUP_REF_NOT_FOUND", key))?;
        self.read_object(reference)
    }

    fn load_decision_groups(
        &mut self,
        generation: &JsonValue,
    ) -> Result<BTreeMap<String, JsonValue>, LoopError> {
        const KEYS: [&str; 7] = [
            "fact:object:door:state",
            "relation:owns",
            "relation:unlocks",
            "relation:connects_from",
            "relation:connects_to",
            "relation:located_in",
            "affordance:door",
        ];
        self.metrics.max_decision_semantic_groups = self
            .metrics
            .max_decision_semantic_groups
            .max(KEYS.len() as u64);
        KEYS.into_iter()
            .map(|key| {
                self.load_group(generation, key)
                    .map(|value| (key.to_owned(), value))
            })
            .collect()
    }

    /// Queries all door affordances visible to the actor in the current Generation.
    ///
    /// # Errors
    ///
    /// Returns [`LoopError`] when required semantic groups are missing or malformed.
    pub fn query_current_affordances(
        &mut self,
        branch_id: &str,
        actor: &str,
        door: &str,
    ) -> Result<JsonValue, LoopError> {
        let generation = self.current_generation(branch_id)?;
        let groups = self.load_decision_groups(&generation)?;
        query_affordances(&groups, actor, door, get_u64(&generation, "logicalTime")?)
    }

    /// Resolves the next deterministic action for an intent.
    ///
    /// # Errors
    ///
    /// Returns [`LoopError`] when the intent or required semantic groups are invalid.
    pub fn resolve_next_action(
        &mut self,
        branch_id: &str,
        intent: &JsonValue,
    ) -> Result<JsonValue, LoopError> {
        let generation = self.current_generation(branch_id)?;
        let groups = self.load_decision_groups(&generation)?;
        plan_next_action(&groups, &generation, intent)
    }

    fn close_current(
        records: &mut [JsonValue],
        logical_time: u64,
        predicate: impl Fn(&JsonValue) -> bool,
    ) -> Result<(), LoopError> {
        let previous_time = logical_time.saturating_sub(1);
        if let Some(record) = records
            .iter_mut()
            .find(|record| predicate(record) && is_current(record, previous_time))
        {
            set_object_field(record, "validTo", number(logical_time))?;
        }
        Ok(())
    }

    fn validate_door_state(
        &mut self,
        generation: &JsonValue,
        state: &str,
    ) -> Result<(), LoopError> {
        let _constraint_group = self.load_group(generation, "constraint:world")?;
        if matches!(state, "locked" | "unlocked" | "open") {
            Ok(())
        } else {
            Err(error(
                "HARD_CONSTRAINT_VIOLATION",
                format!("invalid door state: {state}"),
            ))
        }
    }

    /// Commits one resolved action through a store-first Generation transition.
    ///
    /// # Errors
    ///
    /// Returns [`LoopError`] for unsupported actions, failed hard constraints,
    /// object-integrity failures, or injected crash points.
    #[allow(clippy::too_many_lines)]
    pub fn commit_action(
        &mut self,
        branch_id: &str,
        intent: &JsonValue,
        plan: &JsonValue,
        crash: CrashPoint,
    ) -> Result<ActionCommit, LoopError> {
        if get_string(plan, "status")? != "action" {
            return Err(error("PLAN_NOT_ACTIONABLE", get_string(plan, "status")?));
        }
        let generation = self.current_generation(branch_id)?;
        let mut refs = string_map(get_required(&generation, "refs")?)?;
        let revision = get_u64(&generation, "realityRevision")? + 1;
        let logical_time = get_u64(&generation, "logicalTime")? + 1;
        let action = get_string(plan, "action")?;
        let door = get_string(plan, "door")?;
        let actor = get_string(intent, "subject")?;
        let authority = get_string(intent, "authority")?;
        let intent_id = get_string(intent, "id")?;
        let destination = get_string(intent, "target")?;
        let (operations, touched_groups) = match action {
            "unlock" | "open" => {
                let next_state = if action == "unlock" {
                    "unlocked"
                } else {
                    "open"
                };
                self.validate_door_state(&generation, next_state)?;
                let key = format!("fact:{door}:state");
                let mut records = self
                    .load_group(&generation, &key)?
                    .as_array()
                    .ok_or_else(|| error("INVALID_GROUP", &key))?
                    .to_vec();
                Self::close_current(&mut records, logical_time, |_| true)?;
                let fact = object(vec![
                    ("id", string(format!("fact:door-state:{revision}"))),
                    ("subject", string(door)),
                    ("predicate", string("state")),
                    ("value", string(next_state)),
                    ("validFrom", number(logical_time)),
                    ("validTo", JsonValue::Null),
                    ("source", string("source:closed-loop")),
                    ("confidence", number(1)),
                    ("visibility", object(vec![("type", string("public"))])),
                    ("authority", string(authority)),
                ]);
                records.push(fact.clone());
                refs.insert(key.clone(), self.write_object(&JsonValue::Array(records))?);
                (
                    JsonValue::Array(vec![object(vec![
                        ("op", string("setFact")),
                        ("fact", fact),
                    ])]),
                    vec![key],
                )
            }
            "pass" => {
                let key = "relation:located_in".to_owned();
                let mut records = self
                    .load_group(&generation, &key)?
                    .as_array()
                    .ok_or_else(|| error("INVALID_GROUP", &key))?
                    .to_vec();
                Self::close_current(&mut records, logical_time, |relation| {
                    relation.get("from").and_then(JsonValue::as_str) == Some(actor)
                })?;
                let relation = object(vec![
                    ("id", string(format!("relation:player-location:{revision}"))),
                    ("type", string("located_in")),
                    ("from", string(actor)),
                    ("to", string(destination)),
                    ("qualifiers", JsonValue::Object(Vec::new())),
                    ("validFrom", number(logical_time)),
                    ("validTo", JsonValue::Null),
                    ("authority", string(authority)),
                ]);
                records.push(relation.clone());
                refs.insert(key.clone(), self.write_object(&JsonValue::Array(records))?);
                (
                    JsonValue::Array(vec![
                        object(vec![
                            ("op", string("removeRelation")),
                            (
                                "match",
                                object(vec![
                                    ("type", string("located_in")),
                                    ("from", string(actor)),
                                ]),
                            ),
                        ]),
                        object(vec![("op", string("addRelation")), ("relation", relation)]),
                    ]),
                    vec![key],
                )
            }
            other => return Err(error("UNSUPPORTED_ACTION", other)),
        };
        let before_root = get_string(&generation, "semanticRoot")?.to_owned();
        let after_root = semantic_root(&refs);
        let mut ledger = self
            .load_group(&generation, "event-ledger")?
            .as_array()
            .ok_or_else(|| error("INVALID_GROUP", "event-ledger"))?
            .to_vec();
        let previous_event_hash = ledger
            .last()
            .and_then(|event| event.get("eventHash"))
            .cloned()
            .unwrap_or(JsonValue::Null);
        let mut event = object(vec![
            (
                "id",
                string(format!("event:{intent_id}:{revision}:{action}")),
            ),
            ("type", string("transaction.committed")),
            ("sequence", number(revision)),
            ("branchId", string(branch_id)),
            ("logicalTime", number(logical_time)),
            ("revision", number(revision)),
            ("authority", string(authority)),
            ("intentId", string(intent_id)),
            ("action", string(action)),
            ("target", string(door)),
            ("operations", operations),
            ("inverseOperations", JsonValue::Array(Vec::new())),
            ("hashMode", string("proof-native-store-v1")),
            ("beforeProofRoot", string(before_root)),
            ("afterProofRoot", string(after_root)),
            ("previousEventHash", previous_event_hash),
            ("eventHash", JsonValue::Null),
            (
                "touchedGroups",
                JsonValue::Array(touched_groups.iter().cloned().map(string).collect()),
            ),
            (
                "metadata",
                object(vec![
                    ("closedRealityLoop", bool_value(true)),
                    ("destination", string(destination)),
                ]),
            ),
        ]);
        let event_hash = authoritative_event_hash(&event);
        set_object_field(&mut event, "eventHash", string(event_hash))?;
        ledger.push(event.clone());
        refs.insert(
            "event-ledger".to_owned(),
            self.write_object(&JsonValue::Array(ledger))?,
        );
        let next_generation = generation_manifest(
            branch_id,
            revision,
            logical_time,
            Some(get_string(&generation, "generationId")?),
            Some(get_string(&generation, "evidenceRoot")?),
            &refs,
        )?;
        self.write_generation(&next_generation)?;
        if crash == CrashPoint::BeforePointerSwap {
            return Err(error(
                "CRASH_INJECTED_BEFORE_POINTER_SWAP",
                get_string(&next_generation, "generationId")?,
            ));
        }
        self.swap_pointer(&next_generation)?;
        if crash == CrashPoint::AfterPointerSwap {
            return Err(error(
                "CRASH_INJECTED_AFTER_POINTER_SWAP",
                get_string(&next_generation, "generationId")?,
            ));
        }
        Ok(ActionCommit {
            event,
            generation: next_generation,
        })
    }

    /// Builds an observer-specific materialized view from selected semantic groups.
    ///
    /// # Errors
    ///
    /// Returns [`LoopError`] when the branch, intent, or semantic groups are invalid.
    pub fn observe(&mut self, branch_id: &str, intent: &JsonValue) -> Result<JsonValue, LoopError> {
        let generation = self.current_generation(branch_id)?;
        let groups = self.load_decision_groups(&generation)?;
        observer_view(&groups, &generation, intent)
    }

    /// Executes intent → affordance → resolution → commit → observer → feedback.
    ///
    /// # Errors
    ///
    /// Returns [`LoopError`] when the intent is rejected, cannot converge within
    /// eight authority transitions, or any store integrity boundary fails.
    #[allow(clippy::too_many_lines)]
    pub fn run_intent(
        &mut self,
        branch_id: &str,
        intent: &JsonValue,
    ) -> Result<JsonValue, LoopError> {
        let initial_view = self.observe(branch_id, intent)?;
        let mut views = Vec::new();
        let mut plans = Vec::new();
        let mut events = Vec::new();
        let mut generation_ids =
            vec![get_string(&self.current_generation(branch_id)?, "generationId")?.to_owned()];
        for _ in 0..8 {
            let plan = self.resolve_next_action(branch_id, intent)?;
            let status = get_string(&plan, "status")?.to_owned();
            plans.push(plan.clone());
            if status == "satisfied" {
                break;
            }
            if status != "action" {
                return Err(error(
                    "INTENT_REJECTED",
                    get_required(&plan, "reasonCodes")?.canonical_string(),
                ));
            }
            let committed = self.commit_action(branch_id, intent, &plan, CrashPoint::None)?;
            generation_ids.push(get_string(&committed.generation, "generationId")?.to_owned());
            events.push(committed.event);
            views.push(self.observe(branch_id, intent)?);
        }
        let final_view = views
            .last()
            .cloned()
            .unwrap_or_else(|| initial_view.clone());
        let final_generation = self.current_generation(branch_id)?;
        let satisfied = match get_required(get_required(&final_view, "goal")?, "satisfied")? {
            JsonValue::Bool(value) => *value,
            _ => false,
        };
        let feedback_body = object(vec![
            ("format", string("rfe.experience-feedback.v0.3")),
            ("intentId", string(get_string(intent, "id")?)),
            (
                "status",
                string(if satisfied { "satisfied" } else { "incomplete" }),
            ),
            ("steps", number(events.len() as u64)),
            (
                "finalGenerationId",
                string(get_string(&final_generation, "generationId")?),
            ),
            (
                "finalViewHash",
                string(get_string(&final_view, "viewHash")?),
            ),
        ]);
        let mut feedback = feedback_body.clone();
        set_object_field(
            &mut feedback,
            "feedbackHash",
            string(sha256_hex(feedback_body.canonical_string().as_bytes())),
        )?;
        Ok(object(vec![
            ("format", string("rfe.closed-loop-result.v0.3")),
            ("intent", intent.clone()),
            ("initialView", initial_view),
            ("plans", JsonValue::Array(plans)),
            ("events", JsonValue::Array(events.clone())),
            (
                "generationIds",
                JsonValue::Array(generation_ids.into_iter().map(string).collect()),
            ),
            ("views", JsonValue::Array(views)),
            ("finalView", final_view),
            ("feedback", feedback),
            ("finalGeneration", final_generation),
            (
                "metrics",
                object(vec![
                    ("fullWorldMaterializations", number(0)),
                    ("decisionSemanticGroups", number(7)),
                    (
                        "commitTouchedGroups",
                        JsonValue::Array(
                            events
                                .iter()
                                .map(|event| {
                                    number(
                                        event
                                            .get("touchedGroups")
                                            .and_then(JsonValue::as_array)
                                            .map_or(0, <[JsonValue]>::len)
                                            as u64,
                                    )
                                })
                                .collect(),
                        ),
                    ),
                    ("commits", number(events.len() as u64)),
                ]),
            ),
        ]))
    }

    /// Loads the event ledger selected by the current Generation.
    ///
    /// # Errors
    ///
    /// Returns [`LoopError`] when the branch or event-ledger object is invalid.
    pub fn current_event_ledger(&mut self, branch_id: &str) -> Result<JsonValue, LoopError> {
        let generation = self.current_generation(branch_id)?;
        self.load_group(&generation, "event-ledger")
    }
}

fn observer_view(
    groups: &BTreeMap<String, JsonValue>,
    generation: &JsonValue,
    intent: &JsonValue,
) -> Result<JsonValue, LoopError> {
    let actor = get_string(intent, "subject")?;
    let destination = get_string(intent, "target")?;
    let time = get_u64(generation, "logicalTime")?;
    let location = current_location(groups, actor, time)?;
    let door = if let Some(found) = door_for_destination(groups, actor, destination, time)? {
        found
    } else {
        group_array(groups, "relation:connects_to")?
            .iter()
            .find(|relation| relation.get("to").and_then(JsonValue::as_str) == Some(destination))
            .and_then(|relation| relation.get("from"))
            .and_then(JsonValue::as_str)
            .unwrap_or("object:door")
            .to_owned()
    };
    let fact_key = format!("fact:{door}:state");
    let fact = current_record(group_array(groups, &fact_key)?, time, |_| true);
    let location_relation = current_record(
        group_array(groups, "relation:located_in")?,
        time,
        |relation| relation.get("from").and_then(JsonValue::as_str) == Some(actor),
    );
    let visible_facts = fact.map_or_else(Vec::new, |record| {
        vec![object(vec![
            (
                "subject",
                record.get("subject").cloned().unwrap_or(JsonValue::Null),
            ),
            (
                "predicate",
                record.get("predicate").cloned().unwrap_or(JsonValue::Null),
            ),
            (
                "value",
                record.get("value").cloned().unwrap_or(JsonValue::Null),
            ),
        ])]
    });
    let visible_relations = location_relation.map_or_else(Vec::new, |record| {
        vec![object(vec![
            (
                "type",
                record.get("type").cloned().unwrap_or(JsonValue::Null),
            ),
            (
                "from",
                record.get("from").cloned().unwrap_or(JsonValue::Null),
            ),
            ("to", record.get("to").cloned().unwrap_or(JsonValue::Null)),
        ])]
    });
    let body = object(vec![
        ("format", string("rfe.observer-view.v0.3")),
        (
            "generationId",
            string(get_string(generation, "generationId")?),
        ),
        ("revision", number(get_u64(generation, "realityRevision")?)),
        ("logicalTime", number(time)),
        ("observerId", string(actor)),
        ("location", location.map_or(JsonValue::Null, string)),
        ("visibleFacts", JsonValue::Array(visible_facts)),
        ("visibleRelations", JsonValue::Array(visible_relations)),
        (
            "availableActions",
            query_affordances(groups, actor, &door, time)?,
        ),
        (
            "goal",
            object(vec![
                ("kind", string(get_string(intent, "kind")?)),
                ("target", string(destination)),
                (
                    "satisfied",
                    bool_value(
                        current_location(groups, actor, time)?.as_deref() == Some(destination),
                    ),
                ),
            ]),
        ),
    ]);
    let mut output = body.clone();
    set_object_field(
        &mut output,
        "viewHash",
        string(sha256_hex(body.canonical_string().as_bytes())),
    )?;
    Ok(output)
}

/// Replays authority-event operations from bootstrap groups and returns the final semantic root.
///
/// # Errors
///
/// Returns [`LoopError`] when an event operation is malformed or unsupported.
#[allow(clippy::too_many_lines)]
pub fn replay_semantic_root(
    bootstrap: &JsonValue,
    events: &JsonValue,
) -> Result<String, LoopError> {
    let mut groups = as_map(get_required(bootstrap, "groups")?)?;
    let mut refs = string_map(get_required(
        get_required(bootstrap, "generation")?,
        "refs",
    )?)?;
    for event in events
        .as_array()
        .ok_or_else(|| error("INVALID_EVENTS", "events must be an array"))?
    {
        let logical_time = get_u64(event, "logicalTime")?;
        for operation in get_required(event, "operations")?
            .as_array()
            .ok_or_else(|| error("INVALID_OPERATIONS", "operations must be an array"))?
        {
            match get_string(operation, "op")? {
                "setFact" => {
                    let fact = get_required(operation, "fact")?;
                    let subject = get_string(fact, "subject")?;
                    let predicate = get_string(fact, "predicate")?;
                    let key = format!("fact:{subject}:{predicate}");
                    let records = groups
                        .get_mut(&key)
                        .and_then(JsonValue::as_array_mut)
                        .ok_or_else(|| error("GROUP_NOT_FOUND", &key))?;
                    ClosedLoopStore::close_current(records, logical_time, |_| true)?;
                    records.push(fact.clone());
                    let group = groups
                        .get(&key)
                        .ok_or_else(|| error("GROUP_NOT_FOUND", &key))?;
                    refs.insert(key.clone(), sha256_hex(group.canonical_string().as_bytes()));
                }
                "removeRelation" => {
                    let matcher = get_required(operation, "match")?;
                    let relation_type = get_string(matcher, "type")?;
                    let from = get_string(matcher, "from")?;
                    let key = format!("relation:{relation_type}");
                    let records = groups
                        .get_mut(&key)
                        .and_then(JsonValue::as_array_mut)
                        .ok_or_else(|| error("GROUP_NOT_FOUND", &key))?;
                    ClosedLoopStore::close_current(records, logical_time, |relation| {
                        relation.get("from").and_then(JsonValue::as_str) == Some(from)
                    })?;
                    let group = groups
                        .get(&key)
                        .ok_or_else(|| error("GROUP_NOT_FOUND", &key))?;
                    refs.insert(key.clone(), sha256_hex(group.canonical_string().as_bytes()));
                }
                "addRelation" => {
                    let relation = get_required(operation, "relation")?;
                    let relation_type = get_string(relation, "type")?;
                    let key = format!("relation:{relation_type}");
                    groups
                        .get_mut(&key)
                        .and_then(JsonValue::as_array_mut)
                        .ok_or_else(|| error("GROUP_NOT_FOUND", &key))?
                        .push(relation.clone());
                    let group = groups
                        .get(&key)
                        .ok_or_else(|| error("GROUP_NOT_FOUND", &key))?;
                    refs.insert(key.clone(), sha256_hex(group.canonical_string().as_bytes()));
                }
                other => return Err(error("UNSUPPORTED_OPERATION", other)),
            }
        }
    }
    Ok(semantic_root(&refs))
}

impl From<std::io::Error> for LoopError {
    fn from(value: std::io::Error) -> Self {
        Self {
            code: "IO",
            message: value.to_string(),
        }
    }
}
