//! Cross-domain atomic reality coordinator for RFE v0.6.0.
//!
//! C8 binds two or more independently authoritative reality domains into one
//! crash-recoverable atomic transaction. A transaction either changes every
//! selected domain or leaves every selected domain unchanged. The coordinator
//! persists prepare records before a single durable commit decision, then uses
//! that decision as the recovery authority after interruption.
//!
//! The implementation is deterministic and local-filesystem based. It is an
//! atomic coordination layer above C7 replicated authorities; it does not claim
//! Byzantine fault tolerance or distributed consensus across untrusted nodes.

use rfe_canonical::{parse_json, sha256_hex, JsonError, JsonValue};
use std::collections::{BTreeMap, BTreeSet};
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::fs;
use std::path::{Path, PathBuf};

/// Error returned by the C8 atomic coordinator.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AtomicRealityError {
    /// Stable machine-readable error code.
    pub code: &'static str,
    /// Human-readable diagnostic detail.
    pub message: String,
}

impl Display for AtomicRealityError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}: {}", self.code, self.message)
    }
}

impl Error for AtomicRealityError {}

impl From<std::io::Error> for AtomicRealityError {
    fn from(value: std::io::Error) -> Self {
        Self {
            code: "IO",
            message: value.to_string(),
        }
    }
}

impl From<JsonError> for AtomicRealityError {
    fn from(value: JsonError) -> Self {
        Self {
            code: "INVALID_JSON",
            message: value.to_string(),
        }
    }
}

/// Deterministic crash points used by conformance and recovery tests.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AtomicCrashPoint {
    /// Execute without an injected interruption.
    None,
    /// Interrupt after the specified number of participants are prepared.
    AfterPrepare(usize),
    /// Interrupt after the specified number of participants are committed.
    AfterCommit(usize),
}

fn error(code: &'static str, message: impl Into<String>) -> AtomicRealityError {
    AtomicRealityError {
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

fn get_required<'a>(value: &'a JsonValue, key: &str) -> Result<&'a JsonValue, AtomicRealityError> {
    value
        .get(key)
        .ok_or_else(|| error("MISSING_FIELD", format!("missing field: {key}")))
}

fn get_string<'a>(value: &'a JsonValue, key: &str) -> Result<&'a str, AtomicRealityError> {
    get_required(value, key)?
        .as_str()
        .ok_or_else(|| error("INVALID_FIELD", format!("field {key} must be a string")))
}

fn get_u64(value: &JsonValue, key: &str) -> Result<u64, AtomicRealityError> {
    get_required(value, key)?.as_u64().ok_or_else(|| {
        error(
            "INVALID_FIELD",
            format!("field {key} must be an unsigned integer"),
        )
    })
}

fn set_field(
    value: &mut JsonValue,
    key: &str,
    replacement: JsonValue,
) -> Result<(), AtomicRealityError> {
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

fn remove_field(value: &mut JsonValue, key: &str) {
    if let JsonValue::Object(entries) = value {
        entries.retain(|(candidate, _)| candidate != key);
    }
}

fn with_hash(mut value: JsonValue, field: &str) -> Result<JsonValue, AtomicRealityError> {
    remove_field(&mut value, field);
    let digest = sha256_hex(value.canonical_string().as_bytes());
    set_field(&mut value, field, string(digest))?;
    Ok(value)
}

fn verify_hash(
    value: &JsonValue,
    field: &str,
    code: &'static str,
) -> Result<(), AtomicRealityError> {
    let expected = get_string(value, field)?.to_owned();
    let mut body = value.clone();
    remove_field(&mut body, field);
    let actual = sha256_hex(body.canonical_string().as_bytes());
    if actual == expected {
        Ok(())
    } else {
        Err(error(code, format!("expected {expected}, got {actual}")))
    }
}

fn atomic_write(path: &Path, value: &JsonValue) -> Result<(), AtomicRealityError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let temporary = path.with_extension(format!("{}.tmp", std::process::id()));
    fs::write(&temporary, value.canonical_string())?;
    if path.exists() {
        fs::remove_file(path)?;
    }
    fs::rename(temporary, path)?;
    Ok(())
}

fn read_json(path: &Path) -> Result<JsonValue, AtomicRealityError> {
    Ok(parse_json(&fs::read_to_string(path)?)?)
}

fn participant_key(domain_id: &str) -> String {
    sha256_hex(domain_id.as_bytes())
}

fn string_array(values: impl IntoIterator<Item = String>) -> JsonValue {
    JsonValue::Array(values.into_iter().map(string).collect())
}

