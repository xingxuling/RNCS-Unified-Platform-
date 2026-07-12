//! Federated reality consensus for RFE v0.7.0.
//!
//! C9 coordinates sovereign C8 reality clusters with weighted quorum
//! certificates while preserving required-cluster approval. A durable quorum
//! certificate is the recovery authority: before it exists, prepared clusters
//! roll back; after it exists, every required cluster converges to the same
//! committed federation root.

use rfe_canonical::{parse_json, sha256_hex, JsonError, JsonValue};
use std::collections::{BTreeMap, BTreeSet};
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::fs;
use std::path::{Path, PathBuf};

/// Stable C9 error.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FederationError {
    /// Machine-readable code.
    pub code: &'static str,
    /// Diagnostic detail.
    pub message: String,
}

impl Display for FederationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}: {}", self.code, self.message)
    }
}

impl Error for FederationError {}

impl From<std::io::Error> for FederationError {
    fn from(value: std::io::Error) -> Self {
        Self {
            code: "IO",
            message: value.to_string(),
        }
    }
}

impl From<JsonError> for FederationError {
    fn from(value: JsonError) -> Self {
        Self {
            code: "INVALID_JSON",
            message: value.to_string(),
        }
    }
}

/// Deterministic interruption points.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FederationCrashPoint {
    /// No interruption.
    None,
    /// Interrupt after N cluster commits.
    AfterCommit(usize),
}

#[derive(Clone, Debug, Default)]
struct Metrics {
    proposals_attempted: u64,
    proposals_aborted: u64,
    proposals_committed: u64,
    quorum_certificates_formed: u64,
    injected_interruptions: u64,
    recovery_passes: u64,
    idempotent_recovery_replays: u64,
    sovereign_vetoes: u64,
    forged_votes_rejected: u64,
    partial_federation_commits_exposed: u64,
    federation_root_divergences: u64,
}

impl Metrics {
    fn to_json(&self) -> JsonValue {
        object(vec![
            ("proposalsAttempted", number(self.proposals_attempted)),
            ("proposalsAborted", number(self.proposals_aborted)),
            ("proposalsCommitted", number(self.proposals_committed)),
            (
                "quorumCertificatesFormed",
                number(self.quorum_certificates_formed),
            ),
            ("injectedInterruptions", number(self.injected_interruptions)),
            ("recoveryPasses", number(self.recovery_passes)),
            (
                "idempotentRecoveryReplays",
                number(self.idempotent_recovery_replays),
            ),
            ("sovereignVetoes", number(self.sovereign_vetoes)),
            ("forgedVotesRejected", number(self.forged_votes_rejected)),
            (
                "partialFederationCommitsExposed",
                number(self.partial_federation_commits_exposed),
            ),
            (
                "federationRootDivergences",
                number(self.federation_root_divergences),
            ),
        ])
    }

    fn from_json(value: &JsonValue) -> Result<Self, FederationError> {
        Ok(Self {
            proposals_attempted: get_u64(value, "proposalsAttempted")?,
            proposals_aborted: get_u64(value, "proposalsAborted")?,
            proposals_committed: get_u64(value, "proposalsCommitted")?,
            quorum_certificates_formed: get_u64(value, "quorumCertificatesFormed")?,
            injected_interruptions: get_u64(value, "injectedInterruptions")?,
            recovery_passes: get_u64(value, "recoveryPasses")?,
            idempotent_recovery_replays: get_u64(value, "idempotentRecoveryReplays")?,
            sovereign_vetoes: get_u64(value, "sovereignVetoes")?,
            forged_votes_rejected: get_u64(value, "forgedVotesRejected")?,
            partial_federation_commits_exposed: get_u64(value, "partialFederationCommitsExposed")?,
            federation_root_divergences: get_u64(value, "federationRootDivergences")?,
        })
    }
}

fn federation_error(code: &'static str, message: impl Into<String>) -> FederationError {
    FederationError {
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

fn get_required<'a>(value: &'a JsonValue, key: &str) -> Result<&'a JsonValue, FederationError> {
    value
        .get(key)
        .ok_or_else(|| federation_error("MISSING_FIELD", format!("missing field: {key}")))
}

fn get_string<'a>(value: &'a JsonValue, key: &str) -> Result<&'a str, FederationError> {
    get_required(value, key)?
        .as_str()
        .ok_or_else(|| federation_error("INVALID_FIELD", format!("field {key} must be a string")))
}

fn get_u64(value: &JsonValue, key: &str) -> Result<u64, FederationError> {
    get_required(value, key)?.as_u64().ok_or_else(|| {
        federation_error(
            "INVALID_FIELD",
            format!("field {key} must be an unsigned integer"),
        )
    })
}

fn get_array<'a>(value: &'a JsonValue, key: &str) -> Result<&'a [JsonValue], FederationError> {
    get_required(value, key)?
        .as_array()
        .ok_or_else(|| federation_error("INVALID_FIELD", format!("field {key} must be an array")))
}

