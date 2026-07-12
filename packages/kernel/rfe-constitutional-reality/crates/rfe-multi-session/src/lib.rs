//! Persistent multi-subject shared-reality sessions for RFE v0.4.0.
//!
//! C6 adds deterministic proposal arbitration, logical-resource MVCC conflict
//! detection, subject-specific observer views, durable round checkpoints, and
//! resume-after-checkpoint recovery on top of the v0.3 content-addressed store.

use rfe_canonical::{parse_json, sha256_hex, JsonError, JsonValue};
use rfe_closed_loop::{ClosedLoopStore, CrashPoint, LoopError};
use std::cmp::Ordering;
use std::collections::{BTreeMap, BTreeSet};
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SessionError {
    pub code: &'static str,
    pub message: String,
}

impl Display for SessionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}: {}", self.code, self.message)
    }
}

impl Error for SessionError {}

impl From<JsonError> for SessionError {
    fn from(value: JsonError) -> Self {
        Self {
            code: "INVALID_JSON",
            message: value.to_string(),
        }
    }
}

impl From<LoopError> for SessionError {
    fn from(value: LoopError) -> Self {
        Self {
            code: value.code,
            message: value.message,
        }
    }
}

impl From<std::io::Error> for SessionError {
    fn from(value: std::io::Error) -> Self {
        Self {
            code: "IO",
            message: value.to_string(),
        }
    }
}

fn error(code: &'static str, message: impl Into<String>) -> SessionError {
    SessionError {
        code,
        message: message.into(),
    }
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum SessionCrashPoint {
    #[default]
    None,
    AfterRoundCheckpoint(u64),
}

#[derive(Debug)]
pub struct PersistentMultiSession {
    root: PathBuf,
    store: ClosedLoopStore,
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

fn get_required<'a>(value: &'a JsonValue, key: &str) -> Result<&'a JsonValue, SessionError> {
    value
        .get(key)
        .ok_or_else(|| error("MISSING_FIELD", format!("missing field: {key}")))
}

fn get_string<'a>(value: &'a JsonValue, key: &str) -> Result<&'a str, SessionError> {
    get_required(value, key)?
        .as_str()
        .ok_or_else(|| error("INVALID_FIELD", format!("field {key} must be a string")))
}