/// Builds a C8 participant seed from a completed C7 authority result.
///
/// # Errors
///
/// Returns [`AtomicRealityError`] when the C7 result is missing its semantic
/// root or replicated authority proof hash.
pub fn participant_seed_from_c7(
    domain_id: &str,
    c7_result: &JsonValue,
) -> Result<JsonValue, AtomicRealityError> {
    Ok(object(vec![
        ("domainId", string(domain_id)),
        (
            "semanticRoot",
            string(get_string(c7_result, "finalSemanticRoot")?),
        ),
        (
            "authorityProofHash",
            string(get_string(c7_result, "replicatedAuthorityResultHash")?),
        ),
    ]))
}

/// Persistent coordinator for C8 cross-domain atomic reality transactions.
#[derive(Debug)]
pub struct AtomicRealityCoordinator {
    root: PathBuf,
    domains: Vec<String>,
}

impl AtomicRealityCoordinator {
    /// Bootstraps an atomic coordinator from two or more C7-backed domains.
    ///
    /// Each participant must contain `domainId`, `semanticRoot`, and
    /// `authorityProofHash`.
    ///
    /// # Errors
    ///
    /// Returns [`AtomicRealityError`] for duplicate domains, malformed seeds,
    /// or persistence failures.
    pub fn bootstrap(
        root: impl AsRef<Path>,
        participants: &JsonValue,
    ) -> Result<Self, AtomicRealityError> {
        let root = root.as_ref().to_path_buf();
        if root.exists() {
            fs::remove_dir_all(&root)?;
        }
        fs::create_dir_all(root.join("participants"))?;
        fs::create_dir_all(root.join("transactions"))?;
        let seeds = participants
            .as_array()
            .ok_or_else(|| error("INVALID_PARTICIPANTS", "participants must be an array"))?;
        if seeds.len() < 2 {
            return Err(error(
                "INSUFFICIENT_PARTICIPANTS",
                "C8 requires at least two domains",
            ));
        }
        let mut domains = Vec::with_capacity(seeds.len());
        let mut unique = BTreeSet::new();
        for seed in seeds {
            let domain_id = get_string(seed, "domainId")?.to_owned();
            if !unique.insert(domain_id.clone()) {
                return Err(error("DUPLICATE_DOMAIN", domain_id));
            }
            let semantic_root = get_string(seed, "semanticRoot")?;
            let authority_proof = get_string(seed, "authorityProofHash")?;
            if semantic_root.is_empty() || authority_proof.is_empty() {
                return Err(error("EMPTY_AUTHORITY_SEED", domain_id));
            }
            domains.push(domain_id.clone());
            let state = with_hash(
                object(vec![
                    ("format", string("rfe.atomic-domain-state.v0.6")),
                    ("domainId", string(domain_id.clone())),
                    ("authorityProofHash", string(authority_proof)),
                    ("revision", number(0)),
                    ("committedRoot", string(semantic_root)),
                    ("phase", string("stable")),
                    ("pendingTransactionId", JsonValue::Null),
                    ("preparedRoot", JsonValue::Null),
                    ("prepareHash", JsonValue::Null),
                ]),
                "integrityHash",
            )?;
            atomic_write(
                &root
                    .join("participants")
                    .join(format!("{}.json", participant_key(&domain_id))),
                &state,
            )?;
        }
        domains.sort();
        let coordinator = Self { root, domains };
        let global_root = coordinator.current_global_root()?;
        let manifest = with_hash(
            object(vec![
                ("format", string("rfe.atomic-coordinator.v0.6")),
                ("domains", string_array(coordinator.domains.clone())),
                ("transactionSequence", number(0)),
                ("globalRoot", string(global_root)),
            ]),
            "integrityHash",
        )?;
        atomic_write(&coordinator.root.join("coordinator.json"), &manifest)?;
        Ok(coordinator)
    }

    fn participant_path(&self, domain_id: &str) -> PathBuf {
        self.root
            .join("participants")
            .join(format!("{}.json", participant_key(domain_id)))
    }

    fn transaction_dir(&self, transaction_id: &str) -> PathBuf {
        self.root
            .join("transactions")
            .join(participant_key(transaction_id))
    }

    fn read_participant(&self, domain_id: &str) -> Result<JsonValue, AtomicRealityError> {
        if !self.domains.iter().any(|candidate| candidate == domain_id) {
            return Err(error("UNKNOWN_DOMAIN", domain_id));
        }
        let state = read_json(&self.participant_path(domain_id))?;
        verify_hash(
            &state,
            "integrityHash",
            "PARTICIPANT_STATE_INTEGRITY_MISMATCH",
        )?;
        if get_string(&state, "domainId")? != domain_id {
            return Err(error("PARTICIPANT_ID_MISMATCH", domain_id));
        }
        Ok(state)
    }