fn set_field(
    value: &mut JsonValue,
    key: &str,
    replacement: JsonValue,
) -> Result<(), FederationError> {
    match value {
        JsonValue::Object(entries) => {
            if let Some((_, current)) = entries.iter_mut().find(|(candidate, _)| candidate == key) {
                *current = replacement;
            } else {
                entries.push((key.to_owned(), replacement));
            }
            Ok(())
        }
        _ => Err(federation_error("INVALID_OBJECT", "expected JSON object")),
    }
}

fn remove_field(value: &mut JsonValue, key: &str) {
    if let JsonValue::Object(entries) = value {
        entries.retain(|(candidate, _)| candidate != key);
    }
}

fn with_hash(mut value: JsonValue, field: &str) -> Result<JsonValue, FederationError> {
    remove_field(&mut value, field);
    let digest = sha256_hex(value.canonical_string().as_bytes());
    set_field(&mut value, field, string(digest))?;
    Ok(value)
}

fn verify_hash(value: &JsonValue, field: &str, code: &'static str) -> Result<(), FederationError> {
    let expected = get_string(value, field)?.to_owned();
    let mut body = value.clone();
    remove_field(&mut body, field);
    let actual = sha256_hex(body.canonical_string().as_bytes());
    if actual == expected {
        Ok(())
    } else {
        Err(federation_error(
            code,
            format!("expected {expected}, got {actual}"),
        ))
    }
}

fn hash_json(value: &JsonValue) -> String {
    sha256_hex(value.canonical_string().as_bytes())
}

fn string_array(values: impl IntoIterator<Item = String>) -> JsonValue {
    JsonValue::Array(values.into_iter().map(string).collect())
}

fn strings(value: &JsonValue, key: &str) -> Result<Vec<String>, FederationError> {
    get_array(value, key)?
        .iter()
        .map(|item| {
            item.as_str()
                .map(ToOwned::to_owned)
                .ok_or_else(|| federation_error("INVALID_STRING_ARRAY", key))
        })
        .collect()
}

