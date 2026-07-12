//! Replicated reality authority for RFE v0.5.0.
//!
//! C7 models a crash-fault-tolerant, deterministic single-leader authority
//! replicated across isolated runtime roots. It provides hash-chained authority
//! entries, majority commit, verified failover, stale-term rejection, and full
//! snapshot catch-up for lagging followers. It does not claim Byzantine fault
//! tolerance.

use rfe_canonical::{parse_json, sha256_hex, JsonError, JsonValue};
use rfe_closed_loop::{ClosedLoopStore, LoopError};
use rfe_multi_session::{PersistentMultiSession, SessionCrashPoint, SessionError};
use std::collections::BTreeSet;
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ReplicationError {
    pub code: &'static str,
    pub message: String,
}

impl Display for ReplicationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}: {}", self.code, self.message)
    }
}

impl Error for ReplicationError {}

impl From<std::io::Error> for ReplicationError {
    fn from(value: std::io::Error) -> Self {
        Self {
            code: "IO",
            message: value.to_string(),
        }
    }
}

impl From<JsonError> for ReplicationError {
    fn from(value: JsonError) -> Self {
        Self {
            code: "INVALID_JSON",
            message: value.to_string(),
        }
    }
}

impl From<LoopError> for ReplicationError {
    fn from(value: LoopError) -> Self {
        Self {
            code: value.code,
            message: value.message,
        }
    }
}

impl From<SessionError> for ReplicationError {
    fn from(value: SessionError) -> Self {
        Self {
            code: value.code,
            message: value.message,
        }
    }
}

fn error(code: &'static str, message: impl Into<String>) -> ReplicationError {
    ReplicationError {
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

fn get_required<'a>(value: &'a JsonValue, key: &str) -> Result<&'a JsonValue, ReplicationError> {
    value
        .get(key)
        .ok_or_else(|| error("MISSING_FIELD", format!("missing field: {key}")))
}

fn get_string<'a>(value: &'a JsonValue, key: &str) -> Result<&'a str, ReplicationError> {
    get_required(value, key)?
        .as_str()
        .ok_or_else(|| error("INVALID_FIELD", format!("field {key} must be a string")))
}

fn get_u64(value: &JsonValue, key: &str) -> Result<u64, ReplicationError> {
    get_required(value, key)?.as_u64().ok_or_else(|| {
        error(
            "INVALID_FIELD",
            format!("field {key} must be an unsigned integer"),
        )
    })
}