    fn write_participant(
        &self,
        domain_id: &str,
        state: JsonValue,
    ) -> Result<(), AtomicRealityError> {
        atomic_write(
            &self.participant_path(domain_id),
            &with_hash(state, "integrityHash")?,
        )
    }

    fn read_coordinator(&self) -> Result<JsonValue, AtomicRealityError> {
        let state = read_json(&self.root.join("coordinator.json"))?;
        verify_hash(&state, "integrityHash", "COORDINATOR_INTEGRITY_MISMATCH")?;
        Ok(state)
    }

    fn write_coordinator(
        &self,
        sequence: u64,
        global_root: &str,
    ) -> Result<(), AtomicRealityError> {
        let state = with_hash(
            object(vec![
                ("format", string("rfe.atomic-coordinator.v0.6")),
                ("domains", string_array(self.domains.clone())),
                ("transactionSequence", number(sequence)),
                ("globalRoot", string(global_root)),
            ]),
            "integrityHash",
        )?;
        atomic_write(&self.root.join("coordinator.json"), &state)
    }

    fn global_root_from_states(
        states: &BTreeMap<String, JsonValue>,
    ) -> Result<String, AtomicRealityError> {
        let manifest = JsonValue::Array(
            states
                .iter()
                .map(|(domain_id, state)| {
                    Ok(object(vec![
                        ("domainId", string(domain_id)),
                        (
                            "authorityProofHash",
                            string(get_string(state, "authorityProofHash")?),
                        ),
                        ("revision", number(get_u64(state, "revision")?)),
                        ("committedRoot", string(get_string(state, "committedRoot")?)),
                    ]))
                })
                .collect::<Result<Vec<_>, AtomicRealityError>>()?,
        );
        Ok(sha256_hex(manifest.canonical_string().as_bytes()))
    }

    fn all_states(&self) -> Result<BTreeMap<String, JsonValue>, AtomicRealityError> {
        self.domains
            .iter()
            .map(|domain_id| {
                self.read_participant(domain_id)
                    .map(|state| (domain_id.clone(), state))
            })
            .collect()
    }

    /// Returns the deterministic root of all committed domain states.
    ///
    /// # Errors
    ///
    /// Returns [`AtomicRealityError`] if any participant state is invalid.
    pub fn current_global_root(&self) -> Result<String, AtomicRealityError> {
        Self::global_root_from_states(&self.all_states()?)
    }

    /// Returns a verified participant state.
    ///
    /// # Errors
    ///
    /// Returns [`AtomicRealityError`] for an unknown or corrupted domain.
    pub fn participant_state(&self, domain_id: &str) -> Result<JsonValue, AtomicRealityError> {
        self.read_participant(domain_id)
    }

    fn parse_operations(
        &self,
        transaction: &JsonValue,
    ) -> Result<Vec<(String, JsonValue)>, AtomicRealityError> {
        let operations = get_required(transaction, "operations")?
            .as_array()
            .ok_or_else(|| error("INVALID_OPERATIONS", "operations must be an array"))?;
        if operations.len() < 2 {
            return Err(error(
                "INSUFFICIENT_ATOMIC_SCOPE",
                "an atomic transaction must touch at least two domains",
            ));
        }
        let mut parsed = Vec::with_capacity(operations.len());
        let mut unique = BTreeSet::new();
        for item in operations {
            let domain_id = get_string(item, "domainId")?.to_owned();
            if !self.domains.iter().any(|candidate| candidate == &domain_id) {
                return Err(error("UNKNOWN_DOMAIN", domain_id));
            }
            if !unique.insert(domain_id.clone()) {
                return Err(error("DUPLICATE_DOMAIN_OPERATION", domain_id));
            }
            parsed.push((domain_id, get_required(item, "operation")?.clone()));
        }
        parsed.sort_by(|left, right| left.0.cmp(&right.0));
        Ok(parsed)
    }