fn atomic_write(path: &Path, value: &JsonValue) -> Result<(), FederationError> {
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

/// Durable C9 coordinator.
#[derive(Debug)]
pub struct FederatedRealityCoordinator {
    root: PathBuf,
    clusters: BTreeMap<String, JsonValue>,
    proposals: BTreeMap<String, JsonValue>,
    total_weight: u64,
    quorum_weight: u64,
    proposal_sequence: u64,
    federation_root: String,
    metrics: Metrics,
}

impl FederatedRealityCoordinator {
    /// Creates a federation of three or more sovereign C8 clusters.
    ///
    /// # Errors
    ///
    /// Returns an error for malformed, duplicate, or impossible membership.
    pub fn bootstrap(
        root: impl AsRef<Path>,
        clusters: &JsonValue,
        quorum_weight: u64,
    ) -> Result<Self, FederationError> {
        let root = root.as_ref().to_path_buf();
        if root.exists() {
            fs::remove_dir_all(&root)?;
        }
        fs::create_dir_all(&root)?;
        let seeds = clusters
            .as_array()
            .ok_or_else(|| federation_error("INVALID_CLUSTERS", "clusters must be an array"))?;
        if seeds.len() < 3 {
            return Err(federation_error(
                "INSUFFICIENT_FEDERATION_MEMBERS",
                "C9 requires at least three clusters",
            ));
        }
        let mut states = BTreeMap::new();
        let mut total_weight = 0_u64;
        for seed in seeds {
            let cluster_id = get_string(seed, "clusterId")?.to_owned();
            if states.contains_key(&cluster_id) {
                return Err(federation_error("DUPLICATE_CLUSTER", cluster_id));
            }
            let weight = get_u64(seed, "weight")?;
            if weight == 0 {
                return Err(federation_error("INVALID_CLUSTER_WEIGHT", cluster_id));
            }
            let state = with_hash(
                object(vec![
                    ("format", string("rfe.federated-cluster-state.v0.7")),
                    ("clusterId", string(cluster_id.clone())),
                    ("weight", number(weight)),
                    (
                        "authorityProofHash",
                        string(get_string(seed, "authorityProofHash")?),
                    ),
                    ("policyHash", string(get_string(seed, "policyHash")?)),
                    ("revision", number(0)),
                    ("sovereignRoot", string(get_string(seed, "sovereignRoot")?)),
                    ("phase", string("stable")),
                    ("pendingProposalId", JsonValue::Null),
                    ("preparedRoot", JsonValue::Null),
                    ("prepareHash", JsonValue::Null),
                ]),
                "integrityHash",
            )?;
            states.insert(cluster_id, state);
            total_weight += weight;
        }
        if quorum_weight == 0 || quorum_weight > total_weight {
            return Err(federation_error(
                "INVALID_QUORUM_WEIGHT",
                quorum_weight.to_string(),
            ));
        }
        let mut coordinator = Self {
            root,
            clusters: states,
            proposals: BTreeMap::new(),
            total_weight,
            quorum_weight,
            proposal_sequence: 0,
            federation_root: String::new(),
            metrics: Metrics::default(),
        };
        coordinator.federation_root = coordinator.current_federation_root()?;
        coordinator.persist()?;
        Ok(coordinator)
    }

    /// Reopens a persisted federation checkpoint.
    ///
    /// # Errors
    ///
    /// Returns an error when the checkpoint is absent or fails integrity.
    pub fn open(root: impl AsRef<Path>) -> Result<Self, FederationError> {
        let root = root.as_ref().to_path_buf();
        let snapshot = parse_json(&fs::read_to_string(root.join("federation.json"))?)?;
        verify_hash(
            &snapshot,
            "snapshotHash",
            "FEDERATION_SNAPSHOT_HASH_MISMATCH",
        )?;
        let mut clusters = BTreeMap::new();
        for state in get_array(&snapshot, "clusters")? {
            verify_hash(state, "integrityHash", "CLUSTER_STATE_INTEGRITY_MISMATCH")?;
            clusters.insert(get_string(state, "clusterId")?.to_owned(), state.clone());
        }
        let mut proposals = BTreeMap::new();
        for proposal in get_array(&snapshot, "proposals")? {
            proposals.insert(
                get_string(proposal, "proposalId")?.to_owned(),
                proposal.clone(),
            );
        }
        Ok(Self {
            root,
            clusters,
            proposals,
            total_weight: get_u64(&snapshot, "totalWeight")?,
            quorum_weight: get_u64(&snapshot, "quorumWeight")?,
            proposal_sequence: get_u64(&snapshot, "proposalSequence")?,
            federation_root: get_string(&snapshot, "federationRoot")?.to_owned(),
            metrics: Metrics::from_json(get_required(&snapshot, "metrics")?)?,
        })
    }

    fn snapshot(&self) -> Result<JsonValue, FederationError> {
        with_hash(
            object(vec![
                ("format", string("rfe.federation-checkpoint.v0.7")),
                ("totalWeight", number(self.total_weight)),
                ("quorumWeight", number(self.quorum_weight)),
                ("proposalSequence", number(self.proposal_sequence)),
                ("federationRoot", string(self.federation_root.clone())),
                (
                    "clusters",
                    JsonValue::Array(self.clusters.values().cloned().collect()),
                ),
                (
                    "proposals",
                    JsonValue::Array(self.proposals.values().cloned().collect()),
                ),
                ("metrics", self.metrics.to_json()),
            ]),
            "snapshotHash",
        )
    }

    fn persist(&self) -> Result<(), FederationError> {
        atomic_write(&self.root.join("federation.json"), &self.snapshot()?)
    }

    /// Returns the canonical federation root.
    ///
    /// # Errors
    ///
    /// Returns an error for malformed cluster state.
    pub fn current_federation_root(&self) -> Result<String, FederationError> {
        let summaries = self
            .clusters
            .values()
            .map(|state| {
                Ok(object(vec![
                    ("clusterId", string(get_string(state, "clusterId")?)),
                    ("weight", number(get_u64(state, "weight")?)),
                    ("revision", number(get_u64(state, "revision")?)),
                    ("sovereignRoot", string(get_string(state, "sovereignRoot")?)),
                    (
                        "authorityProofHash",
                        string(get_string(state, "authorityProofHash")?),
                    ),
                    ("policyHash", string(get_string(state, "policyHash")?)),
                ]))
            })
            .collect::<Result<Vec<_>, FederationError>>()?;
        Ok(hash_json(&JsonValue::Array(summaries)))
    }

    /// Returns one cluster's persisted state.
    ///
    /// # Errors
    ///
    /// Returns an error when the cluster is unknown.
    pub fn cluster_state(&self, cluster_id: &str) -> Result<JsonValue, FederationError> {
        self.clusters
            .get(cluster_id)
            .cloned()
            .ok_or_else(|| federation_error("UNKNOWN_CLUSTER", cluster_id))
    }

    fn build_prepare(
        &self,
        proposal_id: &str,
        operation: &JsonValue,
    ) -> Result<JsonValue, FederationError> {
        let cluster_id = get_string(operation, "clusterId")?;
        let state = self
            .clusters
            .get(cluster_id)
            .ok_or_else(|| federation_error("UNKNOWN_CLUSTER", cluster_id))?;
        if get_string(state, "phase")? != "stable" {
            return Err(federation_error("CLUSTER_NOT_STABLE", cluster_id));
        }
        let operation_hash = hash_json(get_required(operation, "operation")?);
        let next_revision = get_u64(state, "revision")? + 1;
        let after_root = hash_json(&object(vec![
            ("clusterId", string(cluster_id)),
            ("beforeRoot", string(get_string(state, "sovereignRoot")?)),
            ("nextRevision", number(next_revision)),
            ("operationHash", string(operation_hash.clone())),
            ("proposalId", string(proposal_id)),
        ]));
        with_hash(
            object(vec![
                ("format", string("rfe.federated-prepare.v0.7")),
                ("proposalId", string(proposal_id)),
                ("clusterId", string(cluster_id)),
                (
                    "authorityProofHash",
                    string(get_string(state, "authorityProofHash")?),
                ),
                ("policyHash", string(get_string(state, "policyHash")?)),
                ("baseRevision", number(get_u64(state, "revision")?)),
                ("nextRevision", number(next_revision)),
                ("beforeRoot", string(get_string(state, "sovereignRoot")?)),
                ("afterRoot", string(after_root)),
                ("operationHash", string(operation_hash)),
            ]),
            "prepareHash",
        )
    }

    fn apply_prepare(
        &mut self,
        proposal_id: &str,
        prepare: &JsonValue,
    ) -> Result<(), FederationError> {
        let cluster_id = get_string(prepare, "clusterId")?.to_owned();
        let mut state = self
            .clusters
            .get(&cluster_id)
            .cloned()
            .ok_or_else(|| federation_error("UNKNOWN_CLUSTER", &cluster_id))?;
        set_field(&mut state, "phase", string("prepared"))?;
        set_field(&mut state, "pendingProposalId", string(proposal_id))?;
        set_field(
            &mut state,
            "preparedRoot",
            string(get_string(prepare, "afterRoot")?),
        )?;
        set_field(
            &mut state,
            "prepareHash",
            string(get_string(prepare, "prepareHash")?),
        )?;
        self.clusters
            .insert(cluster_id, with_hash(state, "integrityHash")?);
        Ok(())
    }

    fn abort_prepare(
        &mut self,
        proposal_id: &str,
        prepare: &JsonValue,
    ) -> Result<(), FederationError> {
        let cluster_id = get_string(prepare, "clusterId")?.to_owned();
        let mut state = self
            .clusters
            .get(&cluster_id)
            .cloned()
            .ok_or_else(|| federation_error("UNKNOWN_CLUSTER", &cluster_id))?;
        if get_required(&state, "pendingProposalId")?.as_str() != Some(proposal_id) {
            return Ok(());
        }
        set_field(&mut state, "phase", string("stable"))?;
        set_field(&mut state, "pendingProposalId", JsonValue::Null)?;
        set_field(&mut state, "preparedRoot", JsonValue::Null)?;
        set_field(&mut state, "prepareHash", JsonValue::Null)?;
        self.clusters
            .insert(cluster_id, with_hash(state, "integrityHash")?);
        Ok(())
    }

    fn commit_prepare(
        &mut self,
        proposal_id: &str,
        prepare: &JsonValue,
    ) -> Result<(), FederationError> {
        let cluster_id = get_string(prepare, "clusterId")?.to_owned();
        let mut state = self
            .clusters
            .get(&cluster_id)
            .cloned()
            .ok_or_else(|| federation_error("UNKNOWN_CLUSTER", &cluster_id))?;
        if get_u64(&state, "revision")? == get_u64(prepare, "nextRevision")?
            && get_string(&state, "sovereignRoot")? == get_string(prepare, "afterRoot")?
        {
            return Ok(());
        }
        if get_required(&state, "pendingProposalId")?.as_str() != Some(proposal_id) {
            return Err(federation_error("PREPARE_OWNERSHIP_MISMATCH", cluster_id));
        }
        if get_required(&state, "prepareHash")?.as_str()
            != Some(get_string(prepare, "prepareHash")?)
        {
            return Err(federation_error("PREPARE_HASH_MISMATCH", cluster_id));
        }
        set_field(
            &mut state,
            "revision",
            number(get_u64(prepare, "nextRevision")?),
        )?;
        set_field(
            &mut state,
            "sovereignRoot",
            string(get_string(prepare, "afterRoot")?),
        )?;
        set_field(&mut state, "phase", string("stable"))?;
        set_field(&mut state, "pendingProposalId", JsonValue::Null)?;
        set_field(&mut state, "preparedRoot", JsonValue::Null)?;
        set_field(&mut state, "prepareHash", JsonValue::Null)?;
        self.clusters
            .insert(cluster_id, with_hash(state, "integrityHash")?);
        Ok(())
    }

    fn append_proposal_array(
        proposal: &mut JsonValue,
        key: &str,
        value: JsonValue,
    ) -> Result<(), FederationError> {
        get_required(proposal, key)?
            .as_array()
            .ok_or_else(|| federation_error("INVALID_PROPOSAL_ARRAY", key))?;
        match proposal.get_mut(key) {
            Some(JsonValue::Array(values)) => {
                values.push(value);
                Ok(())
            }
            _ => Err(federation_error("INVALID_PROPOSAL_ARRAY", key)),
        }
    }

    fn register_vote(
        &mut self,
        proposal: &mut JsonValue,
        vote: &JsonValue,
    ) -> Result<(), FederationError> {
        let cluster_id = get_string(vote, "clusterId")?;
        if get_array(proposal, "votes")?
            .iter()
            .any(|current| get_string(current, "clusterId").ok() == Some(cluster_id))
        {
            return Err(federation_error("DUPLICATE_FEDERATION_VOTE", cluster_id));
        }
        let expected_proposal_hash = get_string(proposal, "proposalHash")?;
        if let Some(supplied) = vote.get("proposalHash") {
            if supplied.as_str() != Some(expected_proposal_hash) {
                self.metrics.forged_votes_rejected += 1;
                return Err(federation_error("VOTE_PROPOSAL_HASH_MISMATCH", cluster_id));
            }
        }
        let state = self
            .clusters
            .get(cluster_id)
            .ok_or_else(|| federation_error("UNKNOWN_CLUSTER", cluster_id))?;
        let expected_authority = get_string(state, "authorityProofHash")?;
        if let Some(supplied) = vote.get("authorityProofHash") {
            if supplied.as_str() != Some(expected_authority) {
                self.metrics.forged_votes_rejected += 1;
                return Err(federation_error(
                    "VOTE_AUTHORITY_PROOF_MISMATCH",
                    cluster_id,
                ));
            }
        }
        let expected_policy = get_string(state, "policyHash")?;
        if let Some(supplied) = vote.get("policyHash") {
            if supplied.as_str() != Some(expected_policy) {
                self.metrics.forged_votes_rejected += 1;
                return Err(federation_error("VOTE_POLICY_HASH_MISMATCH", cluster_id));
            }
        }
        let normalized = with_hash(
            object(vec![
                ("format", string("rfe.federation-vote.v0.7")),
                ("proposalId", string(get_string(proposal, "proposalId")?)),
                (
                    "proposalHash",
                    string(get_string(proposal, "proposalHash")?),
                ),
                ("clusterId", string(cluster_id)),
                ("decision", string(get_string(vote, "decision")?)),
                ("weight", number(get_u64(state, "weight")?)),
                (
                    "authorityProofHash",
                    string(get_string(state, "authorityProofHash")?),
                ),
                ("policyHash", string(get_string(state, "policyHash")?)),
            ]),
            "voteHash",
        )?;
        Self::append_proposal_array(proposal, "votes", normalized)
    }

    fn approval_weight(&self, proposal: &JsonValue) -> Result<u64, FederationError> {
        get_array(proposal, "votes")?
            .iter()
            .filter(|vote| get_string(vote, "decision").ok() == Some("approve"))
            .try_fold(0_u64, |sum, vote| Ok(sum + get_u64(vote, "weight")?))
    }

    fn required_approvals_present(&self, proposal: &JsonValue) -> Result<bool, FederationError> {
        let votes = get_array(proposal, "votes")?;
        Ok(strings(proposal, "requiredClusterIds")?
            .iter()
            .all(|required| {
                votes.iter().any(|vote| {
                    get_string(vote, "clusterId").ok() == Some(required.as_str())
                        && get_string(vote, "decision").ok() == Some("approve")
                })
            }))
    }

    fn required_veto_present(&self, proposal: &JsonValue) -> Result<bool, FederationError> {
        let votes = get_array(proposal, "votes")?;
        Ok(strings(proposal, "requiredClusterIds")?
            .iter()
            .any(|required| {
                votes.iter().any(|vote| {
                    get_string(vote, "clusterId").ok() == Some(required.as_str())
                        && get_string(vote, "decision").ok() == Some("reject")
                })
            }))
    }

    fn projected_federation_root(&self, prepares: &[JsonValue]) -> Result<String, FederationError> {
        let mut summaries = Vec::with_capacity(self.clusters.len());
        for state in self.clusters.values() {
            let cluster_id = get_string(state, "clusterId")?;
            let prepare = prepares
                .iter()
                .find(|item| get_string(item, "clusterId").ok() == Some(cluster_id));
            summaries.push(object(vec![
                ("clusterId", string(cluster_id)),
                ("weight", number(get_u64(state, "weight")?)),
                (
                    "revision",
                    number(match prepare {
                        Some(value) => get_u64(value, "nextRevision")?,
                        None => get_u64(state, "revision")?,
                    }),
                ),
                (
                    "sovereignRoot",
                    string(match prepare {
                        Some(value) => get_string(value, "afterRoot")?,
                        None => get_string(state, "sovereignRoot")?,
                    }),
                ),
                (
                    "authorityProofHash",
                    string(get_string(state, "authorityProofHash")?),
                ),
                ("policyHash", string(get_string(state, "policyHash")?)),
            ]));
        }
        Ok(hash_json(&JsonValue::Array(summaries)))
    }

    fn form_decision(&mut self, proposal: &JsonValue) -> Result<JsonValue, FederationError> {
        if self.required_veto_present(proposal)? {
            self.metrics.sovereign_vetoes += 1;
            return Ok(JsonValue::Null);
        }
        let approval_weight = self.approval_weight(proposal)?;
        if approval_weight < self.quorum_weight || !self.required_approvals_present(proposal)? {
            return Ok(JsonValue::Null);
        }
        let prepares = get_array(proposal, "prepares")?;
        let mut approvals = get_array(proposal, "votes")?
            .iter()
            .filter(|vote| get_string(vote, "decision").ok() == Some("approve"))
            .cloned()
            .collect::<Vec<_>>();
        approvals.sort_by(|left, right| {
            get_string(left, "clusterId")
                .unwrap_or_default()
                .cmp(get_string(right, "clusterId").unwrap_or_default())
        });
        let decision = with_hash(
            object(vec![
                ("format", string("rfe.federation-commit-decision.v0.7")),
                ("proposalId", string(get_string(proposal, "proposalId")?)),
                (
                    "proposalHash",
                    string(get_string(proposal, "proposalHash")?),
                ),
                (
                    "baseFederationRoot",
                    string(get_string(proposal, "baseFederationRoot")?),
                ),
                (
                    "finalFederationRoot",
                    string(self.projected_federation_root(prepares)?),
                ),
                ("quorumWeight", number(self.quorum_weight)),
                ("approvalWeight", number(approval_weight)),
                (
                    "requiredClusterIds",
                    string_array(strings(proposal, "requiredClusterIds")?),
                ),
                (
                    "prepareHashes",
                    string_array(
                        prepares
                            .iter()
                            .map(|prepare| {
                                get_string(prepare, "prepareHash").map(ToOwned::to_owned)
                            })
                            .collect::<Result<Vec<_>, FederationError>>()?,
                    ),
                ),
                (
                    "voteHashes",
                    string_array(
                        approvals
                            .iter()
                            .map(|vote| get_string(vote, "voteHash").map(ToOwned::to_owned))
                            .collect::<Result<Vec<_>, FederationError>>()?,
                    ),
                ),
                ("proposalSequence", number(get_u64(proposal, "sequence")?)),
            ]),
            "quorumCertificateHash",
        )?;
        self.metrics.quorum_certificates_formed += 1;
        Ok(decision)
    }

    fn receipt(
        &self,
        proposal: &JsonValue,
        status: &str,
        recovered: bool,
    ) -> Result<JsonValue, FederationError> {
        let decision = get_required(proposal, "decision")?;
        let decision_present = !matches!(decision, JsonValue::Null);
        with_hash(
            object(vec![
                ("format", string("rfe.federation-receipt.v0.7")),
                ("proposalId", string(get_string(proposal, "proposalId")?)),
                ("status", string(status)),
                (
                    "baseFederationRoot",
                    string(get_string(proposal, "baseFederationRoot")?),
                ),
                (
                    "finalFederationRoot",
                    string(self.current_federation_root()?),
                ),
                (
                    "quorumCertificateHash",
                    if decision_present {
                        string(get_string(decision, "quorumCertificateHash")?)
                    } else {
                        JsonValue::Null
                    },
                ),
                (
                    "approvalWeight",
                    number(if decision_present {
                        get_u64(decision, "approvalWeight")?
                    } else {
                        self.approval_weight(proposal)?
                    }),
                ),
                ("quorumWeight", number(self.quorum_weight)),
                (
                    "requiredClusterIds",
                    string_array(strings(proposal, "requiredClusterIds")?),
                ),
                ("recovered", bool_value(recovered)),
            ]),
            "federationReceiptHash",
        )
    }

    fn finalize_commit(
        &mut self,
        proposal_id: &str,
        recovered: bool,
    ) -> Result<JsonValue, FederationError> {
        let mut proposal = self
            .proposals
            .get(proposal_id)
            .cloned()
            .ok_or_else(|| federation_error("UNKNOWN_PROPOSAL", proposal_id))?;
        let current_root = self.current_federation_root()?;
        let decision = get_required(&proposal, "decision")?;
        if current_root != get_string(decision, "finalFederationRoot")? {
            self.metrics.federation_root_divergences += 1;
            return Err(federation_error(
                "FEDERATION_FINAL_ROOT_MISMATCH",
                proposal_id,
            ));
        }
        self.federation_root.clone_from(&current_root);
        if matches!(get_required(&proposal, "receipt")?, JsonValue::Null) {
            self.metrics.proposals_committed += 1;
        }
        let receipt = self.receipt(&proposal, "committed", recovered)?;
        set_field(&mut proposal, "receipt", receipt.clone())?;
        self.proposals.insert(proposal_id.to_owned(), proposal);
        self.persist()?;
        Ok(receipt)
    }

    /// Executes one federated proposal and persists every transition.
    ///
    /// # Errors
    ///
    /// Returns validation, quorum, persistence, or injected crash errors.
    pub fn execute_proposal(
        &mut self,
        transaction: &JsonValue,
        crash_point: FederationCrashPoint,
    ) -> Result<JsonValue, FederationError> {
        let proposal_id = get_string(transaction, "proposalId")?.to_owned();
        if self.proposals.contains_key(&proposal_id) {
            return Err(federation_error("DUPLICATE_PROPOSAL_ID", proposal_id));
        }
        if self.federation_root != self.current_federation_root()? {
            return Err(federation_error("FEDERATION_ROOT_STALE", proposal_id));
        }
        let mut operations = get_array(transaction, "operations")?.to_vec();
        operations.sort_by(|left, right| {
            get_string(left, "clusterId")
                .unwrap_or_default()
                .cmp(get_string(right, "clusterId").unwrap_or_default())
        });
        if operations.len() < 2 {
            return Err(federation_error(
                "INSUFFICIENT_FEDERATION_SCOPE",
                proposal_id,
            ));
        }
        let mut unique = BTreeSet::new();
        for operation in &operations {
            let cluster_id = get_string(operation, "clusterId")?;
            if !unique.insert(cluster_id.to_owned()) {
                return Err(federation_error("DUPLICATE_CLUSTER_OPERATION", cluster_id));
            }
        }
        let mut required_cluster_ids = strings(transaction, "requiredClusterIds")?;
        required_cluster_ids.sort();
        for required in &required_cluster_ids {
            if !operations
                .iter()
                .any(|operation| get_string(operation, "clusterId").ok() == Some(required.as_str()))
            {
                return Err(federation_error(
                    "REQUIRED_CLUSTER_WITHOUT_OPERATION",
                    required,
                ));
            }
        }
        self.proposal_sequence += 1;
        self.metrics.proposals_attempted += 1;
        let operation_hashes = operations
            .iter()
            .map(|operation| {
                Ok(object(vec![
                    ("clusterId", string(get_string(operation, "clusterId")?)),
                    (
                        "operationHash",
                        string(hash_json(get_required(operation, "operation")?)),
                    ),
                ]))
            })
            .collect::<Result<Vec<_>, FederationError>>()?;
        let proposal_body = object(vec![
            ("format", string("rfe.federation-proposal.v0.7")),
            ("proposalId", string(proposal_id.clone())),
            (
                "baseFederationRoot",
                string(self.current_federation_root()?),
            ),
            (
                "requiredClusterIds",
                string_array(required_cluster_ids.clone()),
            ),
            ("operationHashes", JsonValue::Array(operation_hashes)),
            ("proposalSequence", number(self.proposal_sequence)),
        ]);
        let proposal_hash = hash_json(&proposal_body);
        let offline_clusters = transaction
            .get("offlineClusters")
            .cloned()
            .unwrap_or_else(|| JsonValue::Array(Vec::new()));
        let mut proposal = object(vec![
            ("format", string("rfe.federation-proposal-state.v0.7")),
            ("proposalId", string(proposal_id.clone())),
            (
                "baseFederationRoot",
                string(get_string(&proposal_body, "baseFederationRoot")?),
            ),
            (
                "requiredClusterIds",
                string_array(required_cluster_ids.clone()),
            ),
            ("operations", JsonValue::Array(operations.clone())),
            ("proposalHash", string(proposal_hash)),
            ("sequence", number(self.proposal_sequence)),
            ("votes", JsonValue::Array(Vec::new())),
            ("prepares", JsonValue::Array(Vec::new())),
            ("decision", JsonValue::Null),
            ("receipt", JsonValue::Null),
            ("offlineClusters", offline_clusters),
        ]);
        self.proposals.insert(proposal_id.clone(), proposal.clone());
        self.persist()?;

        for operation in &operations {
            let prepare = self.build_prepare(&proposal_id, operation)?;
            self.apply_prepare(&proposal_id, &prepare)?;
            Self::append_proposal_array(&mut proposal, "prepares", prepare)?;
            self.proposals.insert(proposal_id.clone(), proposal.clone());
            self.persist()?;
        }
        for vote in get_array(transaction, "votes")? {
            self.register_vote(&mut proposal, vote)?;
            self.proposals.insert(proposal_id.clone(), proposal.clone());
            self.persist()?;
        }
        let decision = self.form_decision(&proposal)?;
        set_field(&mut proposal, "decision", decision.clone())?;
        self.proposals.insert(proposal_id.clone(), proposal.clone());
        self.persist()?;
        if matches!(decision, JsonValue::Null) {
            return Ok(proposal);
        }
        let prepares = get_array(&proposal, "prepares")?.to_vec();
        for (index, prepare) in prepares.iter().enumerate() {
            self.commit_prepare(&proposal_id, prepare)?;
            self.persist()?;
            if crash_point == FederationCrashPoint::AfterCommit(index + 1) {
                self.metrics.injected_interruptions += 1;
                self.persist()?;
                return Err(federation_error(
                    "FEDERATION_CRASH_INJECTED_AFTER_COMMIT",
                    (index + 1).to_string(),
                ));
            }
        }
        self.finalize_commit(&proposal_id, false)
    }

    /// Recovers one persisted proposal.
    ///
    /// # Errors
    ///
    /// Returns integrity or persistence errors.
    pub fn recover(&mut self, proposal_id: &str) -> Result<JsonValue, FederationError> {
        self.metrics.recovery_passes += 1;
        let mut proposal = self
            .proposals
            .get(proposal_id)
            .cloned()
            .ok_or_else(|| federation_error("UNKNOWN_PROPOSAL", proposal_id))?;
        if !matches!(get_required(&proposal, "receipt")?, JsonValue::Null) {
            self.metrics.idempotent_recovery_replays += 1;
            self.persist()?;
            return Ok(get_required(&proposal, "receipt")?.clone());
        }
        let prepares = get_array(&proposal, "prepares")?.to_vec();
        if matches!(get_required(&proposal, "decision")?, JsonValue::Null) {
            for prepare in &prepares {
                self.abort_prepare(proposal_id, prepare)?;
            }
            if self.current_federation_root()? != get_string(&proposal, "baseFederationRoot")? {
                return Err(federation_error(
                    "ABORT_CHANGED_FEDERATION_ROOT",
                    proposal_id,
                ));
            }
            self.metrics.proposals_aborted += 1;
            let receipt = self.receipt(&proposal, "aborted", true)?;
            set_field(&mut proposal, "receipt", receipt.clone())?;
            self.proposals.insert(proposal_id.to_owned(), proposal);
            self.persist()?;
            return Ok(receipt);
        }
        let decision = get_required(&proposal, "decision")?;
        let expected_hashes = get_array(decision, "prepareHashes")?;
        if expected_hashes.len() != prepares.len() {
            return Err(federation_error(
                "DECISION_PREPARE_COUNT_MISMATCH",
                proposal_id,
            ));
        }
        for (expected, prepare) in expected_hashes.iter().zip(&prepares) {
            if expected.as_str() != Some(get_string(prepare, "prepareHash")?) {
                return Err(federation_error(
                    "DECISION_PREPARE_HASH_MISMATCH",
                    proposal_id,
                ));
            }
            self.commit_prepare(proposal_id, prepare)?;
            self.persist()?;
        }
        self.finalize_commit(proposal_id, true)
    }

    /// Executes the frozen C9 acceptance scenario.
    ///
    /// # Errors
    ///
    /// Returns any proposal, recovery, or persistence failure.
    pub fn run_acceptance_scenario(
        &mut self,
        no_quorum: &JsonValue,
        commit: &JsonValue,
    ) -> Result<JsonValue, FederationError> {
        let initial_federation_root = self.current_federation_root()?;
        let undecided = self.execute_proposal(no_quorum, FederationCrashPoint::None)?;
        if !matches!(get_required(&undecided, "decision")?, JsonValue::Null) {
            return Err(federation_error(
                "UNEXPECTED_QUORUM_CERTIFICATE",
                "no quorum",
            ));
        }
        let abort_receipt = self.recover(get_string(no_quorum, "proposalId")?)?;
        let commit_id = get_string(commit, "proposalId")?;
        let crash = self
            .execute_proposal(commit, FederationCrashPoint::AfterCommit(1))
            .expect_err("C9 scenario requires injected interruption");
        if crash.code != "FEDERATION_CRASH_INJECTED_AFTER_COMMIT" {
            return Err(crash);
        }
        let proposal = self
            .proposals
            .get(commit_id)
            .cloned()
            .ok_or_else(|| federation_error("UNKNOWN_PROPOSAL", commit_id))?;
        let prepares = get_array(&proposal, "prepares")?;
        let committed_clusters = prepares
            .iter()
            .filter(|prepare| {
                let state = self
                    .clusters
                    .get(get_string(prepare, "clusterId").unwrap_or_default());
                state.is_some_and(|state| {
                    get_u64(state, "revision").ok() == get_u64(prepare, "nextRevision").ok()
                        && get_string(state, "sovereignRoot").ok()
                            == get_string(prepare, "afterRoot").ok()
                })
            })
            .count() as u64;
        let prepared_clusters = prepares
            .iter()
            .filter(|prepare| {
                self.clusters
                    .get(get_string(prepare, "clusterId").unwrap_or_default())
                    .is_some_and(|state| get_string(state, "phase").ok() == Some("prepared"))
            })
            .count() as u64;
        let decision = get_required(&proposal, "decision")?;
        let interrupted = object(vec![
            ("committedClusters", number(committed_clusters)),
            ("preparedClusters", number(prepared_clusters)),
            (
                "durableQuorumCertificatePresent",
                bool_value(!matches!(decision, JsonValue::Null)),
            ),
            (
                "approvalWeight",
                number(get_u64(decision, "approvalWeight")?),
            ),
            ("quorumWeight", number(self.quorum_weight)),
        ]);
        let commit_receipt = self.recover(commit_id)?;
        let replay_receipt = self.recover(commit_id)?;
        let cluster_states = object_owned(
            self.clusters
                .iter()
                .map(|(cluster_id, state)| (cluster_id.clone(), state.clone()))
                .collect(),
        );
        let result = object(vec![
            (
                "format",
                string("rfe.federated-reality-consensus-result.v0.7"),
            ),
            (
                "consensusModel",
                string("weighted-quorum-with-required-sovereign-approval"),
            ),
            ("totalWeight", number(self.total_weight)),
            ("quorumWeight", number(self.quorum_weight)),
            ("initialFederationRoot", string(initial_federation_root)),
            ("abortReceipt", abort_receipt),
            ("interruptedCommitState", interrupted),
            ("commitReceipt", commit_receipt),
            ("recoveryReplayReceipt", replay_receipt),
            (
                "finalFederationRoot",
                string(self.current_federation_root()?),
            ),
            (
                "offlineClusters",
                commit
                    .get("offlineClusters")
                    .cloned()
                    .unwrap_or_else(|| JsonValue::Array(Vec::new())),
            ),
            ("clusterStates", cluster_states),
            ("metrics", self.metrics.to_json()),
        ]);
        with_hash(result, "federatedRealityConsensusResultHash")
    }
}