fn get_u64(value: &JsonValue, key: &str) -> Result<u64, SessionError> {
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
) -> Result<(), SessionError> {
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

fn utf16_cmp(left: &str, right: &str) -> Ordering {
    left.encode_utf16().cmp(right.encode_utf16())
}

fn sorted_unique(values: impl IntoIterator<Item = String>) -> Vec<String> {
    let mut output = values
        .into_iter()
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect::<Vec<_>>();
    output.sort_by(|left, right| utf16_cmp(left, right));
    output
}

fn string_array(values: impl IntoIterator<Item = String>) -> JsonValue {
    JsonValue::Array(values.into_iter().map(string).collect())
}

fn string_map_json(values: &BTreeMap<String, String>) -> JsonValue {
    object_owned(
        values
            .iter()
            .map(|(key, value)| (key.clone(), string(value.clone())))
            .collect(),
    )
}

fn u64_map_json(values: &BTreeMap<String, u64>) -> JsonValue {
    object_owned(
        values
            .iter()
            .map(|(key, value)| (key.clone(), number(*value)))
            .collect(),
    )
}

fn with_hash(mut body: JsonValue, field: &str) -> Result<JsonValue, SessionError> {
    let digest = sha256_hex(body.canonical_string().as_bytes());
    set_object_field(&mut body, field, string(digest))?;
    Ok(body)
}

fn with_integrity(mut body: JsonValue) -> Result<JsonValue, SessionError> {
    remove_object_field(&mut body, "integrityHash");
    with_hash(body, "integrityHash")
}

fn verify_integrity(value: &JsonValue) -> Result<(), SessionError> {
    let expected = get_string(value, "integrityHash")?.to_owned();
    let mut body = value.clone();
    remove_object_field(&mut body, "integrityHash");
    let actual = sha256_hex(body.canonical_string().as_bytes());
    if actual == expected {
        Ok(())
    } else {
        Err(error(
            "SESSION_STATE_INTEGRITY_MISMATCH",
            format!("expected {expected}, got {actual}"),
        ))
    }
}

fn intent_list(session: &JsonValue) -> Result<&[JsonValue], SessionError> {
    get_required(session, "intents")?
        .as_array()
        .ok_or_else(|| error("INVALID_FIELD", "session.intents must be an array"))
}

fn intent_priority(intent: &JsonValue) -> u64 {
    intent
        .get("priority")
        .and_then(JsonValue::as_u64)
        .unwrap_or(0)
}

fn resource_shape(
    plan: &JsonValue,
    intent: &JsonValue,
) -> Result<(Vec<String>, Vec<String>), SessionError> {
    if get_string(plan, "status")? != "action" {
        return Ok((Vec::new(), Vec::new()));
    }
    let door = get_string(plan, "door")?;
    let subject = get_string(intent, "subject")?;
    let common = vec![
        format!("fact:{door}:state"),
        format!("relation:connects_from:{door}"),
        format!("relation:connects_to:{door}"),
        format!("relation:located_in:{subject}"),
    ];
    match get_string(plan, "action")? {
        "unlock" => Ok((
            sorted_unique(common.into_iter().chain([
                format!("relation:owns:{subject}"),
                format!("relation:unlocks:{door}"),
            ])),
            vec![format!("fact:{door}:state")],
        )),
        "open" => Ok((sorted_unique(common), vec![format!("fact:{door}:state")])),
        "pass" => Ok((
            sorted_unique(common),
            vec![format!("relation:located_in:{subject}")],
        )),
        other => Err(error("UNSUPPORTED_ACTION", other)),
    }
}

fn build_proposal(
    generation: &JsonValue,
    intent: &JsonValue,
    plan: JsonValue,
    versions: &BTreeMap<String, u64>,
) -> Result<JsonValue, SessionError> {
    let intent_id = get_string(intent, "id")?;
    let subject = get_string(intent, "subject")?;
    let base_revision = get_u64(generation, "realityRevision")?;
    let priority = intent_priority(intent);
    let (read_set, write_set) = resource_shape(&plan, intent)?;
    let read_versions = read_set
        .iter()
        .map(|key| (key.clone(), *versions.get(key).unwrap_or(&0)))
        .collect::<BTreeMap<_, _>>();
    let body = object(vec![
        ("format", string("rfe.session-proposal.v0.4")),
        ("intentId", string(intent_id)),
        ("subject", string(subject)),
        ("priority", number(priority)),
        ("baseRevision", number(base_revision)),
        ("plan", plan),
        ("readSet", string_array(read_set)),
        ("writeSet", string_array(write_set)),
        ("readVersions", u64_map_json(&read_versions)),
    ]);
    with_hash(body, "proposalHash")
}

fn strings(value: &JsonValue, key: &str) -> Result<Vec<String>, SessionError> {
    get_required(value, key)?
        .as_array()
        .ok_or_else(|| error("INVALID_FIELD", format!("field {key} must be an array")))?
        .iter()
        .map(|item| {
            item.as_str()
                .map(ToOwned::to_owned)
                .ok_or_else(|| error("INVALID_FIELD", format!("field {key} must contain strings")))
        })
        .collect()
}

fn proposal_cmp(left: &JsonValue, right: &JsonValue) -> Ordering {
    let left_priority = left
        .get("priority")
        .and_then(JsonValue::as_u64)
        .unwrap_or(0);
    let right_priority = right
        .get("priority")
        .and_then(JsonValue::as_u64)
        .unwrap_or(0);
    right_priority
        .cmp(&left_priority)
        .then_with(|| {
            utf16_cmp(
                left.get("subject")
                    .and_then(JsonValue::as_str)
                    .unwrap_or(""),
                right
                    .get("subject")
                    .and_then(JsonValue::as_str)
                    .unwrap_or(""),
            )
        })
        .then_with(|| {
            utf16_cmp(
                left.get("intentId")
                    .and_then(JsonValue::as_str)
                    .unwrap_or(""),
                right
                    .get("intentId")
                    .and_then(JsonValue::as_str)
                    .unwrap_or(""),
            )
        })
}

fn intersection(left: &[String], right: &[String]) -> Vec<String> {
    let right_set = right.iter().collect::<BTreeSet<_>>();
    left.iter()
        .filter(|value| right_set.contains(value))
        .cloned()
        .collect()
}

fn decision(
    proposal: &JsonValue,
    status: &str,
    reasons: Vec<String>,
    conflict_with: Option<&str>,
    resources: Vec<String>,
) -> Result<JsonValue, SessionError> {
    Ok(object(vec![
        ("intentId", string(get_string(proposal, "intentId")?)),
        ("subject", string(get_string(proposal, "subject")?)),
        ("status", string(status)),
        ("reasonCodes", string_array(reasons)),
        (
            "conflictsWith",
            conflict_with.map_or(JsonValue::Null, string),
        ),
        ("conflictResources", string_array(resources)),
    ]))
}

fn arbitrate(proposals: &[JsonValue]) -> Result<(Vec<JsonValue>, Vec<JsonValue>), SessionError> {
    let mut ordered = proposals.to_vec();
    ordered.sort_by(proposal_cmp);
    let mut accepted: Vec<JsonValue> = Vec::new();
    let mut decisions = Vec::new();
    for proposal in ordered {
        if get_string(get_required(&proposal, "plan")?, "status")? != "action" {
            let reasons = strings(get_required(&proposal, "plan")?, "reasonCodes")?;
            decisions.push(decision(
                &proposal,
                get_string(get_required(&proposal, "plan")?, "status")?,
                reasons,
                None,
                Vec::new(),
            )?);
            continue;
        }
        let reads = strings(&proposal, "readSet")?;
        let writes = strings(&proposal, "writeSet")?;
        let mut conflict: Option<(&JsonValue, Vec<String>)> = None;
        for winner in &accepted {
            let winner_reads = strings(winner, "readSet")?;
            let winner_writes = strings(winner, "writeSet")?;
            let resources = sorted_unique(
                intersection(&reads, &winner_writes)
                    .into_iter()
                    .chain(intersection(&writes, &winner_reads))
                    .chain(intersection(&writes, &winner_writes)),
            );
            if !resources.is_empty() {
                conflict = Some((winner, resources));
                break;
            }
        }
        if let Some((winner, resources)) = conflict {
            decisions.push(decision(
                &proposal,
                "conflict_rejected",
                vec!["mvcc_conflict".to_owned()],
                Some(get_string(winner, "intentId")?),
                resources,
            )?);
        } else {
            decisions.push(decision(
                &proposal,
                "accepted",
                Vec::new(),
                None,
                Vec::new(),
            )?);
            accepted.push(proposal);
        }
    }
    Ok((accepted, decisions))
}

fn views_for_intents(
    store: &mut ClosedLoopStore,
    branch_id: &str,
    intents: &[JsonValue],
) -> Result<BTreeMap<String, JsonValue>, SessionError> {
    intents
        .iter()
        .map(|intent| {
            let intent_id = get_string(intent, "id")?.to_owned();
            let view = store.observe(branch_id, intent)?;
            Ok((intent_id, view))
        })
        .collect()
}

fn status_from_views(
    intents: &[JsonValue],
    views: &BTreeMap<String, JsonValue>,
) -> Result<BTreeMap<String, String>, SessionError> {
    intents
        .iter()
        .map(|intent| {
            let intent_id = get_string(intent, "id")?.to_owned();
            let view = views
                .get(&intent_id)
                .ok_or_else(|| error("VIEW_NOT_FOUND", intent_id.clone()))?;
            let satisfied = match get_required(get_required(view, "goal")?, "satisfied")? {
                JsonValue::Bool(value) => *value,
                _ => false,
            };
            Ok((
                intent_id,
                if satisfied { "satisfied" } else { "active" }.to_owned(),
            ))
        })
        .collect()
}

fn views_json(views: &BTreeMap<String, JsonValue>) -> JsonValue {
    object_owned(
        views
            .iter()
            .map(|(key, value)| (key.clone(), value.clone()))
            .collect(),
    )
}

fn checkpoint_document(
    session: &JsonValue,
    round: u64,
    generation: &JsonValue,
    statuses: &BTreeMap<String, String>,
    versions: &BTreeMap<String, u64>,
    rounds: &[JsonValue],
    completed: bool,
) -> Result<JsonValue, SessionError> {
    let round_hashes = rounds
        .iter()
        .map(|item| get_string(item, "roundHash").map(ToOwned::to_owned))
        .collect::<Result<Vec<_>, _>>()?;
    let body = object(vec![
        (
            "format",
            string("rfe.multi-subject-session-checkpoint.v0.4"),
        ),
        ("sessionId", string(get_string(session, "id")?)),
        ("branchId", string(get_string(session, "branchId")?)),
        ("round", number(round)),
        (
            "generationId",
            string(get_string(generation, "generationId")?),
        ),
        (
            "realityRevision",
            number(get_u64(generation, "realityRevision")?),
        ),
        ("completed", bool_value(completed)),
        ("statusByIntent", string_map_json(statuses)),
        ("resourceVersions", u64_map_json(versions)),
        ("roundHashes", string_array(round_hashes)),
    ]);
    with_hash(body, "checkpointHash")
}

fn observer_isolation(
    intents: &[JsonValue],
    views: &BTreeMap<String, JsonValue>,
) -> Result<JsonValue, SessionError> {
    let mut leaks = 0_u64;
    let mut hashes = BTreeMap::new();
    for intent in intents {
        let intent_id = get_string(intent, "id")?;
        let subject = get_string(intent, "subject")?;
        let view = views
            .get(intent_id)
            .ok_or_else(|| error("VIEW_NOT_FOUND", intent_id))?;
        let relations = get_required(view, "visibleRelations")?
            .as_array()
            .ok_or_else(|| error("INVALID_VIEW", "visibleRelations must be an array"))?;
        for relation in relations {
            if relation.get("from").and_then(JsonValue::as_str) != Some(subject) {
                leaks += 1;
            }
        }
        hashes.insert(subject.to_owned(), get_string(view, "viewHash")?.to_owned());
    }
    Ok(object(vec![
        ("isolated", bool_value(leaks == 0)),
        ("crossSubjectRelationLeaks", number(leaks)),
        ("observerViewHashes", string_map_json(&hashes)),
    ]))
}

fn state_path(root: &Path, session_id: &str) -> PathBuf {
    root.join("sessions")
        .join(format!("{}.json", sha256_hex(session_id.as_bytes())))
}

fn state_field<'a>(state: &'a JsonValue, key: &str) -> Result<&'a JsonValue, SessionError> {
    get_required(state, key)
}