    fn build_prepare(
        &self,
        transaction_id: &str,
        domain_id: &str,
        operation: &JsonValue,
        state: &JsonValue,
    ) -> Result<JsonValue, AtomicRealityError> {
        if get_string(state, "phase")? != "stable" {
            return Err(error("DOMAIN_NOT_STABLE", domain_id));
        }
        let operation_hash = sha256_hex(operation.canonical_string().as_bytes());
        let next_revision = get_u64(state, "revision")? + 1;
        let transition = object(vec![
            ("format", string("rfe.atomic-domain-transition.v0.6")),
            ("transactionId", string(transaction_id)),
            ("domainId", string(domain_id)),
            (
                "authorityProofHash",
                string(get_string(state, "authorityProofHash")?),
            ),
            ("beforeRoot", string(get_string(state, "committedRoot")?)),
            ("nextRevision", number(next_revision)),
            ("operationHash", string(operation_hash.clone())),
        ]);
        let after_root = sha256_hex(transition.canonical_string().as_bytes());
        with_hash(
            object(vec![
                ("format", string("rfe.atomic-prepare.v0.6")),
                ("transactionId", string(transaction_id)),
                ("domainId", string(domain_id)),
                (
                    "authorityProofHash",
                    string(get_string(state, "authorityProofHash")?),
                ),
                ("baseRevision", number(get_u64(state, "revision")?)),
                ("nextRevision", number(next_revision)),
                ("beforeRoot", string(get_string(state, "committedRoot")?)),
                ("afterRoot", string(after_root)),
                ("operationHash", string(operation_hash)),
            ]),
            "prepareHash",
        )
    }

    fn write_journal(
        &self,
        transaction_id: &str,
        status: &str,
        base_global_root: &str,
        participant_ids: Vec<String>,
        sequence: u64,
    ) -> Result<(), AtomicRealityError> {
        let journal = with_hash(
            object(vec![
                ("format", string("rfe.atomic-journal.v0.6")),
                ("transactionId", string(transaction_id)),
                ("status", string(status)),
                ("baseGlobalRoot", string(base_global_root)),
                ("participantIds", string_array(participant_ids)),
                ("transactionSequence", number(sequence)),
            ]),
            "integrityHash",
        )?;
        atomic_write(
            &self.transaction_dir(transaction_id).join("journal.json"),
            &journal,
        )
    }

    fn read_journal(&self, transaction_id: &str) -> Result<JsonValue, AtomicRealityError> {
        let journal = read_json(&self.transaction_dir(transaction_id).join("journal.json"))?;
        verify_hash(&journal, "integrityHash", "JOURNAL_INTEGRITY_MISMATCH")?;
        if get_string(&journal, "transactionId")? != transaction_id {
            return Err(error("JOURNAL_TRANSACTION_MISMATCH", transaction_id));
        }
        Ok(journal)
    }

    fn prepare_path(&self, transaction_id: &str, domain_id: &str) -> PathBuf {
        self.transaction_dir(transaction_id)
            .join("prepare")
            .join(format!("{}.json", participant_key(domain_id)))
    }

    fn read_prepares(&self, transaction_id: &str) -> Result<Vec<JsonValue>, AtomicRealityError> {
        let directory = self.transaction_dir(transaction_id).join("prepare");
        if !directory.exists() {
            return Ok(Vec::new());
        }
        let mut prepares = fs::read_dir(directory)?
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .filter(|path| path.extension().and_then(|value| value.to_str()) == Some("json"))
            .map(|path| read_json(&path))
            .collect::<Result<Vec<_>, _>>()?;
        prepares.sort_by(|left, right| {
            get_string(left, "domainId")
                .unwrap_or_default()
                .cmp(get_string(right, "domainId").unwrap_or_default())
        });
        for prepare in &prepares {
            verify_hash(prepare, "prepareHash", "PREPARE_HASH_MISMATCH")?;
            if get_string(prepare, "transactionId")? != transaction_id {
                return Err(error("PREPARE_TRANSACTION_MISMATCH", transaction_id));
            }
        }
        Ok(prepares)
    }

    fn projected_global_root(&self, prepares: &[JsonValue]) -> Result<String, AtomicRealityError> {
        let mut states = self.all_states()?;
        for prepare in prepares {
            let domain_id = get_string(prepare, "domainId")?;
            let state = states
                .get_mut(domain_id)
                .ok_or_else(|| error("UNKNOWN_DOMAIN", domain_id))?;
            set_field(
                state,
                "committedRoot",
                string(get_string(prepare, "afterRoot")?),
            )?;
            set_field(state, "revision", number(get_u64(prepare, "nextRevision")?))?;
        }
        Self::global_root_from_states(&states)
    }

    fn apply_prepare(
        &self,
        transaction_id: &str,
        prepare: &JsonValue,
    ) -> Result<(), AtomicRealityError> {
        let domain_id = get_string(prepare, "domainId")?;
        let state = self.read_participant(domain_id)?;
        if get_string(&state, "committedRoot")? != get_string(prepare, "beforeRoot")?
            || get_u64(&state, "revision")? != get_u64(prepare, "baseRevision")?
        {
            return Err(error("PREPARE_BASE_STATE_MISMATCH", domain_id));
        }
        self.write_participant(
            domain_id,
            object(vec![
                ("format", string("rfe.atomic-domain-state.v0.6")),
                ("domainId", string(domain_id)),
                (
                    "authorityProofHash",
                    string(get_string(&state, "authorityProofHash")?),
                ),
                ("revision", number(get_u64(&state, "revision")?)),
                (
                    "committedRoot",
                    string(get_string(&state, "committedRoot")?),
                ),
                ("phase", string("prepared")),
                ("pendingTransactionId", string(transaction_id)),
                ("preparedRoot", string(get_string(prepare, "afterRoot")?)),
                ("prepareHash", string(get_string(prepare, "prepareHash")?)),
            ]),
        )
    }