fn get_bool(value: &JsonValue, key: &str) -> Result<bool, ReplicationError> {
    match get_required(value, key)? {
        JsonValue::Bool(value) => Ok(*value),
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
) -> Result<(), ReplicationError> {
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

fn with_hash(mut value: JsonValue, field: &str) -> Result<JsonValue, ReplicationError> {
    remove_object_field(&mut value, field);
    let digest = sha256_hex(value.canonical_string().as_bytes());
    set_object_field(&mut value, field, string(digest))?;
    Ok(value)
}

fn with_integrity(value: JsonValue) -> Result<JsonValue, ReplicationError> {
    with_hash(value, "integrityHash")
}

fn verify_hash(value: &JsonValue, field: &str, code: &'static str) -> Result<(), ReplicationError> {
    let expected = get_string(value, field)?.to_owned();
    let mut body = value.clone();
    remove_object_field(&mut body, field);
    let actual = sha256_hex(body.canonical_string().as_bytes());
    if actual == expected {
        Ok(())
    } else {
        Err(error(code, format!("expected {expected}, got {actual}")))
    }
}

fn strings(value: &JsonValue, key: &str) -> Result<Vec<String>, ReplicationError> {
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

fn string_array(values: impl IntoIterator<Item = String>) -> JsonValue {
    JsonValue::Array(values.into_iter().map(string).collect())
}

fn replica_key(replica_id: &str) -> String {
    sha256_hex(replica_id.as_bytes())
}

fn atomic_write(path: &Path, value: &JsonValue) -> Result<(), ReplicationError> {
    let temporary = path.with_extension(format!("{}.tmp", std::process::id()));
    fs::write(&temporary, value.canonical_string())?;
    if path.exists() {
        fs::remove_file(path)?;
    }
    fs::rename(temporary, path)?;
    Ok(())
}

fn read_json(path: &Path) -> Result<JsonValue, ReplicationError> {
    Ok(parse_json(&fs::read_to_string(path)?)?)
}

fn copy_tree(source: &Path, target: &Path) -> Result<(), ReplicationError> {
    if target.exists() {
        fs::remove_dir_all(target)?;
    }
    fs::create_dir_all(target)?;
    let mut stack = vec![source.to_path_buf()];
    while let Some(directory) = stack.pop() {
        let relative = directory
            .strip_prefix(source)
            .map_err(|failure| error("PATH", failure.to_string()))?;
        let target_directory = target.join(relative);
        fs::create_dir_all(&target_directory)?;
        for entry in fs::read_dir(&directory)? {
            let entry = entry?;
            let path = entry.path();
            let file_type = entry.file_type()?;
            if file_type.is_dir() {
                stack.push(path);
            } else if file_type.is_file() {
                let relative_file = path
                    .strip_prefix(source)
                    .map_err(|failure| error("PATH", failure.to_string()))?;
                let destination = target.join(relative_file);
                if let Some(parent) = destination.parent() {
                    fs::create_dir_all(parent)?;
                }
                fs::copy(path, destination)?;
            } else {
                return Err(error(
                    "UNSUPPORTED_FILE_TYPE",
                    entry.path().display().to_string(),
                ));
            }
        }
    }
    Ok(())
}

fn tree_hash(root: &Path) -> Result<String, ReplicationError> {
    let mut files = Vec::new();
    let mut stack = vec![root.to_path_buf()];
    while let Some(directory) = stack.pop() {
        for entry in fs::read_dir(&directory)? {
            let entry = entry?;
            let path = entry.path();
            let file_type = entry.file_type()?;
            if file_type.is_dir() {
                stack.push(path);
            } else if file_type.is_file() {
                let relative = path
                    .strip_prefix(root)
                    .map_err(|failure| error("PATH", failure.to_string()))?
                    .to_string_lossy()
                    .replace('\\', "/");
                let bytes = fs::read(&path)?;
                files.push((relative, sha256_hex(&bytes), bytes.len()));
            }
        }
    }
    files.sort_by(|left, right| left.0.cmp(&right.0));
    let manifest = JsonValue::Array(
        files
            .into_iter()
            .map(|(path, hash, size)| {
                object(vec![
                    ("path", string(path)),
                    ("sha256", string(hash)),
                    ("size", number(u64::try_from(size).unwrap_or(u64::MAX))),
                ])
            })
            .collect(),
    );
    Ok(sha256_hex(manifest.canonical_string().as_bytes()))
}

#[derive(Clone, Debug)]
struct AuthorityHead {
    round: u64,
    round_hash: String,
    generation_id: String,
    reality_revision: u64,
    semantic_root: String,
    checkpoint_hash: String,
    event_hashes: Vec<String>,
    event_head: Option<String>,
    event_sequence: u64,
    generation_ids: Vec<String>,
    state_integrity_hash: String,
    snapshot_hash: String,
}

#[derive(Debug)]
pub struct ReplicatedAuthorityCluster {
    root: PathBuf,
    bootstrap: JsonValue,
    session: JsonValue,
    members: Vec<String>,
    quorum: usize,
}

impl ReplicatedAuthorityCluster {
    /// Creates three or more isolated replica roots with one deterministic leader.
    ///
    /// # Errors
    ///
    /// Returns [`ReplicationError`] when membership is invalid or any replica
    /// cannot bootstrap the same initial authority state.
    pub fn bootstrap(
        root: impl AsRef<Path>,
        bootstrap: &JsonValue,
        session: &JsonValue,
        cluster: &JsonValue,
    ) -> Result<Self, ReplicationError> {
        let root = root.as_ref().to_path_buf();
        if root.exists() {
            fs::remove_dir_all(&root)?;
        }
        fs::create_dir_all(root.join("replicas"))?;
        let members = strings(cluster, "replicas")?;
        let unique = members.iter().collect::<BTreeSet<_>>();
        if members.len() < 3 || unique.len() != members.len() {
            return Err(error(
                "INVALID_MEMBERSHIP",
                "C7 requires at least three unique replicas",
            ));
        }
        let quorum = usize::try_from(get_u64(cluster, "quorum")?)
            .map_err(|failure| error("INTEGER_OVERFLOW", failure.to_string()))?;
        if quorum <= members.len() / 2 || quorum > members.len() {
            return Err(error("INVALID_QUORUM", quorum.to_string()));
        }
        let leader = get_string(cluster, "initialLeader")?;
        if !members.iter().any(|member| member == leader) {
            return Err(error("LEADER_NOT_MEMBER", leader));
        }
        let output = Self {
            root,
            bootstrap: bootstrap.clone(),
            session: session.clone(),
            members,
            quorum,
        };
        for member in &output.members {
            output.bootstrap_replica(member, member == leader)?;
        }
        let cluster_state = with_integrity(object(vec![
            ("format", string("rfe.replica-cluster-state.v0.5")),
            ("term", number(1)),
            ("leaderId", string(leader)),
            ("commitIndex", number(0)),
            ("logHead", JsonValue::Null),
            ("members", string_array(output.members.clone())),
            (
                "onlineByReplica",
                object_owned(
                    output
                        .members
                        .iter()
                        .map(|member| (member.clone(), bool_value(true)))
                        .collect(),
                ),
            ),
        ]))?;
        atomic_write(&output.root.join("cluster.json"), &cluster_state)?;
        output.verify_initial_equivalence()?;
        Ok(output)
    }

    fn replica_dir(&self, replica_id: &str) -> PathBuf {
        self.root.join("replicas").join(replica_key(replica_id))
    }

    fn runtime_dir(&self, replica_id: &str) -> PathBuf {
        self.replica_dir(replica_id).join("runtime")
    }

    fn replica_state_path(&self, replica_id: &str) -> PathBuf {
        self.replica_dir(replica_id).join("replica-state.json")
    }

    fn replica_log_path(&self, replica_id: &str) -> PathBuf {
        self.replica_dir(replica_id).join("authority-log.json")
    }

    fn bootstrap_replica(&self, replica_id: &str, leader: bool) -> Result<(), ReplicationError> {
        let directory = self.replica_dir(replica_id);
        fs::create_dir_all(&directory)?;
        let runtime = self.runtime_dir(replica_id);
        let session_runtime =
            PersistentMultiSession::bootstrap(&runtime, &self.bootstrap, &self.session)?;
        let checkpoint = session_runtime.checkpoint(get_string(&self.session, "id")?)?;
        let mut store = ClosedLoopStore::open(&runtime)?;
        let generation = store.current_generation(get_string(&self.session, "branchId")?)?;
        let state = with_integrity(object(vec![
            ("format", string("rfe.replica-state.v0.5")),
            ("replicaId", string(replica_id)),
            ("role", string(if leader { "leader" } else { "follower" })),
            ("term", number(1)),
            ("online", bool_value(true)),
            ("appliedIndex", number(0)),
            ("logHead", JsonValue::Null),
            (
                "generationId",
                string(get_string(&generation, "generationId")?),
            ),
            (
                "semanticRoot",
                string(get_string(&generation, "semanticRoot")?),
            ),
            (
                "checkpointHash",
                string(get_string(&checkpoint, "checkpointHash")?),
            ),
            ("round", number(0)),
        ]))?;
        atomic_write(&self.replica_state_path(replica_id), &state)?;
        atomic_write(
            &self.replica_log_path(replica_id),
            &object(vec![
                ("format", string("rfe.replication-log.v0.5")),
                ("replicaId", string(replica_id)),
                ("entries", JsonValue::Array(Vec::new())),
            ]),
        )?;
        Ok(())
    }

    fn verify_initial_equivalence(&self) -> Result<(), ReplicationError> {
        let mut identities = BTreeSet::new();
        for member in &self.members {
            let state = self.read_replica_state(member)?;
            identities.insert(format!(
                "{}:{}:{}",
                get_string(&state, "generationId")?,
                get_string(&state, "semanticRoot")?,
                get_string(&state, "checkpointHash")?
            ));
        }
        if identities.len() == 1 {
            Ok(())
        } else {
            Err(error(
                "INITIAL_REPLICA_DIVERGENCE",
                format!("{} identities", identities.len()),
            ))
        }
    }

    fn read_cluster_state(&self) -> Result<JsonValue, ReplicationError> {
        let state = read_json(&self.root.join("cluster.json"))?;
        verify_hash(&state, "integrityHash", "CLUSTER_STATE_INTEGRITY_MISMATCH")?;
        Ok(state)
    }

    fn write_cluster_state(&self, state: JsonValue) -> Result<(), ReplicationError> {
        atomic_write(&self.root.join("cluster.json"), &with_integrity(state)?)
    }

    fn read_replica_state(&self, replica_id: &str) -> Result<JsonValue, ReplicationError> {
        let state = read_json(&self.replica_state_path(replica_id))?;
        verify_hash(&state, "integrityHash", "REPLICA_STATE_INTEGRITY_MISMATCH")?;
        if get_string(&state, "replicaId")? != replica_id {
            return Err(error("REPLICA_ID_MISMATCH", replica_id));
        }
        Ok(state)
    }

    fn write_replica_state(
        &self,
        replica_id: &str,
        state: JsonValue,
    ) -> Result<(), ReplicationError> {
        atomic_write(
            &self.replica_state_path(replica_id),
            &with_integrity(state)?,
        )
    }

    fn read_log(&self, replica_id: &str) -> Result<JsonValue, ReplicationError> {
        let log = read_json(&self.replica_log_path(replica_id))?;
        if get_string(&log, "replicaId")? != replica_id {
            return Err(error("REPLICA_LOG_ID_MISMATCH", replica_id));
        }
        Self::verify_log(&log)?;
        Ok(log)
    }

    fn write_log(&self, replica_id: &str, entries: Vec<JsonValue>) -> Result<(), ReplicationError> {
        atomic_write(
            &self.replica_log_path(replica_id),
            &object(vec![
                ("format", string("rfe.replication-log.v0.5")),
                ("replicaId", string(replica_id)),
                ("entries", JsonValue::Array(entries)),
            ]),
        )
    }

    fn verify_log(log: &JsonValue) -> Result<(), ReplicationError> {
        let entries = get_required(log, "entries")?
            .as_array()
            .ok_or_else(|| error("INVALID_LOG", "entries must be an array"))?;
        let mut previous: Option<String> = None;
        for (offset, entry) in entries.iter().enumerate() {
            verify_hash(entry, "entryHash", "REPLICATION_ENTRY_HASH_MISMATCH")?;
            let expected_index = u64::try_from(offset + 1)
                .map_err(|failure| error("INTEGER_OVERFLOW", failure.to_string()))?;
            if get_u64(entry, "index")? != expected_index {
                return Err(error("NON_MONOTONIC_LOG_INDEX", expected_index.to_string()));
            }
            match (
                previous.as_deref(),
                get_required(entry, "previousEntryHash")?,
            ) {
                (None, JsonValue::Null) => {}
                (Some(expected), JsonValue::String(actual)) if expected == actual => {}
                _ => {
                    return Err(error(
                        "BROKEN_REPLICATION_CHAIN",
                        expected_index.to_string(),
                    ))
                }
            }
            previous = Some(get_string(entry, "entryHash")?.to_owned());
        }
        Ok(())
    }

    fn session_state(&self, replica_id: &str) -> Result<JsonValue, ReplicationError> {
        let directory = self.runtime_dir(replica_id).join("sessions");
        let mut paths = fs::read_dir(directory)?
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .filter(|path| path.extension().and_then(|value| value.to_str()) == Some("json"))
            .collect::<Vec<_>>();
        paths.sort();
        if paths.len() != 1 {
            return Err(error("SESSION_STATE_COUNT", paths.len().to_string()));
        }
        let state = read_json(&paths[0])?;
        verify_hash(&state, "integrityHash", "SESSION_STATE_INTEGRITY_MISMATCH")?;
        Ok(state)
    }

    fn capture_head(&self, replica_id: &str) -> Result<AuthorityHead, ReplicationError> {
        let session_id = get_string(&self.session, "id")?;
        let branch_id = get_string(&self.session, "branchId")?;
        let runtime = PersistentMultiSession::open(self.runtime_dir(replica_id))?;
        let checkpoint = runtime.checkpoint(session_id)?;
        let state = self.session_state(replica_id)?;
        let mut store = ClosedLoopStore::open(self.runtime_dir(replica_id))?;
        let generation = store.current_generation(branch_id)?;
        let rounds = get_required(&state, "rounds")?
            .as_array()
            .ok_or_else(|| error("INVALID_SESSION_STATE", "rounds must be an array"))?;
        let last_round = rounds
            .last()
            .ok_or_else(|| error("NO_SESSION_ROUND", replica_id))?;
        let events = get_required(&state, "events")?
            .as_array()
            .ok_or_else(|| error("INVALID_SESSION_STATE", "events must be an array"))?;
        let event_hashes = events
            .iter()
            .map(|event| get_string(event, "eventHash").map(ToOwned::to_owned))
            .collect::<Result<Vec<_>, _>>()?;
        let generation_ids = strings(&state, "generationIds")?;
        let descriptor = object(vec![
            ("format", string("rfe.authority-snapshot.v0.5")),
            ("sessionId", string(session_id)),
            ("round", number(get_u64(&checkpoint, "round")?)),
            (
                "roundHashes",
                get_required(&checkpoint, "roundHashes")?.clone(),
            ),
            ("generationIds", string_array(generation_ids.clone())),
            ("eventHashes", string_array(event_hashes.clone())),
            (
                "generationId",
                string(get_string(&generation, "generationId")?),
            ),
            (
                "semanticRoot",
                string(get_string(&generation, "semanticRoot")?),
            ),
            (
                "checkpointHash",
                string(get_string(&checkpoint, "checkpointHash")?),
            ),
            (
                "sessionStateIntegrityHash",
                string(get_string(&state, "integrityHash")?),
            ),
        ]);
        let snapshot_hash = sha256_hex(descriptor.canonical_string().as_bytes());
        Ok(AuthorityHead {
            round: get_u64(&checkpoint, "round")?,
            round_hash: get_string(last_round, "roundHash")?.to_owned(),
            generation_id: get_string(&generation, "generationId")?.to_owned(),
            reality_revision: get_u64(&generation, "realityRevision")?,
            semantic_root: get_string(&generation, "semanticRoot")?.to_owned(),
            checkpoint_hash: get_string(&checkpoint, "checkpointHash")?.to_owned(),
            event_head: event_hashes.last().cloned(),
            event_sequence: events
                .last()
                .map_or(Ok(0), |event| get_u64(event, "sequence"))?,
            event_hashes,
            generation_ids,
            state_integrity_hash: get_string(&state, "integrityHash")?.to_owned(),
            snapshot_hash,
        })
    }

    fn build_entry(
        &self,
        leader_id: &str,
        term: u64,
        previous: Option<&str>,
        head: &AuthorityHead,
    ) -> Result<JsonValue, ReplicationError> {
        let body = object(vec![
            ("format", string("rfe.replication-log-entry.v0.5")),
            ("index", number(head.round)),
            ("term", number(term)),
            ("leaderId", string(leader_id)),
            ("sessionId", string(get_string(&self.session, "id")?)),
            ("round", number(head.round)),
            ("roundHash", string(head.round_hash.clone())),
            ("generationId", string(head.generation_id.clone())),
            ("realityRevision", number(head.reality_revision)),
            ("semanticRoot", string(head.semantic_root.clone())),
            ("checkpointHash", string(head.checkpoint_hash.clone())),
            (
                "eventHead",
                head.event_head.clone().map_or(JsonValue::Null, string),
            ),
            ("eventSequence", number(head.event_sequence)),
            ("eventHashes", string_array(head.event_hashes.clone())),
            ("generationIds", string_array(head.generation_ids.clone())),
            (
                "sessionStateIntegrityHash",
                string(head.state_integrity_hash.clone()),
            ),
            ("authoritySnapshotHash", string(head.snapshot_hash.clone())),
            (
                "previousEntryHash",
                previous.map_or(JsonValue::Null, string),
            ),
        ]);
        with_hash(body, "entryHash")
    }

    fn assert_leader(&self, replica_id: &str, term: u64) -> Result<(), ReplicationError> {
        let cluster = self.read_cluster_state()?;
        let current_term = get_u64(&cluster, "term")?;
        let leader = get_string(&cluster, "leaderId")?;
        if term != current_term {
            return Err(error(
                "STALE_LEADER_TERM",
                format!("replica={replica_id} supplied={term} current={current_term}"),
            ));
        }
        if replica_id != leader {
            return Err(error(
                "NOT_CURRENT_LEADER",
                format!("replica={replica_id} leader={leader}"),
            ));
        }
        let state = self.read_replica_state(replica_id)?;
        if !get_bool(&state, "online")? {
            return Err(error("LEADER_OFFLINE", replica_id));
        }
        Ok(())
    }

    fn execute_round(
        &self,
        leader_id: &str,
        term: u64,
        round: u64,
        final_round: bool,
    ) -> Result<Option<JsonValue>, ReplicationError> {
        self.assert_leader(leader_id, term)?;
        let mut runtime = PersistentMultiSession::open(self.runtime_dir(leader_id))?;
        if final_round {
            let result = runtime.run_session(&self.session, SessionCrashPoint::None)?;
            Ok(Some(result))
        } else {
            let failure = runtime
                .run_session(
                    &self.session,
                    SessionCrashPoint::AfterRoundCheckpoint(round),
                )
                .expect_err("C7 checkpoint fault must be injected");
            if failure.code != "SESSION_CRASH_INJECTED_AFTER_CHECKPOINT" {
                return Err(error(failure.code, failure.message));
            }
            Ok(None)
        }
    }

    fn append_leader_entry(
        &self,
        leader_id: &str,
        term: u64,
    ) -> Result<JsonValue, ReplicationError> {
        let head = self.capture_head(leader_id)?;
        let log = self.read_log(leader_id)?;
        let mut entries = get_required(&log, "entries")?
            .as_array()
            .ok_or_else(|| error("INVALID_LOG", "entries must be an array"))?
            .to_vec();
        let previous = entries
            .last()
            .map(|entry| get_string(entry, "entryHash"))
            .transpose()?;
        let entry = self.build_entry(leader_id, term, previous, &head)?;
        if get_u64(&entry, "index")?
            != u64::try_from(entries.len() + 1)
                .map_err(|failure| error("INTEGER_OVERFLOW", failure.to_string()))?
        {
            return Err(error("ROUND_LOG_INDEX_MISMATCH", head.round.to_string()));
        }
        entries.push(entry.clone());
        self.write_log(leader_id, entries)?;
        self.apply_replica_head(leader_id, &entry, term, "leader", true)?;
        Ok(entry)
    }

    fn apply_replica_head(
        &self,
        replica_id: &str,
        entry: &JsonValue,
        term: u64,
        role: &str,
        online: bool,
    ) -> Result<(), ReplicationError> {
        let state = object(vec![
            ("format", string("rfe.replica-state.v0.5")),
            ("replicaId", string(replica_id)),
            ("role", string(role)),
            ("term", number(term)),
            ("online", bool_value(online)),
            ("appliedIndex", number(get_u64(entry, "index")?)),
            ("logHead", string(get_string(entry, "entryHash")?)),
            ("generationId", string(get_string(entry, "generationId")?)),
            ("semanticRoot", string(get_string(entry, "semanticRoot")?)),
            (
                "checkpointHash",
                string(get_string(entry, "checkpointHash")?),
            ),
            ("round", number(get_u64(entry, "round")?)),
        ]);
        self.write_replica_state(replica_id, state)
    }

    fn replicate_to(
        &self,
        leader_id: &str,
        follower_id: &str,
        term: u64,
    ) -> Result<usize, ReplicationError> {
        self.assert_leader(leader_id, term)?;
        if leader_id == follower_id {
            return Err(error("SELF_REPLICATION", leader_id));
        }
        let follower_state = self.read_replica_state(follower_id)?;
        if !get_bool(&follower_state, "online")? {
            return Err(error("FOLLOWER_OFFLINE", follower_id));
        }
        let leader_log = self.read_log(leader_id)?;
        let follower_log = self.read_log(follower_id)?;
        let leader_entries = get_required(&leader_log, "entries")?
            .as_array()
            .ok_or_else(|| error("INVALID_LOG", "leader entries must be an array"))?;
        let mut follower_entries = get_required(&follower_log, "entries")?
            .as_array()
            .ok_or_else(|| error("INVALID_LOG", "follower entries must be an array"))?
            .to_vec();
        let applied = usize::try_from(get_u64(&follower_state, "appliedIndex")?)
            .map_err(|failure| error("INTEGER_OVERFLOW", failure.to_string()))?;
        if applied > leader_entries.len() {
            return Err(error("FOLLOWER_AHEAD_OF_LEADER", follower_id));
        }
        for (offset, entry) in follower_entries.iter().enumerate() {
            if entry.canonical_string() != leader_entries[offset].canonical_string() {
                return Err(error("LOG_PREFIX_DIVERGENCE", follower_id));
            }
        }
        let missing = leader_entries[applied..].to_vec();
        if missing.is_empty() {
            return Ok(0);
        }
        let staging = self.replica_dir(follower_id).join("runtime.staging");
        copy_tree(&self.runtime_dir(leader_id), &staging)?;
        let source_tree_hash = tree_hash(&self.runtime_dir(leader_id))?;
        let target_tree_hash = tree_hash(&staging)?;
        if source_tree_hash != target_tree_hash {
            return Err(error(
                "RUNTIME_TRANSFER_HASH_MISMATCH",
                format!("{source_tree_hash} != {target_tree_hash}"),
            ));
        }
        let runtime = self.runtime_dir(follower_id);
        if runtime.exists() {
            fs::remove_dir_all(&runtime)?;
        }
        fs::rename(staging, runtime)?;
        follower_entries.extend(missing.iter().cloned());
        self.write_log(follower_id, follower_entries)?;
        let latest = missing
            .last()
            .ok_or_else(|| error("MISSING_LATEST_ENTRY", follower_id))?;
        self.apply_replica_head(follower_id, latest, term, "follower", true)?;
        let installed = self.capture_head(follower_id)?;
        if installed.snapshot_hash != get_string(latest, "authoritySnapshotHash")? {
            return Err(error("FOLLOWER_SNAPSHOT_VERIFICATION_FAILED", follower_id));
        }
        Ok(missing.len())
    }

    fn commit_entry(
        &self,
        leader_id: &str,
        entry: &JsonValue,
        acknowledgements: &[String],
    ) -> Result<(), ReplicationError> {
        let unique = acknowledgements.iter().collect::<BTreeSet<_>>();
        if unique.len() < self.quorum || !acknowledgements.iter().any(|item| item == leader_id) {
            return Err(error(
                "QUORUM_NOT_REACHED",
                format!("acks={} quorum={}", unique.len(), self.quorum),
            ));
        }
        let cluster = self.read_cluster_state()?;
        let state = object(vec![
            ("format", string("rfe.replica-cluster-state.v0.5")),
            ("term", number(get_u64(&cluster, "term")?)),
            ("leaderId", string(get_string(&cluster, "leaderId")?)),
            ("commitIndex", number(get_u64(entry, "index")?)),
            ("logHead", string(get_string(entry, "entryHash")?)),
            ("members", get_required(&cluster, "members")?.clone()),
            (
                "onlineByReplica",
                get_required(&cluster, "onlineByReplica")?.clone(),
            ),
        ]);
        self.write_cluster_state(state)
    }

    fn set_online(&self, replica_id: &str, online: bool) -> Result<(), ReplicationError> {
        let cluster = self.read_cluster_state()?;
        let mut online_map = get_required(&cluster, "onlineByReplica")?.clone();
        set_object_field(&mut online_map, replica_id, bool_value(online))?;
        let state = object(vec![
            ("format", string("rfe.replica-cluster-state.v0.5")),
            ("term", number(get_u64(&cluster, "term")?)),
            ("leaderId", string(get_string(&cluster, "leaderId")?)),
            ("commitIndex", number(get_u64(&cluster, "commitIndex")?)),
            ("logHead", get_required(&cluster, "logHead")?.clone()),
            ("members", get_required(&cluster, "members")?.clone()),
            ("onlineByReplica", online_map),
        ]);
        self.write_cluster_state(state)?;
        let current = self.read_replica_state(replica_id)?;
        let replica = object(vec![
            ("format", string("rfe.replica-state.v0.5")),
            ("replicaId", string(replica_id)),
            ("role", string(get_string(&current, "role")?)),
            ("term", number(get_u64(&current, "term")?)),
            ("online", bool_value(online)),
            ("appliedIndex", number(get_u64(&current, "appliedIndex")?)),
            ("logHead", get_required(&current, "logHead")?.clone()),
            (
                "generationId",
                string(get_string(&current, "generationId")?),
            ),
            (
                "semanticRoot",
                string(get_string(&current, "semanticRoot")?),
            ),
            (
                "checkpointHash",
                string(get_string(&current, "checkpointHash")?),
            ),
            ("round", number(get_u64(&current, "round")?)),
        ]);
        self.write_replica_state(replica_id, replica)
    }

    fn promote(&self, successor: &str) -> Result<u64, ReplicationError> {
        let cluster = self.read_cluster_state()?;
        let commit_index = get_u64(&cluster, "commitIndex")?;
        let log_head = get_string(&cluster, "logHead")?;
        let successor_state = self.read_replica_state(successor)?;
        if !get_bool(&successor_state, "online")?
            || get_u64(&successor_state, "appliedIndex")? != commit_index
            || get_string(&successor_state, "logHead")? != log_head
        {
            return Err(error("SUCCESSOR_NOT_CAUGHT_UP", successor));
        }
        let term = get_u64(&cluster, "term")? + 1;
        let state = object(vec![
            ("format", string("rfe.replica-cluster-state.v0.5")),
            ("term", number(term)),
            ("leaderId", string(successor)),
            ("commitIndex", number(commit_index)),
            ("logHead", string(log_head)),
            ("members", get_required(&cluster, "members")?.clone()),
            (
                "onlineByReplica",
                get_required(&cluster, "onlineByReplica")?.clone(),
            ),
        ]);
        self.write_cluster_state(state)?;
        for member in &self.members {
            let current = self.read_replica_state(member)?;
            let role = if member == successor {
                "leader"
            } else {
                "follower"
            };
            let replica = object(vec![
                ("format", string("rfe.replica-state.v0.5")),
                ("replicaId", string(member)),
                ("role", string(role)),
                ("term", number(term)),
                ("online", bool_value(get_bool(&current, "online")?)),
                ("appliedIndex", number(get_u64(&current, "appliedIndex")?)),
                ("logHead", get_required(&current, "logHead")?.clone()),
                (
                    "generationId",
                    string(get_string(&current, "generationId")?),
                ),
                (
                    "semanticRoot",
                    string(get_string(&current, "semanticRoot")?),
                ),
                (
                    "checkpointHash",
                    string(get_string(&current, "checkpointHash")?),
                ),
                ("round", number(get_u64(&current, "round")?)),
            ]);
            self.write_replica_state(member, replica)?;
        }
        Ok(term)
    }

    fn public_replica_state(&self, replica_id: &str) -> Result<JsonValue, ReplicationError> {
        let state = self.read_replica_state(replica_id)?;
        Ok(object(vec![
            ("replicaId", string(replica_id)),
            ("role", string(get_string(&state, "role")?)),
            ("term", number(get_u64(&state, "term")?)),
            ("online", bool_value(get_bool(&state, "online")?)),
            ("appliedIndex", number(get_u64(&state, "appliedIndex")?)),
            ("logHead", get_required(&state, "logHead")?.clone()),
            ("generationId", string(get_string(&state, "generationId")?)),
            ("semanticRoot", string(get_string(&state, "semanticRoot")?)),
            (
                "checkpointHash",
                string(get_string(&state, "checkpointHash")?),
            ),
            ("round", number(get_u64(&state, "round")?)),
        ]))
    }

    fn healthy_convergence(&self) -> Result<JsonValue, ReplicationError> {
        let cluster = self.read_cluster_state()?;
        let online = get_required(&cluster, "onlineByReplica")?
            .as_object()
            .ok_or_else(|| error("INVALID_CLUSTER_STATE", "online map must be object"))?;
        let healthy = online
            .iter()
            .filter_map(|(replica, value)| match value {
                JsonValue::Bool(true) => Some(replica.clone()),
                _ => None,
            })
            .collect::<Vec<_>>();
        let mut identities = BTreeSet::new();
        for replica in &healthy {
            let state = self.read_replica_state(replica)?;
            identities.insert(format!(
                "{}:{}:{}:{}:{}",
                get_u64(&state, "appliedIndex")?,
                get_string(&state, "logHead")?,
                get_string(&state, "generationId")?,
                get_string(&state, "semanticRoot")?,
                get_string(&state, "checkpointHash")?
            ));
        }
        Ok(object(vec![
            ("converged", bool_value(identities.len() == 1)),
            ("healthyReplicas", string_array(healthy)),
            (
                "identityCount",
                number(u64::try_from(identities.len()).unwrap_or(u64::MAX)),
            ),
            ("commitIndex", number(get_u64(&cluster, "commitIndex")?)),
            ("logHead", get_required(&cluster, "logHead")?.clone()),
        ]))
    }

    /// Runs the normative three-replica C7 failover and catch-up scenario.
    ///
    /// # Errors
    ///
    /// Returns [`ReplicationError`] when any authority round, quorum, transfer,
    /// election, stale-term rejection, or convergence proof fails.
    #[allow(clippy::too_many_lines)]
    pub fn run_acceptance_scenario(&self) -> Result<JsonValue, ReplicationError> {
        let initial_cluster = self.read_cluster_state()?;
        let leader_a = get_string(&initial_cluster, "leaderId")?.to_owned();
        let followers = self
            .members
            .iter()
            .filter(|member| *member != &leader_a)
            .cloned()
            .collect::<Vec<_>>();
        if followers.len() != 2 {
            return Err(error(
                "C7_REQUIRES_THREE_REPLICAS",
                followers.len().to_string(),
            ));
        }
        let follower_b = followers[0].clone();
        let follower_c = followers[1].clone();
        let mut timeline = Vec::new();
        let mut verified_transfers = 0_u64;
        let mut replicated_entries = 0_u64;

        self.execute_round(&leader_a, 1, 1, false)?;
        let entry1 = self.append_leader_entry(&leader_a, 1)?;
        replicated_entries += u64::try_from(self.replicate_to(&leader_a, &follower_b, 1)?)
            .map_err(|failure| error("INTEGER_OVERFLOW", failure.to_string()))?;
        verified_transfers += 1;
        replicated_entries += u64::try_from(self.replicate_to(&leader_a, &follower_c, 1)?)
            .map_err(|failure| error("INTEGER_OVERFLOW", failure.to_string()))?;
        verified_transfers += 1;
        self.commit_entry(
            &leader_a,
            &entry1,
            &[leader_a.clone(), follower_b.clone(), follower_c.clone()],
        )?;
        timeline.push(object(vec![
            ("step", string("round_1_committed")),
            ("term", number(1)),
            ("leaderId", string(leader_a.clone())),
            ("commitIndex", number(1)),
            (
                "acknowledgedBy",
                string_array(vec![
                    leader_a.clone(),
                    follower_b.clone(),
                    follower_c.clone(),
                ]),
            ),
        ]));

        self.execute_round(&leader_a, 1, 2, false)?;
        let entry2 = self.append_leader_entry(&leader_a, 1)?;
        replicated_entries += u64::try_from(self.replicate_to(&leader_a, &follower_b, 1)?)
            .map_err(|failure| error("INTEGER_OVERFLOW", failure.to_string()))?;
        verified_transfers += 1;
        self.commit_entry(&leader_a, &entry2, &[leader_a.clone(), follower_b.clone()])?;
        timeline.push(object(vec![
            ("step", string("round_2_committed_follower_c_lagging")),
            ("term", number(1)),
            ("leaderId", string(leader_a.clone())),
            ("commitIndex", number(2)),
            (
                "acknowledgedBy",
                string_array(vec![leader_a.clone(), follower_b.clone()]),
            ),
            ("laggingReplica", string(follower_c.clone())),
            ("laggingAppliedIndex", number(1)),
        ]));

        self.set_online(&leader_a, false)?;
        let term2 = self.promote(&follower_b)?;
        timeline.push(object(vec![
            ("step", string("leader_failover")),
            ("term", number(term2)),
            ("failedLeader", string(leader_a.clone())),
            ("newLeader", string(follower_b.clone())),
            ("verifiedCommitIndex", number(2)),
        ]));

        let stale = self
            .assert_leader(&leader_a, 1)
            .expect_err("old leader term must be rejected");
        if stale.code != "STALE_LEADER_TERM" {
            return Err(stale);
        }
        let stale_rejection = object(vec![
            ("replicaId", string(leader_a.clone())),
            ("suppliedTerm", number(1)),
            ("currentTerm", number(term2)),
            ("status", string("rejected")),
            ("reasonCode", string("stale_leader_term")),
        ]);

        let final_session = self
            .execute_round(&follower_b, term2, 3, true)?
            .ok_or_else(|| error("FINAL_SESSION_RESULT_MISSING", &follower_b))?;
        let entry3 = self.append_leader_entry(&follower_b, term2)?;
        let caught_up = self.replicate_to(&follower_b, &follower_c, term2)?;
        replicated_entries += u64::try_from(caught_up)
            .map_err(|failure| error("INTEGER_OVERFLOW", failure.to_string()))?;
        verified_transfers += 1;
        self.commit_entry(
            &follower_b,
            &entry3,
            &[follower_b.clone(), follower_c.clone()],
        )?;
        timeline.push(object(vec![
            ("step", string("round_3_committed_after_failover")),
            ("term", number(term2)),
            ("leaderId", string(follower_b.clone())),
            ("commitIndex", number(3)),
            (
                "acknowledgedBy",
                string_array(vec![follower_b.clone(), follower_c.clone()]),
            ),
            ("catchUpReplica", string(follower_c.clone())),
            (
                "entriesInstalledDuringCatchUp",
                number(u64::try_from(caught_up).unwrap_or(u64::MAX)),
            ),
        ]));

        let convergence = self.healthy_convergence()?;
        if !get_bool(&convergence, "converged")? {
            return Err(error("HEALTHY_REPLICAS_DIVERGED", "C7 final state"));
        }
        let cluster = self.read_cluster_state()?;
        let log = self.read_log(&follower_b)?;
        let entries = get_required(&log, "entries")?.clone();
        let replica_states = object_owned(
            self.members
                .iter()
                .map(|member| {
                    self.public_replica_state(member)
                        .map(|state| (member.clone(), state))
                })
                .collect::<Result<Vec<_>, _>>()?,
        );
        let final_generation = get_required(&final_session, "finalGeneration")?;
        let final_checkpoint = get_required(&final_session, "checkpoint")?;
        let body = object(vec![
            ("format", string("rfe.replicated-authority-result.v0.5")),
            ("faultModel", string("crash-fault-majority-single-leader")),
            ("initialLeader", string(leader_a)),
            ("finalLeader", string(follower_b)),
            ("finalTerm", number(term2)),
            (
                "quorum",
                number(u64::try_from(self.quorum).unwrap_or(u64::MAX)),
            ),
            ("timeline", JsonValue::Array(timeline)),
            ("authorityLog", entries),
            ("staleLeaderRejection", stale_rejection),
            ("replicaStates", replica_states),
            ("healthyConvergence", convergence),
            (
                "finalGenerationId",
                string(get_string(final_generation, "generationId")?),
            ),
            (
                "finalSemanticRoot",
                string(get_string(final_generation, "semanticRoot")?),
            ),
            (
                "finalCheckpointHash",
                string(get_string(final_checkpoint, "checkpointHash")?),
            ),
            (
                "finalSessionResultHash",
                string(get_string(&final_session, "sessionResultHash")?),
            ),
            (
                "clusterCommitIndex",
                number(get_u64(&cluster, "commitIndex")?),
            ),
            ("clusterLogHead", get_required(&cluster, "logHead")?.clone()),
            (
                "metrics",
                object(vec![
                    ("terms", number(term2)),
                    ("leaderFailovers", number(1)),
                    ("staleLeaderRejections", number(1)),
                    ("verifiedRuntimeTransfers", number(verified_transfers)),
                    ("replicatedLogEntries", number(replicated_entries)),
                    ("laggingReplicaCatchUpEntries", number(2)),
                    ("healthyReplicaCount", number(2)),
                    ("divergentHealthyReplicas", number(0)),
                ]),
            ),
        ]);
        with_hash(body, "replicatedAuthorityResultHash")
    }
}