fn parse_string_map(value: &JsonValue) -> Result<BTreeMap<String, String>, SessionError> {
    value
        .as_object()
        .ok_or_else(|| error("INVALID_OBJECT", "expected string map"))?
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

fn parse_u64_map(value: &JsonValue) -> Result<BTreeMap<String, u64>, SessionError> {
    value
        .as_object()
        .ok_or_else(|| error("INVALID_OBJECT", "expected integer map"))?
        .iter()
        .map(|(key, item)| {
            item.as_u64()
                .map(|number| (key.clone(), number))
                .ok_or_else(|| {
                    error(
                        "INVALID_FIELD",
                        format!("map value for {key} must be an integer"),
                    )
                })
        })
        .collect()
}

impl PersistentMultiSession {
    /// Bootstraps the shared content-addressed store and writes a durable session state.
    ///
    /// # Errors
    ///
    /// Returns [`SessionError`] when the bootstrap, session, initial views, or
    /// durable state cannot be created.
    pub fn bootstrap(
        root: impl AsRef<Path>,
        bootstrap: &JsonValue,
        session: &JsonValue,
    ) -> Result<Self, SessionError> {
        let root = root.as_ref().to_path_buf();
        let mut store = ClosedLoopStore::bootstrap(&root, bootstrap)?;
        fs::create_dir_all(root.join("sessions"))?;
        let branch_id = get_string(session, "branchId")?;
        let intents = intent_list(session)?;
        let generation = store.current_generation(branch_id)?;
        let initial_views = views_for_intents(&mut store, branch_id, intents)?;
        let statuses = status_from_views(intents, &initial_views)?;
        let checkpoint = checkpoint_document(
            session,
            0,
            &generation,
            &statuses,
            &BTreeMap::new(),
            &[],
            false,
        )?;
        let state = with_integrity(object(vec![
            ("format", string("rfe.multi-subject-session-state.v0.4")),
            ("session", session.clone()),
            (
                "initialGenerationId",
                string(get_string(&generation, "generationId")?),
            ),
            ("initialViews", views_json(&initial_views)),
            ("rounds", JsonValue::Array(Vec::new())),
            ("events", JsonValue::Array(Vec::new())),
            (
                "generationIds",
                JsonValue::Array(vec![string(get_string(&generation, "generationId")?)]),
            ),
            ("statusByIntent", string_map_json(&statuses)),
            ("resourceVersions", JsonValue::Object(Vec::new())),
            ("checkpoint", checkpoint),
            ("completed", bool_value(false)),
        ]))?;
        let mut output = Self { root, store };
        output.write_state(&state)?;
        Ok(output)
    }

    /// Opens an existing persistent shared-reality session store.
    ///
    /// # Errors
    ///
    /// Returns [`SessionError`] when the underlying closed-loop store is missing.
    pub fn open(root: impl AsRef<Path>) -> Result<Self, SessionError> {
        let root = root.as_ref().to_path_buf();
        let store = ClosedLoopStore::open(&root)?;
        if !root.join("sessions").is_dir() {
            return Err(error(
                "SESSION_STORE_NOT_FOUND",
                "missing sessions directory",
            ));
        }
        Ok(Self { root, store })
    }

    fn write_state(&mut self, state: &JsonValue) -> Result<(), SessionError> {
        verify_integrity(state)?;
        let session_id = get_string(get_required(state, "session")?, "id")?;
        let path = state_path(&self.root, session_id);
        let temporary = path.with_extension(format!("{}.tmp", std::process::id()));
        fs::write(&temporary, state.canonical_string())?;
        match fs::rename(&temporary, &path) {
            Ok(()) => Ok(()),
            Err(failure) if failure.kind() == std::io::ErrorKind::AlreadyExists => {
                fs::remove_file(&path)?;
                fs::rename(&temporary, &path)?;
                Ok(())
            }
            Err(failure) => Err(error("SESSION_STATE_SWAP_FAILED", failure.to_string())),
        }
    }

    fn read_state(&self, session_id: &str) -> Result<JsonValue, SessionError> {
        let path = state_path(&self.root, session_id);
        let state = parse_json(&fs::read_to_string(&path)?)?;
        verify_integrity(&state)?;
        if get_string(get_required(&state, "session")?, "id")? != session_id {
            return Err(error("SESSION_ID_MISMATCH", session_id));
        }
        Ok(state)
    }

    /// Returns the durable public checkpoint for a session.
    ///
    /// # Errors
    ///
    /// Returns [`SessionError`] when the session state is missing or invalid.
    pub fn checkpoint(&self, session_id: &str) -> Result<JsonValue, SessionError> {
        Ok(get_required(&self.read_state(session_id)?, "checkpoint")?.clone())
    }

    /// Runs or resumes a deterministic multi-subject session.
    ///
    /// # Errors
    ///
    /// Returns [`SessionError`] when proposal construction, arbitration, authority
    /// commit, observer projection, checkpoint persistence, or convergence fails.
    #[allow(clippy::too_many_lines)]
    pub fn run_session(
        &mut self,
        session: &JsonValue,
        crash: SessionCrashPoint,
    ) -> Result<JsonValue, SessionError> {
        let session_id = get_string(session, "id")?;
        let branch_id = get_string(session, "branchId")?;
        let max_rounds = get_u64(session, "maxRounds")?;
        let intents = intent_list(session)?;
        let intent_by_id = intents
            .iter()
            .map(|intent| Ok((get_string(intent, "id")?.to_owned(), intent)))
            .collect::<Result<BTreeMap<_, _>, SessionError>>()?;
        let mut state = self.read_state(session_id)?;
        if get_required(&state, "session")?.canonical_string() != session.canonical_string() {
            return Err(error("SESSION_SPEC_MISMATCH", session_id));
        }
        let mut rounds = state_field(&state, "rounds")?
            .as_array()
            .ok_or_else(|| error("INVALID_STATE", "rounds must be an array"))?
            .to_vec();
        let mut events = state_field(&state, "events")?
            .as_array()
            .ok_or_else(|| error("INVALID_STATE", "events must be an array"))?
            .to_vec();
        let mut generation_ids = state_field(&state, "generationIds")?
            .as_array()
            .ok_or_else(|| error("INVALID_STATE", "generationIds must be an array"))?
            .to_vec();
        let mut statuses = parse_string_map(state_field(&state, "statusByIntent")?)?;
        let mut versions = parse_u64_map(state_field(&state, "resourceVersions")?)?;
        let initial_views = state_field(&state, "initialViews")?.clone();
        let start_round = u64::try_from(rounds.len())
            .map_err(|failure| error("INTEGER_OVERFLOW", failure.to_string()))?
            + 1;

        for round_number in start_round..=max_rounds {
            if statuses.values().all(|value| value == "satisfied") {
                break;
            }
            let generation = self.store.current_generation(branch_id)?;
            let snapshot_generation_id = get_string(&generation, "generationId")?.to_owned();
            let snapshot_revision = get_u64(&generation, "realityRevision")?;
            let active = intents
                .iter()
                .filter(|intent| {
                    get_string(intent, "id")
                        .ok()
                        .and_then(|intent_id| statuses.get(intent_id))
                        .is_none_or(|status| status != "satisfied")
                })
                .collect::<Vec<_>>();
            let mut proposals = Vec::new();
            for intent in active {
                let plan = self.store.resolve_next_action(branch_id, intent)?;
                proposals.push(build_proposal(&generation, intent, plan, &versions)?);
            }
            let (accepted, decisions) = arbitrate(&proposals)?;
            let mut commits = Vec::new();
            for proposal in accepted {
                let intent_id = get_string(&proposal, "intentId")?;
                let intent = intent_by_id
                    .get(intent_id)
                    .ok_or_else(|| error("INTENT_NOT_FOUND", intent_id))?;
                let plan = get_required(&proposal, "plan")?;
                let committed =
                    self.store
                        .commit_action(branch_id, intent, plan, CrashPoint::None)?;
                let revision = get_u64(&committed.generation, "realityRevision")?;
                for resource in strings(&proposal, "writeSet")? {
                    versions.insert(resource, revision);
                }
                generation_ids.push(string(get_string(&committed.generation, "generationId")?));
                events.push(committed.event.clone());
                commits.push(object(vec![
                    ("intentId", string(intent_id)),
                    ("subject", string(get_string(&proposal, "subject")?)),
                    ("action", string(get_string(plan, "action")?)),
                    (
                        "eventHash",
                        string(get_string(&committed.event, "eventHash")?),
                    ),
                    (
                        "generationId",
                        string(get_string(&committed.generation, "generationId")?),
                    ),
                    ("revision", number(revision)),
                    ("writeSet", get_required(&proposal, "writeSet")?.clone()),
                ]));
            }
            let resulting_generation = self.store.current_generation(branch_id)?;
            let views = views_for_intents(&mut self.store, branch_id, intents)?;
            statuses = status_from_views(intents, &views)?;
            let view_hashes = intents
                .iter()
                .map(|intent| {
                    let intent_id = get_string(intent, "id")?.to_owned();
                    let view = views
                        .get(&intent_id)
                        .ok_or_else(|| error("VIEW_NOT_FOUND", intent_id.clone()))?;
                    Ok((intent_id, string(get_string(view, "viewHash")?)))
                })
                .collect::<Result<Vec<_>, SessionError>>()?;
            let round_body = object(vec![
                ("format", string("rfe.multi-subject-round.v0.4")),
                ("round", number(round_number)),
                ("snapshotGenerationId", string(snapshot_generation_id)),
                ("snapshotRevision", number(snapshot_revision)),
                ("proposals", JsonValue::Array(proposals)),
                ("decisions", JsonValue::Array(decisions)),
                ("commits", JsonValue::Array(commits)),
                (
                    "resultingGenerationId",
                    string(get_string(&resulting_generation, "generationId")?),
                ),
                (
                    "resultingRevision",
                    number(get_u64(&resulting_generation, "realityRevision")?),
                ),
                ("statusByIntent", string_map_json(&statuses)),
                ("observerViewHashes", object_owned(view_hashes)),
            ]);
            rounds.push(with_hash(round_body, "roundHash")?);
            let completed = statuses.values().all(|value| value == "satisfied");
            let checkpoint = checkpoint_document(
                session,
                round_number,
                &resulting_generation,
                &statuses,
                &versions,
                &rounds,
                completed,
            )?;
            state = with_integrity(object(vec![
                ("format", string("rfe.multi-subject-session-state.v0.4")),
                ("session", session.clone()),
                (
                    "initialGenerationId",
                    state_field(&state, "initialGenerationId")?.clone(),
                ),
                ("initialViews", initial_views.clone()),
                ("rounds", JsonValue::Array(rounds.clone())),
                ("events", JsonValue::Array(events.clone())),
                ("generationIds", JsonValue::Array(generation_ids.clone())),
                ("statusByIntent", string_map_json(&statuses)),
                ("resourceVersions", u64_map_json(&versions)),
                ("checkpoint", checkpoint),
                ("completed", bool_value(completed)),
            ]))?;
            self.write_state(&state)?;
            if crash == SessionCrashPoint::AfterRoundCheckpoint(round_number) {
                return Err(error(
                    "SESSION_CRASH_INJECTED_AFTER_CHECKPOINT",
                    round_number.to_string(),
                ));
            }
            if completed {
                break;
            }
        }

        if !statuses.values().all(|value| value == "satisfied") {
            return Err(error("SESSION_DID_NOT_CONVERGE", session_id));
        }
        let final_generation = self.store.current_generation(branch_id)?;
        let final_views = views_for_intents(&mut self.store, branch_id, intents)?;
        let checkpoint = state_field(&state, "checkpoint")?.clone();
        let isolation = observer_isolation(intents, &final_views)?;
        let conflict_rejections = rounds
            .iter()
            .flat_map(|round| {
                round
                    .get("decisions")
                    .and_then(JsonValue::as_array)
                    .unwrap_or(&[])
            })
            .filter(|item| {
                item.get("status").and_then(JsonValue::as_str) == Some("conflict_rejected")
            })
            .count();
        let proposal_count = rounds
            .iter()
            .map(|round| {
                round
                    .get("proposals")
                    .and_then(JsonValue::as_array)
                    .map_or(0, <[JsonValue]>::len)
            })
            .sum::<usize>();
        let max_concurrent = rounds
            .iter()
            .map(|round| {
                round
                    .get("commits")
                    .and_then(JsonValue::as_array)
                    .map_or(0, <[JsonValue]>::len)
            })
            .max()
            .unwrap_or(0);
        let shared_sequence = events
            .iter()
            .map(|event| get_u64(event, "sequence"))
            .collect::<Result<Vec<_>, _>>()?;
        let body =
            object(vec![
                ("format", string("rfe.multi-subject-session-result.v0.4")),
                ("session", session.clone()),
                (
                    "initialGenerationId",
                    state_field(&state, "initialGenerationId")?.clone(),
                ),
                ("initialViews", initial_views),
                ("rounds", JsonValue::Array(rounds.clone())),
                ("events", JsonValue::Array(events.clone())),
                ("generationIds", JsonValue::Array(generation_ids)),
                ("finalGeneration", final_generation),
                ("finalViews", views_json(&final_views)),
                ("checkpoint", checkpoint),
                ("observerIsolation", isolation),
                (
                    "metrics",
                    object(vec![
                        (
                            "rounds",
                            number(u64::try_from(rounds.len()).map_err(|failure| {
                                error("INTEGER_OVERFLOW", failure.to_string())
                            })?),
                        ),
                        (
                            "proposals",
                            number(u64::try_from(proposal_count).map_err(|failure| {
                                error("INTEGER_OVERFLOW", failure.to_string())
                            })?),
                        ),
                        (
                            "acceptedCommits",
                            number(u64::try_from(events.len()).map_err(|failure| {
                                error("INTEGER_OVERFLOW", failure.to_string())
                            })?),
                        ),
                        (
                            "conflictRejections",
                            number(u64::try_from(conflict_rejections).map_err(|failure| {
                                error("INTEGER_OVERFLOW", failure.to_string())
                            })?),
                        ),
                        (
                            "maxConcurrentAccepted",
                            number(u64::try_from(max_concurrent).map_err(|failure| {
                                error("INTEGER_OVERFLOW", failure.to_string())
                            })?),
                        ),
                        ("fullWorldMaterializations", number(0)),
                        (
                            "sharedEventSequence",
                            JsonValue::Array(shared_sequence.into_iter().map(number).collect()),
                        ),
                    ]),
                ),
            ]);
        with_hash(body, "sessionResultHash")
    }
}