    fn commit_participant(
        &self,
        transaction_id: &str,
        prepare: &JsonValue,
    ) -> Result<bool, AtomicRealityError> {
        let domain_id = get_string(prepare, "domainId")?;
        let state = self.read_participant(domain_id)?;
        let pending = get_required(&state, "pendingTransactionId")?;
        if get_string(&state, "phase")? == "committed"
            && pending.as_str() == Some(transaction_id)
            && get_string(&state, "committedRoot")? == get_string(prepare, "afterRoot")?
            && get_u64(&state, "revision")? == get_u64(prepare, "nextRevision")?
        {
            return Ok(false);
        }
        if get_string(&state, "phase")? != "prepared"
            || pending.as_str() != Some(transaction_id)
            || get_string(&state, "prepareHash")? != get_string(prepare, "prepareHash")?
        {
            return Err(error("PARTICIPANT_NOT_PREPARED", domain_id));
        }
        self.write_participant(
            domain_id,
            object(vec![
                ("format", string("rfe.atomic-domain-state.v0.6")),
                ("domainId", string(domain_id)),
                (
                    "authorityProofHash",
                    string(get_string(&state, "authorityProofHash")?),
                ),
                ("revision", number(get_u64(prepare, "nextRevision")?)),
                ("committedRoot", string(get_string(prepare, "afterRoot")?)),
                ("phase", string("committed")),
                ("pendingTransactionId", string(transaction_id)),
                ("preparedRoot", string(get_string(prepare, "afterRoot")?)),
                ("prepareHash", string(get_string(prepare, "prepareHash")?)),
            ]),
        )?;
        Ok(true)
    }

    fn stabilize_participant(
        &self,
        transaction_id: &str,
        domain_id: &str,
    ) -> Result<(), AtomicRealityError> {
        let state = self.read_participant(domain_id)?;
        if get_required(&state, "pendingTransactionId")?.as_str() != Some(transaction_id) {
            return Err(error("STABILIZE_TRANSACTION_MISMATCH", domain_id));
        }
        if get_string(&state, "phase")? != "committed" {
            return Err(error("STABILIZE_BEFORE_COMMIT", domain_id));
        }
        self.write_participant(
            domain_id,
            object(vec![
                ("format", string("rfe.atomic-domain-state.v0.6")),
                ("domainId", string(domain_id)),
                (
                    "authorityProofHash",
                    string(get_string(&state, "authorityProofHash")?),
                ),
                ("revision", number(get_u64(&state, "revision")?)),
                (
                    "committedRoot",
                    string(get_string(&state, "committedRoot")?),
                ),
                ("phase", string("stable")),
                ("pendingTransactionId", JsonValue::Null),
                ("preparedRoot", JsonValue::Null),
                ("prepareHash", JsonValue::Null),
            ]),
        )
    }

    fn abort_participant(
        &self,
        transaction_id: &str,
        domain_id: &str,
    ) -> Result<bool, AtomicRealityError> {
        let state = self.read_participant(domain_id)?;
        if get_required(&state, "pendingTransactionId")?.as_str() != Some(transaction_id) {
            return Ok(false);
        }
        if get_string(&state, "phase")? == "committed" {
            return Err(error("ABORT_AFTER_COMMIT_DECISION", domain_id));
        }
        self.write_participant(
            domain_id,
            object(vec![
                ("format", string("rfe.atomic-domain-state.v0.6")),
                ("domainId", string(domain_id)),
                (
                    "authorityProofHash",
                    string(get_string(&state, "authorityProofHash")?),
                ),
                ("revision", number(get_u64(&state, "revision")?)),
                (
                    "committedRoot",
                    string(get_string(&state, "committedRoot")?),
                ),
                ("phase", string("stable")),
                ("pendingTransactionId", JsonValue::Null),
                ("preparedRoot", JsonValue::Null),
                ("prepareHash", JsonValue::Null),
            ]),
        )?;
        Ok(true)
    }

    fn write_receipt(
        &self,
        transaction_id: &str,
        status: &str,
        base_global_root: &str,
        final_global_root: &str,
        decision_hash: Option<&str>,
        participants: Vec<String>,
        recovered: bool,
    ) -> Result<JsonValue, AtomicRealityError> {
        let receipt = with_hash(
            object(vec![
                ("format", string("rfe.atomic-receipt.v0.6")),
                ("transactionId", string(transaction_id)),
                ("status", string(status)),
                ("baseGlobalRoot", string(base_global_root)),
                ("finalGlobalRoot", string(final_global_root)),
                (
                    "decisionHash",
                    decision_hash.map_or(JsonValue::Null, string),
                ),
                ("participantIds", string_array(participants)),
                ("recovered", bool_value(recovered)),
            ]),
            "atomicTransactionReceiptHash",
        )?;
        atomic_write(
            &self.transaction_dir(transaction_id).join("receipt.json"),
            &receipt,
        )?;
        Ok(receipt)
    }

    fn finalize_commit(
        &self,
        transaction_id: &str,
        decision: &JsonValue,
        recovered: bool,
    ) -> Result<JsonValue, AtomicRealityError> {
        verify_hash(decision, "decisionHash", "DECISION_HASH_MISMATCH")?;
        let prepares = self.read_prepares(transaction_id)?;
        let participant_ids = prepares
            .iter()
            .map(|prepare| get_string(prepare, "domainId").map(ToOwned::to_owned))
            .collect::<Result<Vec<_>, _>>()?;
        for domain_id in &participant_ids {
            self.stabilize_participant(transaction_id, domain_id)?;
        }
        let final_global_root = self.current_global_root()?;
        if final_global_root != get_string(decision, "finalGlobalRoot")? {
            return Err(error(
                "FINAL_GLOBAL_ROOT_MISMATCH",
                format!(
                    "expected {}, got {final_global_root}",
                    get_string(decision, "finalGlobalRoot")?
                ),
            ));
        }
        let journal = self.read_journal(transaction_id)?;
        let sequence = get_u64(&journal, "transactionSequence")?;
        self.write_journal(
            transaction_id,
            "committed",
            get_string(&journal, "baseGlobalRoot")?,
            participant_ids.clone(),
            sequence,
        )?;
        self.write_coordinator(sequence, &final_global_root)?;
        self.write_receipt(
            transaction_id,
            "committed",
            get_string(&journal, "baseGlobalRoot")?,
            &final_global_root,
            Some(get_string(decision, "decisionHash")?),
            participant_ids,
            recovered,
        )
    }

    /// Executes one cross-domain transaction until completion or an injected
    /// crash point.
    ///
    /// A durable decision is written only after every participant is prepared.
    /// Once that decision exists, recovery must commit all participants.
    ///
    /// # Errors
    ///
    /// Returns [`AtomicRealityError`] for malformed transactions, conflicting
    /// participant state, integrity failure, or an injected crash point.
    #[allow(clippy::too_many_lines)]
    pub fn execute_transaction(
        &self,
        transaction: &JsonValue,
        crash_point: AtomicCrashPoint,
    ) -> Result<JsonValue, AtomicRealityError> {
        let transaction_id = get_string(transaction, "transactionId")?;
        let directory = self.transaction_dir(transaction_id);
        let receipt_path = directory.join("receipt.json");
        if receipt_path.exists() {
            let receipt = read_json(&receipt_path)?;
            verify_hash(
                &receipt,
                "atomicTransactionReceiptHash",
                "RECEIPT_HASH_MISMATCH",
            )?;
            return Ok(receipt);
        }
        if directory.exists() {
            return Err(error("TRANSACTION_ALREADY_IN_PROGRESS", transaction_id));
        }
        fs::create_dir_all(directory.join("prepare"))?;
        let operations = self.parse_operations(transaction)?;
        let participant_ids = operations
            .iter()
            .map(|(domain_id, _)| domain_id.clone())
            .collect::<Vec<_>>();
        let coordinator = self.read_coordinator()?;
        let sequence = get_u64(&coordinator, "transactionSequence")? + 1;
        let base_global_root = self.current_global_root()?;
        if get_string(&coordinator, "globalRoot")? != base_global_root {
            return Err(error("COORDINATOR_GLOBAL_ROOT_STALE", transaction_id));
        }
        self.write_journal(
            transaction_id,
            "preparing",
            &base_global_root,
            participant_ids.clone(),
            sequence,
        )?;
        self.write_coordinator(sequence, &base_global_root)?;

        let mut prepares = Vec::with_capacity(operations.len());
        for (offset, (domain_id, operation)) in operations.iter().enumerate() {
            let state = self.read_participant(domain_id)?;
            let prepare = self.build_prepare(transaction_id, domain_id, operation, &state)?;
            atomic_write(&self.prepare_path(transaction_id, domain_id), &prepare)?;
            self.apply_prepare(transaction_id, &prepare)?;
            prepares.push(prepare);
            if crash_point == AtomicCrashPoint::AfterPrepare(offset + 1) {
                return Err(error(
                    "ATOMIC_CRASH_INJECTED_AFTER_PREPARE",
                    format!("transaction={transaction_id} prepared={}", offset + 1),
                ));
            }
        }

        let final_global_root = self.projected_global_root(&prepares)?;
        let decision = with_hash(
            object(vec![
                ("format", string("rfe.atomic-commit-decision.v0.6")),
                ("transactionId", string(transaction_id)),
                ("baseGlobalRoot", string(base_global_root.clone())),
                ("finalGlobalRoot", string(final_global_root)),
                (
                    "prepareHashes",
                    string_array(
                        prepares
                            .iter()
                            .map(|prepare| {
                                get_string(prepare, "prepareHash").map(ToOwned::to_owned)
                            })
                            .collect::<Result<Vec<_>, _>>()?,
                    ),
                ),
                ("participantIds", string_array(participant_ids.clone())),
                ("transactionSequence", number(sequence)),
            ]),
            "decisionHash",
        )?;
        atomic_write(&directory.join("decision.json"), &decision)?;
        self.write_journal(
            transaction_id,
            "commit_decided",
            &base_global_root,
            participant_ids,
            sequence,
        )?;

        for (offset, prepare) in prepares.iter().enumerate() {
            self.commit_participant(transaction_id, prepare)?;
            if crash_point == AtomicCrashPoint::AfterCommit(offset + 1) {
                return Err(error(
                    "ATOMIC_CRASH_INJECTED_AFTER_COMMIT",
                    format!("transaction={transaction_id} committed={}", offset + 1),
                ));
            }
        }
        self.finalize_commit(transaction_id, &decision, false)
    }

    /// Recovers an interrupted transaction.
    ///
    /// Without a durable decision every prepared participant is aborted. With a
    /// durable decision every participant is committed. Repeated recovery is
    /// idempotent and returns the existing receipt.
    ///
    /// # Errors
    ///
    /// Returns [`AtomicRealityError`] when journal, prepare, decision, or domain
    /// state integrity cannot be proven.
    pub fn recover(&self, transaction_id: &str) -> Result<JsonValue, AtomicRealityError> {
        let directory = self.transaction_dir(transaction_id);
        if !directory.exists() {
            return Err(error("UNKNOWN_TRANSACTION", transaction_id));
        }
        let receipt_path = directory.join("receipt.json");
        if receipt_path.exists() {
            let receipt = read_json(&receipt_path)?;
            verify_hash(
                &receipt,
                "atomicTransactionReceiptHash",
                "RECEIPT_HASH_MISMATCH",
            )?;
            return Ok(receipt);
        }
        let journal = self.read_journal(transaction_id)?;
        let prepares = self.read_prepares(transaction_id)?;
        let participant_ids = prepares
            .iter()
            .map(|prepare| get_string(prepare, "domainId").map(ToOwned::to_owned))
            .collect::<Result<Vec<_>, _>>()?;
        let decision_path = directory.join("decision.json");
        if !decision_path.exists() {
            let mut aborted = 0_u64;
            for domain_id in &participant_ids {
                if self.abort_participant(transaction_id, domain_id)? {
                    aborted += 1;
                }
            }
            let final_root = self.current_global_root()?;
            if final_root != get_string(&journal, "baseGlobalRoot")? {
                return Err(error("ABORT_CHANGED_GLOBAL_ROOT", transaction_id));
            }
            self.write_journal(
                transaction_id,
                "aborted",
                get_string(&journal, "baseGlobalRoot")?,
                participant_ids.clone(),
                get_u64(&journal, "transactionSequence")?,
            )?;
            let _aborted_participants = aborted;
            self.write_receipt(
                transaction_id,
                "aborted",
                get_string(&journal, "baseGlobalRoot")?,
                &final_root,
                None,
                participant_ids,
                true,
            )
        } else {
            let decision = read_json(&decision_path)?;
            verify_hash(&decision, "decisionHash", "DECISION_HASH_MISMATCH")?;
            let expected_hashes = get_required(&decision, "prepareHashes")?
                .as_array()
                .ok_or_else(|| error("INVALID_DECISION", "prepareHashes must be an array"))?;
            if expected_hashes.len() != prepares.len() {
                return Err(error("DECISION_PREPARE_COUNT_MISMATCH", transaction_id));
            }
            for (expected, prepare) in expected_hashes.iter().zip(&prepares) {
                if expected.as_str() != Some(get_string(prepare, "prepareHash")?) {
                    return Err(error("DECISION_PREPARE_HASH_MISMATCH", transaction_id));
                }
            }
            for prepare in &prepares {
                self.commit_participant(transaction_id, prepare)?;
            }
            self.finalize_commit(transaction_id, &decision, true)
        }
    }

    /// Runs the normative C8 abort-and-recovery acceptance scenario.
    ///
    /// # Errors
    ///
    /// Returns [`AtomicRealityError`] if any atomicity, recovery, integrity, or
    /// idempotence invariant fails.
    #[allow(clippy::too_many_lines)]
    pub fn run_acceptance_scenario(
        &self,
        abort_transaction: &JsonValue,
        commit_transaction: &JsonValue,
    ) -> Result<JsonValue, AtomicRealityError> {
        let initial_global_root = self.current_global_root()?;
        let abort_id = get_string(abort_transaction, "transactionId")?;
        let abort_failure = self
            .execute_transaction(abort_transaction, AtomicCrashPoint::AfterPrepare(2))
            .expect_err("C8 prepare interruption must be injected");
        if abort_failure.code != "ATOMIC_CRASH_INJECTED_AFTER_PREPARE" {
            return Err(abort_failure);
        }
        let abort_receipt = self.recover(abort_id)?;
        if get_string(&abort_receipt, "status")? != "aborted"
            || self.current_global_root()? != initial_global_root
        {
            return Err(error("ABORT_ATOMICITY_FAILED", abort_id));
        }

        let commit_id = get_string(commit_transaction, "transactionId")?;
        let commit_failure = self
            .execute_transaction(commit_transaction, AtomicCrashPoint::AfterCommit(1))
            .expect_err("C8 commit interruption must be injected");
        if commit_failure.code != "ATOMIC_CRASH_INJECTED_AFTER_COMMIT" {
            return Err(commit_failure);
        }
        let states_after_interruption = self.all_states()?;
        let committed_before_recovery = states_after_interruption
            .values()
            .filter(|state| get_string(state, "phase").ok() == Some("committed"))
            .count();
        let prepared_before_recovery = states_after_interruption
            .values()
            .filter(|state| get_string(state, "phase").ok() == Some("prepared"))
            .count();
        let commit_receipt = self.recover(commit_id)?;
        let replay_receipt = self.recover(commit_id)?;
        if commit_receipt.canonical_string() != replay_receipt.canonical_string() {
            return Err(error("RECOVERY_NOT_IDEMPOTENT", commit_id));
        }
        let final_global_root = self.current_global_root()?;
        if get_string(&commit_receipt, "status")? != "committed"
            || final_global_root == initial_global_root
            || final_global_root != get_string(&commit_receipt, "finalGlobalRoot")?
        {
            return Err(error("COMMIT_ATOMICITY_FAILED", commit_id));
        }
        let final_states = self.all_states()?;
        if final_states
            .values()
            .any(|state| get_string(state, "phase").ok() != Some("stable"))
        {
            return Err(error("PARTICIPANT_NOT_STABLE_AFTER_RECOVERY", commit_id));
        }
        let participant_states = object_owned(final_states.into_iter().collect());
        let body = object(vec![
            ("format", string("rfe.cross-domain-atomic-result.v0.6")),
            ("atomicityModel", string("durable-decision-all-or-nothing")),
            ("initialGlobalRoot", string(initial_global_root)),
            ("abortReceipt", abort_receipt),
            (
                "interruptedCommitState",
                object(vec![
                    (
                        "committedParticipants",
                        number(u64::try_from(committed_before_recovery).unwrap_or(u64::MAX)),
                    ),
                    (
                        "preparedParticipants",
                        number(u64::try_from(prepared_before_recovery).unwrap_or(u64::MAX)),
                    ),
                    ("durableDecisionPresent", bool_value(true)),
                ]),
            ),
            ("commitReceipt", commit_receipt),
            ("recoveryReplayReceipt", replay_receipt),
            ("finalGlobalRoot", string(final_global_root)),
            ("participantStates", participant_states),
            (
                "metrics",
                object(vec![
                    ("transactionsAttempted", number(2)),
                    ("transactionsAborted", number(1)),
                    ("transactionsCommitted", number(1)),
                    ("injectedInterruptions", number(2)),
                    ("recoveryPasses", number(3)),
                    ("partialCommitsExposed", number(0)),
                    ("globalRootDivergences", number(0)),
                    ("idempotentRecoveryReplays", number(1)),
                ]),
            ),
        ]);
        with_hash(body, "crossDomainAtomicResultHash")
    }
}
