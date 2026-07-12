//! Partition-healing federated reality for RFE v0.9.0.
//!
//! C11 adds weighted timeout certificates, view changes, prepared-lock
//! preservation, deterministic conflict rejection, partition observation and
//! durable partial-commit recovery while preserving C1-C10.

use rfe_canonical::{parse_json, sha256_hex, JsonError, JsonValue};
use std::collections::{BTreeMap, BTreeSet};
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::fs;
use std::path::{Path, PathBuf};

/// Stable C11 error with machine-readable code and JSON-compatible detail.
#[derive(Clone, Debug, PartialEq)]
pub struct PartitionError {
    /// Machine-readable code.
    pub code: &'static str,
    /// JSON detail preserved in conformance evidence.
    pub detail: JsonValue,
}

impl Display for PartitionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}: {}", self.code, self.detail.canonical_string())
    }
}

impl Error for PartitionError {}

impl From<std::io::Error> for PartitionError {
    fn from(value: std::io::Error) -> Self {
        Self {
            code: "IO",
            detail: string(value.to_string()),
        }
    }
}

impl From<JsonError> for PartitionError {
    fn from(value: JsonError) -> Self {
        Self {
            code: "INVALID_JSON",
            detail: string(value.to_string()),
        }
    }
}

/// Deterministic interruption points.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PartitionCrashPoint {
    /// No interruption.
    None,
    /// Interrupt after N operation-cluster commits.
    AfterCommit(usize),
}

#[derive(Clone, Debug, Default)]
struct Metrics {
    partition_observations: u64,
    partition_stalls_observed: u64,
    healed_partitions: u64,
    prepare_votes_accepted: u64,
    commit_votes_accepted: u64,
    timeout_votes_accepted: u64,
    prepare_certificates_formed: u64,
    timeout_certificates_formed: u64,
    commit_certificates_formed: u64,
    view_changes: u64,
    locked_changes_reproposed: u64,
    locked_conflict_rejections: u64,
    stale_view_messages_rejected: u64,
    forged_votes_rejected: u64,
    equivocations_detected: u64,
    quarantined_weight: u64,
    recoveries: u64,
    idempotent_recovery_replays: u64,
    injected_interruptions: u64,
    federation_root_divergences: u64,
}

impl Metrics {
    fn to_json(&self) -> JsonValue {
        object(vec![
            ("partitionObservations", number(self.partition_observations)),
            ("partitionStallsObserved", number(self.partition_stalls_observed)),
            ("healedPartitions", number(self.healed_partitions)),
            ("prepareVotesAccepted", number(self.prepare_votes_accepted)),
            ("commitVotesAccepted", number(self.commit_votes_accepted)),
            ("timeoutVotesAccepted", number(self.timeout_votes_accepted)),
            ("prepareCertificatesFormed", number(self.prepare_certificates_formed)),
            ("timeoutCertificatesFormed", number(self.timeout_certificates_formed)),
            ("commitCertificatesFormed", number(self.commit_certificates_formed)),
            ("viewChanges", number(self.view_changes)),
            ("lockedChangesReproposed", number(self.locked_changes_reproposed)),
            ("lockedConflictRejections", number(self.locked_conflict_rejections)),
            ("staleViewMessagesRejected", number(self.stale_view_messages_rejected)),
            ("forgedVotesRejected", number(self.forged_votes_rejected)),
            ("equivocationsDetected", number(self.equivocations_detected)),
            ("quarantinedWeight", number(self.quarantined_weight)),
            ("recoveries", number(self.recoveries)),
            ("idempotentRecoveryReplays", number(self.idempotent_recovery_replays)),
            ("injectedInterruptions", number(self.injected_interruptions)),
            ("federationRootDivergences", number(self.federation_root_divergences)),
        ])
    }

    fn from_json(value: &JsonValue) -> Result<Self, PartitionError> {
        Ok(Self {
            partition_observations: get_u64(value, "partitionObservations")?,
            partition_stalls_observed: get_u64(value, "partitionStallsObserved")?,
            healed_partitions: get_u64(value, "healedPartitions")?,
            prepare_votes_accepted: get_u64(value, "prepareVotesAccepted")?,
            commit_votes_accepted: get_u64(value, "commitVotesAccepted")?,
            timeout_votes_accepted: get_u64(value, "timeoutVotesAccepted")?,
            prepare_certificates_formed: get_u64(value, "prepareCertificatesFormed")?,
            timeout_certificates_formed: get_u64(value, "timeoutCertificatesFormed")?,
            commit_certificates_formed: get_u64(value, "commitCertificatesFormed")?,
            view_changes: get_u64(value, "viewChanges")?,
            locked_changes_reproposed: get_u64(value, "lockedChangesReproposed")?,
            locked_conflict_rejections: get_u64(value, "lockedConflictRejections")?,
            stale_view_messages_rejected: get_u64(value, "staleViewMessagesRejected")?,
            forged_votes_rejected: get_u64(value, "forgedVotesRejected")?,
            equivocations_detected: get_u64(value, "equivocationsDetected")?,
            quarantined_weight: get_u64(value, "quarantinedWeight")?,
            recoveries: get_u64(value, "recoveries")?,
            idempotent_recovery_replays: get_u64(value, "idempotentRecoveryReplays")?,
            injected_interruptions: get_u64(value, "injectedInterruptions")?,
            federation_root_divergences: get_u64(value, "federationRootDivergences")?,
        })
    }
}

fn error(code: &'static str, detail: JsonValue) -> PartitionError {
    PartitionError { code, detail }
}

fn object(entries: Vec<(&str, JsonValue)>) -> JsonValue {
    JsonValue::Object(entries.into_iter().map(|(key, value)| (key.to_owned(), value)).collect())
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

fn required<'a>(value: &'a JsonValue, key: &str) -> Result<&'a JsonValue, PartitionError> {
    value.get(key).ok_or_else(|| error("MISSING_FIELD", string(key)))
}

fn get_string<'a>(value: &'a JsonValue, key: &str) -> Result<&'a str, PartitionError> {
    required(value, key)?.as_str().ok_or_else(|| error("INVALID_FIELD", string(key)))
}

fn get_u64(value: &JsonValue, key: &str) -> Result<u64, PartitionError> {
    required(value, key)?.as_u64().ok_or_else(|| error("INVALID_FIELD", string(key)))
}

fn get_bool(value: &JsonValue, key: &str) -> Result<bool, PartitionError> {
    match required(value, key)? {
        JsonValue::Bool(value) => Ok(*value),
        _ => Err(error("INVALID_FIELD", string(key))),
    }
}

fn get_array<'a>(value: &'a JsonValue, key: &str) -> Result<&'a [JsonValue], PartitionError> {
    required(value, key)?.as_array().ok_or_else(|| error("INVALID_FIELD", string(key)))
}

fn strings(value: &JsonValue, key: &str) -> Result<Vec<String>, PartitionError> {
    get_array(value, key)?.iter().map(|item| {
        item.as_str().map(ToOwned::to_owned).ok_or_else(|| error("INVALID_FIELD", string(key)))
    }).collect()
}

fn set_field(value: &mut JsonValue, key: &str, replacement: JsonValue) -> Result<(), PartitionError> {
    match value {
        JsonValue::Object(entries) => {
            if let Some((_, current)) = entries.iter_mut().find(|(candidate, _)| candidate == key) {
                *current = replacement;
            } else {
                entries.push((key.to_owned(), replacement));
            }
            Ok(())
        }
        _ => Err(error("INVALID_OBJECT", string(key))),
    }
}

fn remove_field(value: &mut JsonValue, key: &str) {
    if let JsonValue::Object(entries) = value {
        entries.retain(|(candidate, _)| candidate != key);
    }
}

fn hash_json(value: &JsonValue) -> String {
    sha256_hex(value.canonical_string().as_bytes())
}

fn with_hash(mut value: JsonValue, field: &str) -> Result<JsonValue, PartitionError> {
    remove_field(&mut value, field);
    let digest = hash_json(&value);
    set_field(&mut value, field, string(digest))?;
    Ok(value)
}

fn keyed_proof(body: &JsonValue, verifier_key: &str) -> String {
    hash_json(&object(vec![
        ("format", string("rfe.partition-healing-keyed-proof.v0.9")),
        ("body", body.clone()),
        ("verifierKey", string(verifier_key)),
    ]))
}

fn sorted_values(map: &BTreeMap<String, JsonValue>) -> Vec<JsonValue> {
    map.values().cloned().collect()
}

fn public_cluster_state(state: &JsonValue) -> Result<JsonValue, PartitionError> {
    Ok(object(vec![
        ("clusterId", string(get_string(state, "clusterId")?)),
        ("weight", number(get_u64(state, "weight")?)),
        ("revision", number(get_u64(state, "revision")?)),
        ("sovereignRoot", string(get_string(state, "sovereignRoot")?)),
        ("authorityProofHash", string(get_string(state, "authorityProofHash")?)),
        ("policyHash", string(get_string(state, "policyHash")?)),
        ("identityCommitment", string(get_string(state, "identityCommitment")?)),
        ("quarantined", required(state, "quarantined")?.clone()),
        ("quarantineEvidenceHash", required(state, "quarantineEvidenceHash")?.clone()),
        ("phase", string(get_string(state, "phase")?)),
        ("pendingCommitCertificateHash", required(state, "pendingCommitCertificateHash")?.clone()),
        ("preparedRoot", required(state, "preparedRoot")?.clone()),
    ]))
}

fn root_from_clusters(clusters: &BTreeMap<String, JsonValue>) -> Result<String, PartitionError> {
    let states = clusters.values().map(public_cluster_state).collect::<Result<Vec<_>, _>>()?;
    Ok(hash_json(&JsonValue::Array(states)))
}

fn array_of_strings(values: &[String]) -> JsonValue {
    JsonValue::Array(values.iter().cloned().map(string).collect())
}

fn json_error(code: &'static str, detail: JsonValue) -> JsonValue {
    object(vec![("code", string(code)), ("detail", detail)])
}

/// Native C11 coordinator.
#[derive(Debug)]
pub struct PartitionHealingCoordinator {
    root: PathBuf,
    clusters: BTreeMap<String, JsonValue>,
    verifier_keys: BTreeMap<String, String>,
    total_weight: u64,
    quorum_weight: u64,
    byzantine_budget_weight: u64,
    parent_certificate_hash: String,
    epoch: u64,
    view: u64,
    federation_root: String,
    initial_federation_root: String,
    proposals: BTreeMap<String, JsonValue>,
    prepare_votes: Vec<JsonValue>,
    commit_votes: Vec<JsonValue>,
    timeout_votes: Vec<JsonValue>,
    prepare_certificates: BTreeMap<String, JsonValue>,
    timeout_certificates: BTreeMap<String, JsonValue>,
    commit_certificate: JsonValue,
    latest_timeout_certificate_hash: Option<String>,
    lock: JsonValue,
    evidence: BTreeMap<String, JsonValue>,
    partition_observations: Vec<JsonValue>,
    receipt: JsonValue,
    metrics: Metrics,
}

impl PartitionHealingCoordinator {
    /// Creates a fresh C11 durable coordinator.
    pub fn bootstrap(
        root: impl AsRef<Path>,
        clusters: &JsonValue,
        quorum_weight: u64,
        byzantine_budget_weight: u64,
        parent_certificate_hash: &str,
    ) -> Result<Self, PartitionError> {
        let cluster_values = clusters.as_array().ok_or_else(|| error("INVALID_CLUSTERS", JsonValue::Null))?;
        if cluster_values.len() < 3 {
            return Err(error("INSUFFICIENT_CLUSTER_COUNT", number(cluster_values.len() as u64)));
        }
        let mut states = BTreeMap::new();
        let mut verifier_keys = BTreeMap::new();
        for seed in cluster_values {
            let cluster_id = get_string(seed, "clusterId")?.to_owned();
            if states.contains_key(&cluster_id) {
                return Err(error("DUPLICATE_CLUSTER", string(cluster_id)));
            }
            let weight = get_u64(seed, "weight")?;
            if weight == 0 {
                return Err(error("INVALID_CLUSTER_WEIGHT", string(cluster_id)));
            }
            let verifier_key = get_string(seed, "verifierKey")?.to_owned();
            if verifier_key.is_empty() {
                return Err(error("MISSING_VERIFIER_KEY", string(cluster_id)));
            }
            let identity_commitment = hash_json(&object(vec![
                ("clusterId", string(&cluster_id)),
                ("verifierKey", string(&verifier_key)),
                ("format", string("rfe.partition-healing-identity.v0.9")),
            ]));
            let state = with_hash(object(vec![
                ("format", string("rfe.partition-healing-cluster-state.v0.9")),
                ("clusterId", string(&cluster_id)),
                ("weight", number(weight)),
                ("revision", number(get_u64(seed, "revision")?)),
                ("sovereignRoot", string(get_string(seed, "sovereignRoot")?)),
                ("authorityProofHash", string(get_string(seed, "authorityProofHash")?)),
                ("policyHash", string(get_string(seed, "policyHash")?)),
                ("identityCommitment", string(identity_commitment)),
                ("quarantined", bool_value(false)),
                ("quarantineEvidenceHash", JsonValue::Null),
                ("phase", string("stable")),
                ("pendingCommitCertificateHash", JsonValue::Null),
                ("preparedRoot", JsonValue::Null),
            ]), "integrityHash")?;
            states.insert(cluster_id.clone(), state);
            verifier_keys.insert(cluster_id, verifier_key);
        }
        let total_weight = states.values().map(|state| get_u64(state, "weight")).sum::<Result<u64, _>>()?;
        if quorum_weight == 0 || quorum_weight > total_weight {
            return Err(error("INVALID_QUORUM_WEIGHT", number(quorum_weight)));
        }
        if 2 * quorum_weight <= total_weight + byzantine_budget_weight {
            return Err(error("UNSAFE_BYZANTINE_QUORUM", number(quorum_weight)));
        }
        let federation_root = root_from_clusters(&states)?;
        let mut coordinator = Self {
            root: root.as_ref().to_path_buf(),
            clusters: states,
            verifier_keys,
            total_weight,
            quorum_weight,
            byzantine_budget_weight,
            parent_certificate_hash: parent_certificate_hash.to_owned(),
            epoch: 1,
            view: 1,
            federation_root: federation_root.clone(),
            initial_federation_root: federation_root,
            proposals: BTreeMap::new(),
            prepare_votes: Vec::new(),
            commit_votes: Vec::new(),
            timeout_votes: Vec::new(),
            prepare_certificates: BTreeMap::new(),
            timeout_certificates: BTreeMap::new(),
            commit_certificate: JsonValue::Null,
            latest_timeout_certificate_hash: None,
            lock: JsonValue::Null,
            evidence: BTreeMap::new(),
            partition_observations: Vec::new(),
            receipt: JsonValue::Null,
            metrics: Metrics::default(),
        };
        coordinator.persist()?;
        Ok(coordinator)
    }

    /// Opens a durable C11 coordinator and verifies the snapshot hash.
    pub fn open(root: impl AsRef<Path>) -> Result<Self, PartitionError> {
        let root = root.as_ref().to_path_buf();
        let snapshot = parse_json(&fs::read_to_string(root.join("partition-healing-state.json"))?)?;
        let mut body = snapshot.clone();
        let expected = get_string(&snapshot, "snapshotHash")?.to_owned();
        remove_field(&mut body, "snapshotHash");
        if hash_json(&body) != expected {
            return Err(error("DURABLE_SNAPSHOT_HASH_MISMATCH", string(expected)));
        }
        let clusters = get_array(&snapshot, "clusters")?.iter().map(|state| {
            Ok((get_string(state, "clusterId")?.to_owned(), state.clone()))
        }).collect::<Result<BTreeMap<_, _>, PartitionError>>()?;
        let verifier_keys = get_array(&snapshot, "verifierKeys")?.iter().map(|entry| {
            let pair = entry.as_array().ok_or_else(|| error("INVALID_VERIFIER_KEY_ENTRY", entry.clone()))?;
            if pair.len() != 2 { return Err(error("INVALID_VERIFIER_KEY_ENTRY", entry.clone())); }
            Ok((pair[0].as_str().ok_or_else(|| error("INVALID_VERIFIER_KEY_ENTRY", entry.clone()))?.to_owned(),
                pair[1].as_str().ok_or_else(|| error("INVALID_VERIFIER_KEY_ENTRY", entry.clone()))?.to_owned()))
        }).collect::<Result<BTreeMap<_, _>, PartitionError>>()?;
        let proposals = get_array(&snapshot, "proposals")?.iter().map(|value| {
            Ok((get_string(value, "proposalHash")?.to_owned(), value.clone()))
        }).collect::<Result<BTreeMap<_, _>, PartitionError>>()?;
        let prepare_certificates = get_array(&snapshot, "prepareCertificates")?.iter().map(|value| {
            Ok((get_string(value, "prepareCertificateHash")?.to_owned(), value.clone()))
        }).collect::<Result<BTreeMap<_, _>, PartitionError>>()?;
        let timeout_certificates = get_array(&snapshot, "timeoutCertificates")?.iter().map(|value| {
            Ok((get_string(value, "timeoutCertificateHash")?.to_owned(), value.clone()))
        }).collect::<Result<BTreeMap<_, _>, PartitionError>>()?;
        let evidence = get_array(&snapshot, "evidence")?.iter().map(|value| {
            let key = format!("{}:{}:{}", get_string(value, "clusterId")?, get_u64(value, "view")?, get_string(value, "phase")?);
            Ok((key, value.clone()))
        }).collect::<Result<BTreeMap<_, _>, PartitionError>>()?;
        let latest_timeout_certificate_hash = match required(&snapshot, "latestTimeoutCertificateHash")? {
            JsonValue::Null => None,
            JsonValue::String(value) => Some(value.clone()),
            value => return Err(error("INVALID_LATEST_TIMEOUT_CERTIFICATE", value.clone())),
        };
        let coordinator = Self {
            root,
            clusters,
            verifier_keys,
            total_weight: get_u64(&snapshot, "totalWeight")?,
            quorum_weight: get_u64(&snapshot, "quorumWeight")?,
            byzantine_budget_weight: get_u64(&snapshot, "byzantineBudgetWeight")?,
            parent_certificate_hash: get_string(&snapshot, "parentCertificateHash")?.to_owned(),
            epoch: get_u64(&snapshot, "epoch")?,
            view: get_u64(&snapshot, "view")?,
            federation_root: get_string(&snapshot, "federationRoot")?.to_owned(),
            initial_federation_root: get_string(&snapshot, "initialFederationRoot")?.to_owned(),
            proposals,
            prepare_votes: get_array(&snapshot, "prepareVotes")?.to_vec(),
            commit_votes: get_array(&snapshot, "commitVotes")?.to_vec(),
            timeout_votes: get_array(&snapshot, "timeoutVotes")?.to_vec(),
            prepare_certificates,
            timeout_certificates,
            commit_certificate: required(&snapshot, "commitCertificate")?.clone(),
            latest_timeout_certificate_hash,
            lock: required(&snapshot, "lock")?.clone(),
            evidence,
            partition_observations: get_array(&snapshot, "partitionObservations")?.to_vec(),
            receipt: required(&snapshot, "receipt")?.clone(),
            metrics: Metrics::from_json(required(&snapshot, "metrics")?)?,
        };
        if matches!(coordinator.commit_certificate, JsonValue::Null)
            && root_from_clusters(&coordinator.clusters)? != coordinator.federation_root {
            return Err(error("DURABLE_FEDERATION_ROOT_MISMATCH", string(&coordinator.federation_root)));
        }
        Ok(coordinator)
    }

    fn state_file(&self) -> PathBuf { self.root.join("partition-healing-state.json") }

    fn durable_state(&self) -> Result<JsonValue, PartitionError> {
        let verifier_keys = self.verifier_keys.iter().map(|(key, value)| {
            JsonValue::Array(vec![string(key), string(value)])
        }).collect();
        with_hash(object(vec![
            ("format", string("rfe.partition-healing-durable-state.v0.9")),
            ("clusters", JsonValue::Array(sorted_values(&self.clusters))),
            ("verifierKeys", JsonValue::Array(verifier_keys)),
            ("totalWeight", number(self.total_weight)),
            ("quorumWeight", number(self.quorum_weight)),
            ("byzantineBudgetWeight", number(self.byzantine_budget_weight)),
            ("parentCertificateHash", string(&self.parent_certificate_hash)),
            ("epoch", number(self.epoch)),
            ("view", number(self.view)),
            ("federationRoot", string(&self.federation_root)),
            ("initialFederationRoot", string(&self.initial_federation_root)),
            ("proposals", JsonValue::Array(sorted_values(&self.proposals))),
            ("prepareVotes", JsonValue::Array(self.sorted_by_hash(&self.prepare_votes, "voteHash")?)),
            ("commitVotes", JsonValue::Array(self.sorted_by_hash(&self.commit_votes, "voteHash")?)),
            ("timeoutVotes", JsonValue::Array(self.sorted_by_hash(&self.timeout_votes, "timeoutVoteHash")?)),
            ("prepareCertificates", JsonValue::Array(sorted_values(&self.prepare_certificates))),
            ("timeoutCertificates", JsonValue::Array(sorted_values(&self.timeout_certificates))),
            ("commitCertificate", self.commit_certificate.clone()),
            ("latestTimeoutCertificateHash", self.latest_timeout_certificate_hash.as_ref().map_or(JsonValue::Null, |value| string(value))),
            ("lock", self.lock.clone()),
            ("evidence", JsonValue::Array(sorted_values(&self.evidence))),
            ("partitionObservations", JsonValue::Array(self.partition_observations.clone())),
            ("receipt", self.receipt.clone()),
            ("metrics", self.metrics.to_json()),
        ]), "snapshotHash")
    }

    fn sorted_by_hash(&self, values: &[JsonValue], field: &str) -> Result<Vec<JsonValue>, PartitionError> {
        let mut values = values.to_vec();
        values.sort_by(|left, right| get_string(left, field).unwrap_or_default().cmp(get_string(right, field).unwrap_or_default()));
        Ok(values)
    }

    fn persist(&self) -> Result<(), PartitionError> {
        fs::create_dir_all(&self.root)?;
        let target = self.state_file();
        let temporary = target.with_extension("json.tmp");
        fs::write(&temporary, self.durable_state()?.canonical_string())?;
        fs::rename(temporary, target)?;
        Ok(())
    }

    fn cluster(&self, cluster_id: &str) -> Result<&JsonValue, PartitionError> {
        self.clusters.get(cluster_id).ok_or_else(|| error("UNKNOWN_CLUSTER", string(cluster_id)))
    }

    fn signing_seed(&self, cluster_id: &str) -> Result<JsonValue, PartitionError> {
        let state = self.cluster(cluster_id)?;
        Ok(object(vec![
            ("clusterId", string(cluster_id)),
            ("weight", number(get_u64(state, "weight")?)),
            ("authorityProofHash", string(get_string(state, "authorityProofHash")?)),
            ("policyHash", string(get_string(state, "policyHash")?)),
            ("identityCommitment", string(get_string(state, "identityCommitment")?)),
            ("verifierKey", string(self.verifier_keys.get(cluster_id).ok_or_else(|| error("MISSING_VERIFIER_KEY", string(cluster_id)))?)),
        ]))
    }

    fn observe_partition(&mut self, reachable: &[String], label: &str) -> Result<JsonValue, PartitionError> {
        let mut reachable = reachable.to_vec();
        reachable.sort();
        let unique = reachable.iter().cloned().collect::<BTreeSet<_>>();
        if unique.len() != reachable.len() { return Err(error("DUPLICATE_REACHABILITY_MEMBER", string(label))); }
        let reachable_weight = reachable.iter().map(|id| get_u64(self.cluster(id)?, "weight")).sum::<Result<u64, _>>()?;
        let stalled = reachable_weight < self.quorum_weight;
        let previous_was_stalled = self.partition_observations.last().map(|value| get_bool(value, "stalled")).transpose()?.unwrap_or(false);
        let unreachable = self.clusters.keys().filter(|id| !unique.contains(*id)).cloned().collect::<Vec<_>>();
        let observation = with_hash(object(vec![
            ("format", string("rfe.partition-observation.v0.9")),
            ("epoch", number(self.epoch)),
            ("view", number(self.view)),
            ("label", string(label)),
            ("reachableClusterIds", array_of_strings(&reachable)),
            ("unreachableClusterIds", array_of_strings(&unreachable)),
            ("reachableWeight", number(reachable_weight)),
            ("quorumWeight", number(self.quorum_weight)),
            ("stalled", bool_value(stalled)),
        ]), "partitionObservationHash")?;
        self.partition_observations.push(observation.clone());
        self.metrics.partition_observations += 1;
        if stalled { self.metrics.partition_stalls_observed += 1; }
        if !stalled && previous_was_stalled { self.metrics.healed_partitions += 1; }
        self.persist()?;
        Ok(observation)
    }

    fn create_proposal(&mut self, transaction: &JsonValue) -> Result<JsonValue, PartitionError> {
        let mut operations = get_array(transaction, "operations")?.to_vec();
        operations.sort_by(|left, right| get_string(left, "clusterId").unwrap_or_default().cmp(get_string(right, "clusterId").unwrap_or_default()));
        if operations.len() < 2 { return Err(error("INSUFFICIENT_FEDERATION_SCOPE", number(operations.len() as u64))); }
        let operation_ids = operations.iter().map(|value| get_string(value, "clusterId")).collect::<Result<BTreeSet<_>, _>>()?;
        if operation_ids.len() != operations.len() { return Err(error("DUPLICATE_CLUSTER_OPERATION", JsonValue::Null)); }
        let mut required_cluster_ids = strings(transaction, "requiredClusterIds")?;
        required_cluster_ids.sort();
        if required_cluster_ids.is_empty() { return Err(error("MISSING_REQUIRED_CLUSTERS", JsonValue::Null)); }
        for operation in &operations { self.cluster(get_string(operation, "clusterId")?)?; }
        for cluster_id in &required_cluster_ids { self.cluster(cluster_id)?; }
        let operation_hashes = operations.iter().map(|operation| {
            Ok(object(vec![
                ("clusterId", string(get_string(operation, "clusterId")?)),
                ("operationHash", string(hash_json(required(operation, "operation")?))),
            ]))
        }).collect::<Result<Vec<_>, PartitionError>>()?;
        let change_hash = hash_json(&object(vec![
            ("format", string("rfe.partition-healing-change.v0.9")),
            ("requiredClusterIds", array_of_strings(&required_cluster_ids)),
            ("operationHashes", JsonValue::Array(operation_hashes.clone())),
        ]));
        if !matches!(self.lock, JsonValue::Null) && get_string(&self.lock, "changeHash")? != change_hash {
            self.metrics.locked_conflict_rejections += 1;
            self.persist()?;
            return Err(error("LOCKED_CHANGE_CONFLICT", string(get_string(transaction, "proposalId")?)));
        }
        if self.view > 1 && self.latest_timeout_certificate_hash.is_none() {
            return Err(error("MISSING_VIEW_CHANGE_CERTIFICATE", number(self.view)));
        }
        let extends = if matches!(self.lock, JsonValue::Null) { JsonValue::Null } else { string(get_string(&self.lock, "prepareCertificateHash")?) };
        let view_change = self.latest_timeout_certificate_hash.as_ref().map_or(JsonValue::Null, |value| string(value));
        let mut proposal = with_hash(object(vec![
            ("format", string("rfe.partition-healing-proposal.v0.9")),
            ("epoch", number(self.epoch)),
            ("view", number(self.view)),
            ("parentFederationRoot", string(&self.federation_root)),
            ("parentCertificateHash", string(&self.parent_certificate_hash)),
            ("proposalId", string(get_string(transaction, "proposalId")?)),
            ("requiredClusterIds", array_of_strings(&required_cluster_ids)),
            ("operationHashes", JsonValue::Array(operation_hashes)),
            ("changeHash", string(&change_hash)),
            ("viewChangeCertificateHash", view_change),
            ("extendsPreparedCertificateHash", extends),
        ]), "proposalHash")?;
        set_field(&mut proposal, "operations", JsonValue::Array(operations))?;
        let proposal_hash = get_string(&proposal, "proposalHash")?.to_owned();
        self.proposals.insert(proposal_hash, proposal.clone());
        if self.view > 1 && !matches!(self.lock, JsonValue::Null) { self.metrics.locked_changes_reproposed += 1; }
        self.persist()?;
        Ok(proposal)
    }

    fn sign_vote(&self, cluster_id: &str, phase: &str, proposal: &JsonValue, view: u64) -> Result<JsonValue, PartitionError> {
        let seed = self.signing_seed(cluster_id)?;
        let unsigned = object(vec![
            ("format", string("rfe.partition-healing-vote.v0.9")),
            ("phase", string(phase)),
            ("epoch", number(self.epoch)),
            ("view", number(view)),
            ("parentFederationRoot", string(&self.federation_root)),
            ("proposalId", string(get_string(proposal, "proposalId")?)),
            ("proposalHash", string(get_string(proposal, "proposalHash")?)),
            ("changeHash", string(get_string(proposal, "changeHash")?)),
            ("clusterId", string(cluster_id)),
            ("weight", number(get_u64(&seed, "weight")?)),
            ("authorityProofHash", string(get_string(&seed, "authorityProofHash")?)),
            ("policyHash", string(get_string(&seed, "policyHash")?)),
            ("identityCommitment", string(get_string(&seed, "identityCommitment")?)),
            ("decision", string("approve")),
        ]);
        let mut vote = unsigned.clone();
        set_field(&mut vote, "voteHash", string(hash_json(&unsigned)))?;
        set_field(&mut vote, "keyedProof", string(keyed_proof(&unsigned, get_string(&seed, "verifierKey")?)))?;
        Ok(vote)
    }

    fn verify_vote(&mut self, vote: &JsonValue) -> Result<(), PartitionError> {
        let cluster_id = get_string(vote, "clusterId")?.to_owned();
        if get_u64(vote, "epoch")? != self.epoch || get_u64(vote, "view")? != self.view {
            self.metrics.stale_view_messages_rejected += 1;
            self.persist()?;
            return Err(error("STALE_PARTITION_VIEW", string(cluster_id)));
        }
        let state = self.cluster(&cluster_id)?;
        if get_string(vote, "parentFederationRoot")? != self.federation_root { return Err(error("VOTE_PARENT_ROOT_MISMATCH", string(cluster_id))); }
        if get_u64(vote, "weight")? != get_u64(state, "weight")? { return Err(error("VOTE_WEIGHT_MISMATCH", string(cluster_id))); }
        for (vote_field, state_field, code) in [
            ("authorityProofHash", "authorityProofHash", "VOTE_AUTHORITY_MISMATCH"),
            ("policyHash", "policyHash", "VOTE_POLICY_MISMATCH"),
            ("identityCommitment", "identityCommitment", "VOTE_IDENTITY_MISMATCH"),
        ] {
            if get_string(vote, vote_field)? != get_string(state, state_field)? { return Err(error(code, string(&cluster_id))); }
        }
        let mut unsigned = vote.clone();
        remove_field(&mut unsigned, "voteHash");
        remove_field(&mut unsigned, "keyedProof");
        if hash_json(&unsigned) != get_string(vote, "voteHash")? { return Err(error("VOTE_HASH_MISMATCH", string(cluster_id))); }
        let verifier = self.verifier_keys.get(&cluster_id).ok_or_else(|| error("MISSING_VERIFIER_KEY", string(&cluster_id)))?;
        if keyed_proof(&unsigned, verifier) != get_string(vote, "keyedProof")? { return Err(error("VOTE_KEYED_PROOF_MISMATCH", string(cluster_id))); }
        let proposal = self.proposals.get(get_string(vote, "proposalHash")?).ok_or_else(|| error("UNKNOWN_VOTED_PROPOSAL", string(get_string(vote, "proposalHash").unwrap_or_default())))?;
        if get_string(vote, "changeHash")? != get_string(proposal, "changeHash")? { return Err(error("VOTE_CHANGE_HASH_MISMATCH", string(cluster_id))); }
        let phase = get_string(vote, "phase")?;
        if phase != "prepare" && phase != "commit" { return Err(error("INVALID_VOTE_PHASE", string(phase))); }
        if phase == "commit" {
            let proposal_hash = get_string(vote, "proposalHash")?;
            let view = get_u64(vote, "view")?;
            if !self.prepare_certificates.values().any(|certificate| get_string(certificate, "proposalHash").ok() == Some(proposal_hash) && get_u64(certificate, "view").ok() == Some(view)) {
                return Err(error("COMMIT_WITHOUT_PREPARE_CERTIFICATE", string(proposal_hash)));
            }
        }
        Ok(())
    }

    fn register_vote(&mut self, vote: JsonValue) -> Result<(), PartitionError> {
        if let Err(failure) = self.verify_vote(&vote) {
            if failure.code != "STALE_PARTITION_VIEW" { self.metrics.forged_votes_rejected += 1; self.persist()?; }
            return Err(failure);
        }
        let phase = get_string(&vote, "phase")?.to_owned();
        let cluster_id = get_string(&vote, "clusterId")?.to_owned();
        let epoch = get_u64(&vote, "epoch")?;
        let view = get_u64(&vote, "view")?;
        let proposal_hash = get_string(&vote, "proposalHash")?.to_owned();
        let conflict = {
            let collection = if phase == "prepare" { &self.prepare_votes } else { &self.commit_votes };
            let vote_hash = get_string(&vote, "voteHash")?;
            if collection.iter().any(|current| get_string(current, "voteHash").ok() == Some(vote_hash)) {
                return Err(error("DUPLICATE_PARTITION_VOTE", string(&cluster_id)));
            }
            collection.iter().find(|current| {
                get_string(current, "clusterId").ok() == Some(cluster_id.as_str())
                    && get_u64(current, "epoch").ok() == Some(epoch)
                    && get_u64(current, "view").ok() == Some(view)
                    && get_string(current, "proposalHash").ok() != Some(proposal_hash.as_str())
            }).cloned()
        };
        if phase == "prepare" { self.prepare_votes.push(vote.clone()); self.metrics.prepare_votes_accepted += 1; }
        else { self.commit_votes.push(vote.clone()); self.metrics.commit_votes_accepted += 1; }
        if let Some(previous) = conflict { self.record_equivocation(&phase, &previous, &vote)?; }
        self.persist()
    }

    fn record_equivocation(&mut self, phase: &str, left: &JsonValue, right: &JsonValue) -> Result<(), PartitionError> {
        let cluster_id = get_string(left, "clusterId")?.to_owned();
        let view = get_u64(left, "view")?;
        let key = format!("{cluster_id}:{view}:{phase}");
        if self.evidence.contains_key(&key) { return Ok(()); }
        let (first, second) = if get_string(left, "proposalHash")? <= get_string(right, "proposalHash")? {
            (left, right)
        } else {
            (right, left)
        };
        let evidence = with_hash(object(vec![
            ("format", string("rfe.partition-healing-equivocation-evidence.v0.9")),
            ("epoch", number(self.epoch)),
            ("view", number(view)),
            ("phase", string(phase)),
            ("clusterId", string(&cluster_id)),
            ("firstProposalHash", string(get_string(first, "proposalHash")?)),
            ("secondProposalHash", string(get_string(second, "proposalHash")?)),
            ("firstVoteHash", string(get_string(first, "voteHash")?)),
            ("secondVoteHash", string(get_string(second, "voteHash")?)),
        ]), "evidenceHash")?;
        self.evidence.insert(key, evidence.clone());
        let mut state = self.cluster(&cluster_id)?.clone();
        if !get_bool(&state, "quarantined")? {
            set_field(&mut state, "quarantined", bool_value(true))?;
            set_field(&mut state, "quarantineEvidenceHash", string(get_string(&evidence, "evidenceHash")?))?;
            self.metrics.quarantined_weight += get_u64(&state, "weight")?;
            self.clusters.insert(cluster_id, with_hash(state, "integrityHash")?);
        }
        self.metrics.equivocations_detected += 1;
        Ok(())
    }

    fn effective_votes(&self, votes: &[JsonValue], proposal_hash: &str, view: u64) -> Result<Vec<JsonValue>, PartitionError> {
        let effective = votes.iter().filter_map(|vote| {
            let cluster_id = get_string(vote, "clusterId").ok()?;
            let accepted = get_string(vote, "proposalHash").ok() == Some(proposal_hash)
                && get_u64(vote, "view").ok() == Some(view)
                && get_string(vote, "decision").ok() == Some("approve")
                && self.cluster(cluster_id).ok().and_then(|state| get_bool(state, "quarantined").ok()) == Some(false);
            accepted.then(|| vote.clone())
        }).collect();
        Ok(effective)
    }

    fn projected_federation_root(&self, proposal: &JsonValue) -> Result<String, PartitionError> {
        let mut projected = self.clusters.clone();
        for operation in get_array(proposal, "operations")? {
            let cluster_id = get_string(operation, "clusterId")?.to_owned();
            let mut state = projected.get(&cluster_id).cloned().ok_or_else(|| error("UNKNOWN_CLUSTER", string(&cluster_id)))?;
            let next_revision = get_u64(&state, "revision")? + 1;
            let sovereign_root = hash_json(&object(vec![
                ("format", string("rfe.partition-healing-sovereign-transition.v0.9")),
                ("clusterId", string(&cluster_id)),
                ("beforeRoot", string(get_string(&state, "sovereignRoot")?)),
                ("nextRevision", number(next_revision)),
                ("operationHash", string(hash_json(required(operation, "operation")?))),
                ("changeHash", string(get_string(proposal, "changeHash")?)),
            ]));
            set_field(&mut state, "revision", number(next_revision))?;
            set_field(&mut state, "sovereignRoot", string(sovereign_root))?;
            set_field(&mut state, "phase", string("stable"))?;
            set_field(&mut state, "pendingCommitCertificateHash", JsonValue::Null)?;
            set_field(&mut state, "preparedRoot", JsonValue::Null)?;
            projected.insert(cluster_id, with_hash(state, "integrityHash")?);
        }
        root_from_clusters(&projected)
    }

    fn form_prepare_certificate(&mut self, proposal_hash: &str) -> Result<JsonValue, PartitionError> {
        let proposal = self.proposals.get(proposal_hash).cloned().ok_or_else(|| error("UNKNOWN_PROPOSAL", string(proposal_hash)))?;
        let view = get_u64(&proposal, "view")?;
        let mut votes = self.effective_votes(&self.prepare_votes, proposal_hash, view)?;
        votes.sort_by(|left, right| get_string(left, "clusterId").unwrap_or_default().cmp(get_string(right, "clusterId").unwrap_or_default()));
        let approval_weight = votes.iter().map(|vote| get_u64(vote, "weight")).sum::<Result<u64, _>>()?;
        let required_present = strings(&proposal, "requiredClusterIds")?.iter().all(|cluster_id| votes.iter().any(|vote| get_string(vote, "clusterId").ok() == Some(cluster_id)));
        if approval_weight < self.quorum_weight || !required_present { return Ok(JsonValue::Null); }
        let certificate = with_hash(object(vec![
            ("format", string("rfe.partition-prepare-certificate.v0.9")),
            ("epoch", number(self.epoch)),
            ("view", number(view)),
            ("parentFederationRoot", string(get_string(&proposal, "parentFederationRoot")?)),
            ("proposalId", string(get_string(&proposal, "proposalId")?)),
            ("proposalHash", string(proposal_hash)),
            ("changeHash", string(get_string(&proposal, "changeHash")?)),
            ("projectedFederationRoot", string(self.projected_federation_root(&proposal)?)),
            ("approvalWeight", number(approval_weight)),
            ("quorumWeight", number(self.quorum_weight)),
            ("requiredClusterIds", required(&proposal, "requiredClusterIds")?.clone()),
            ("voteHashes", JsonValue::Array(votes.iter().map(|vote| string(get_string(vote, "voteHash").unwrap_or_default())).collect())),
            ("extendsPreparedCertificateHash", required(&proposal, "extendsPreparedCertificateHash")?.clone()),
        ]), "prepareCertificateHash")?;
        let hash = get_string(&certificate, "prepareCertificateHash")?.to_owned();
        self.prepare_certificates.insert(hash.clone(), certificate.clone());
        if matches!(self.lock, JsonValue::Null) || view >= get_u64(&self.lock, "view")? {
            self.lock = object(vec![
                ("view", number(view)),
                ("changeHash", string(get_string(&certificate, "changeHash")?)),
                ("proposalHash", string(proposal_hash)),
                ("prepareCertificateHash", string(hash)),
                ("projectedFederationRoot", string(get_string(&certificate, "projectedFederationRoot")?)),
            ]);
        }
        self.metrics.prepare_certificates_formed += 1;
        self.persist()?;
        Ok(certificate)
    }

    fn sign_timeout_vote(&self, cluster_id: &str, prepare: &JsonValue) -> Result<JsonValue, PartitionError> {
        let seed = self.signing_seed(cluster_id)?;
        let unsigned = object(vec![
            ("format", string("rfe.partition-timeout-vote.v0.9")),
            ("epoch", number(self.epoch)),
            ("view", number(self.view)),
            ("parentFederationRoot", string(&self.federation_root)),
            ("clusterId", string(cluster_id)),
            ("weight", number(get_u64(&seed, "weight")?)),
            ("authorityProofHash", string(get_string(&seed, "authorityProofHash")?)),
            ("policyHash", string(get_string(&seed, "policyHash")?)),
            ("identityCommitment", string(get_string(&seed, "identityCommitment")?)),
            ("highestPreparedView", number(get_u64(prepare, "view")?)),
            ("highestPreparedCertificateHash", string(get_string(prepare, "prepareCertificateHash")?)),
            ("highestPreparedChangeHash", string(get_string(prepare, "changeHash")?)),
        ]);
        let mut vote = unsigned.clone();
        set_field(&mut vote, "timeoutVoteHash", string(hash_json(&unsigned)))?;
        set_field(&mut vote, "keyedProof", string(keyed_proof(&unsigned, get_string(&seed, "verifierKey")?)))?;
        Ok(vote)
    }

    fn verify_timeout_vote(&mut self, vote: &JsonValue) -> Result<(), PartitionError> {
        let cluster_id = get_string(vote, "clusterId")?.to_owned();
        if get_u64(vote, "epoch")? != self.epoch || get_u64(vote, "view")? != self.view {
            self.metrics.stale_view_messages_rejected += 1;
            self.persist()?;
            return Err(error("STALE_PARTITION_VIEW", string(cluster_id)));
        }
        let state = self.cluster(&cluster_id)?;
        if get_string(vote, "parentFederationRoot")? != self.federation_root { return Err(error("TIMEOUT_PARENT_ROOT_MISMATCH", string(cluster_id))); }
        if get_u64(vote, "weight")? != get_u64(state, "weight")? { return Err(error("TIMEOUT_WEIGHT_MISMATCH", string(cluster_id))); }
        for (vote_field, state_field, code) in [
            ("authorityProofHash", "authorityProofHash", "TIMEOUT_AUTHORITY_MISMATCH"),
            ("policyHash", "policyHash", "TIMEOUT_POLICY_MISMATCH"),
            ("identityCommitment", "identityCommitment", "TIMEOUT_IDENTITY_MISMATCH"),
        ] {
            if get_string(vote, vote_field)? != get_string(state, state_field)? { return Err(error(code, string(&cluster_id))); }
        }
        let mut unsigned = vote.clone();
        remove_field(&mut unsigned, "timeoutVoteHash");
        remove_field(&mut unsigned, "keyedProof");
        if hash_json(&unsigned) != get_string(vote, "timeoutVoteHash")? { return Err(error("TIMEOUT_VOTE_HASH_MISMATCH", string(cluster_id))); }
        let verifier = self.verifier_keys.get(&cluster_id).ok_or_else(|| error("MISSING_VERIFIER_KEY", string(&cluster_id)))?;
        if keyed_proof(&unsigned, verifier) != get_string(vote, "keyedProof")? { return Err(error("TIMEOUT_KEYED_PROOF_MISMATCH", string(cluster_id))); }
        let prepare_hash = get_string(vote, "highestPreparedCertificateHash")?;
        let certificate = self.prepare_certificates.get(prepare_hash).ok_or_else(|| error("UNKNOWN_TIMEOUT_PREPARE_CERTIFICATE", string(prepare_hash)))?;
        if get_u64(certificate, "view")? != get_u64(vote, "highestPreparedView")? { return Err(error("TIMEOUT_PREPARE_VIEW_MISMATCH", string(cluster_id))); }
        if get_string(certificate, "changeHash")? != get_string(vote, "highestPreparedChangeHash")? { return Err(error("TIMEOUT_PREPARE_CHANGE_MISMATCH", string(cluster_id))); }
        Ok(())
    }

    fn register_timeout_vote(&mut self, vote: JsonValue) -> Result<(), PartitionError> {
        if let Err(failure) = self.verify_timeout_vote(&vote) {
            if failure.code != "STALE_PARTITION_VIEW" { self.metrics.forged_votes_rejected += 1; self.persist()?; }
            return Err(failure);
        }
        let hash = get_string(&vote, "timeoutVoteHash")?;
        let cluster = get_string(&vote, "clusterId")?;
        let view = get_u64(&vote, "view")?;
        if self.timeout_votes.iter().any(|current| get_string(current, "timeoutVoteHash").ok() == Some(hash)) { return Err(error("DUPLICATE_TIMEOUT_VOTE", string(cluster))); }
        if self.timeout_votes.iter().any(|current| get_string(current, "clusterId").ok() == Some(cluster) && get_u64(current, "view").ok() == Some(view)) { return Err(error("DUPLICATE_TIMEOUT_SIGNER", string(cluster))); }
        self.timeout_votes.push(vote);
        self.metrics.timeout_votes_accepted += 1;
        self.persist()
    }

    fn form_timeout_certificate(&mut self) -> Result<JsonValue, PartitionError> {
        let mut votes = self.timeout_votes.iter().filter(|vote| {
            get_u64(vote, "view").ok() == Some(self.view)
                && get_string(vote, "clusterId").ok()
                    .and_then(|cluster_id| self.cluster(cluster_id).ok())
                    .and_then(|state| get_bool(state, "quarantined").ok()) == Some(false)
        }).cloned().collect::<Vec<_>>();
        let timeout_weight = votes.iter().map(|vote| get_u64(vote, "weight")).sum::<Result<u64, _>>()?;
        if timeout_weight < self.quorum_weight { return Ok(JsonValue::Null); }
        votes.sort_by(|left, right| get_string(left, "clusterId").unwrap_or_default().cmp(get_string(right, "clusterId").unwrap_or_default()));
        let mut locked = votes.clone();
        locked.sort_by(|left, right| get_u64(right, "highestPreparedView").unwrap_or_default().cmp(&get_u64(left, "highestPreparedView").unwrap_or_default())
            .then_with(|| get_string(left, "highestPreparedCertificateHash").unwrap_or_default().cmp(get_string(right, "highestPreparedCertificateHash").unwrap_or_default())));
        let highest = locked.first().ok_or_else(|| error("MISSING_TIMEOUT_VOTE", JsonValue::Null))?;
        let certificate = with_hash(object(vec![
            ("format", string("rfe.partition-timeout-certificate.v0.9")),
            ("epoch", number(self.epoch)),
            ("sourceView", number(self.view)),
            ("nextView", number(self.view + 1)),
            ("parentFederationRoot", string(&self.federation_root)),
            ("timeoutWeight", number(timeout_weight)),
            ("quorumWeight", number(self.quorum_weight)),
            ("timeoutVoteHashes", JsonValue::Array(votes.iter().map(|vote| string(get_string(vote, "timeoutVoteHash").unwrap_or_default())).collect())),
            ("highestPreparedView", number(get_u64(highest, "highestPreparedView")?)),
            ("highestPreparedCertificateHash", string(get_string(highest, "highestPreparedCertificateHash")?)),
            ("highestPreparedChangeHash", string(get_string(highest, "highestPreparedChangeHash")?)),
        ]), "timeoutCertificateHash")?;
        self.timeout_certificates.insert(get_string(&certificate, "timeoutCertificateHash")?.to_owned(), certificate.clone());
        self.metrics.timeout_certificates_formed += 1;
        self.persist()?;
        Ok(certificate)
    }

    fn advance_view(&mut self, certificate_hash: &str) -> Result<(), PartitionError> {
        let certificate = self.timeout_certificates.get(certificate_hash).cloned().ok_or_else(|| error("UNKNOWN_TIMEOUT_CERTIFICATE", string(certificate_hash)))?;
        if get_u64(&certificate, "sourceView")? != self.view || get_u64(&certificate, "nextView")? != self.view + 1 {
            return Err(error("INVALID_VIEW_ADVANCE", number(self.view)));
        }
        let prepare_hash = get_string(&certificate, "highestPreparedCertificateHash")?;
        let prepare = self.prepare_certificates.get(prepare_hash).ok_or_else(|| error("UNKNOWN_TIMEOUT_LOCK", string(prepare_hash)))?;
        self.lock = object(vec![
            ("view", number(get_u64(prepare, "view")?)),
            ("changeHash", string(get_string(prepare, "changeHash")?)),
            ("proposalHash", string(get_string(prepare, "proposalHash")?)),
            ("prepareCertificateHash", string(get_string(prepare, "prepareCertificateHash")?)),
            ("projectedFederationRoot", string(get_string(prepare, "projectedFederationRoot")?)),
        ]);
        self.latest_timeout_certificate_hash = Some(certificate_hash.to_owned());
        self.view += 1;
        self.metrics.view_changes += 1;
        self.persist()
    }

    fn form_commit_certificate(&mut self, proposal_hash: &str) -> Result<JsonValue, PartitionError> {
        if !matches!(self.commit_certificate, JsonValue::Null) { return Err(error("COMMIT_CERTIFICATE_ALREADY_FORMED", string(proposal_hash))); }
        let proposal = self.proposals.get(proposal_hash).cloned().ok_or_else(|| error("UNKNOWN_PROPOSAL", string(proposal_hash)))?;
        let view = get_u64(&proposal, "view")?;
        let prepare = self.prepare_certificates.values().find(|value| get_string(value, "proposalHash").ok() == Some(proposal_hash) && get_u64(value, "view").ok() == Some(view)).cloned().ok_or_else(|| error("MISSING_PREPARE_CERTIFICATE", string(proposal_hash)))?;
        let mut votes = self.effective_votes(&self.commit_votes, proposal_hash, view)?;
        votes.sort_by(|left, right| get_string(left, "clusterId").unwrap_or_default().cmp(get_string(right, "clusterId").unwrap_or_default()));
        let approval_weight = votes.iter().map(|vote| get_u64(vote, "weight")).sum::<Result<u64, _>>()?;
        let required_present = strings(&proposal, "requiredClusterIds")?.iter().all(|cluster_id| votes.iter().any(|vote| get_string(vote, "clusterId").ok() == Some(cluster_id)));
        if approval_weight < self.quorum_weight || !required_present { return Ok(JsonValue::Null); }
        let certificate = with_hash(object(vec![
            ("format", string("rfe.partition-healing-commit-certificate.v0.9")),
            ("epoch", number(self.epoch)),
            ("view", number(view)),
            ("parentFederationRoot", string(&self.federation_root)),
            ("parentCertificateHash", string(&self.parent_certificate_hash)),
            ("proposalId", string(get_string(&proposal, "proposalId")?)),
            ("proposalHash", string(proposal_hash)),
            ("changeHash", string(get_string(&proposal, "changeHash")?)),
            ("prepareCertificateHash", string(get_string(&prepare, "prepareCertificateHash")?)),
            ("timeoutCertificateHash", required(&proposal, "viewChangeCertificateHash")?.clone()),
            ("finalFederationRoot", string(get_string(&prepare, "projectedFederationRoot")?)),
            ("totalWeight", number(self.total_weight)),
            ("byzantineBudgetWeight", number(self.byzantine_budget_weight)),
            ("quorumWeight", number(self.quorum_weight)),
            ("approvalWeight", number(approval_weight)),
            ("requiredClusterIds", required(&proposal, "requiredClusterIds")?.clone()),
            ("voteHashes", JsonValue::Array(votes.iter().map(|vote| string(get_string(vote, "voteHash").unwrap_or_default())).collect())),
        ]), "commitCertificateHash")?;
        self.commit_certificate = certificate.clone();
        self.metrics.commit_certificates_formed += 1;
        self.persist()?;
        Ok(certificate)
    }

    fn prepare_commit(&mut self) -> Result<(), PartitionError> {
        if matches!(self.commit_certificate, JsonValue::Null) { return Err(error("NO_DURABLE_COMMIT_CERTIFICATE", JsonValue::Null)); }
        let proposal_hash = get_string(&self.commit_certificate, "proposalHash")?.to_owned();
        let certificate_hash = get_string(&self.commit_certificate, "commitCertificateHash")?.to_owned();
        let proposal = self.proposals.get(&proposal_hash).cloned().ok_or_else(|| error("UNKNOWN_PROPOSAL", string(&proposal_hash)))?;
        for operation in get_array(&proposal, "operations")? {
            let cluster_id = get_string(operation, "clusterId")?.to_owned();
            let mut state = self.cluster(&cluster_id)?.clone();
            let prepared_root = hash_json(&object(vec![
                ("format", string("rfe.partition-healing-sovereign-transition.v0.9")),
                ("clusterId", string(&cluster_id)),
                ("beforeRoot", string(get_string(&state, "sovereignRoot")?)),
                ("nextRevision", number(get_u64(&state, "revision")? + 1)),
                ("operationHash", string(hash_json(required(operation, "operation")?))),
                ("changeHash", string(get_string(&proposal, "changeHash")?)),
            ]));
            set_field(&mut state, "phase", string("prepared"))?;
            set_field(&mut state, "pendingCommitCertificateHash", string(&certificate_hash))?;
            set_field(&mut state, "preparedRoot", string(prepared_root))?;
            self.clusters.insert(cluster_id, with_hash(state, "integrityHash")?);
        }
        self.persist()
    }

    fn commit(&mut self, crash_point: PartitionCrashPoint) -> Result<JsonValue, PartitionError> {
        if matches!(self.commit_certificate, JsonValue::Null) { return Err(error("NO_DURABLE_COMMIT_CERTIFICATE", JsonValue::Null)); }
        let proposal_hash = get_string(&self.commit_certificate, "proposalHash")?.to_owned();
        let certificate_hash = get_string(&self.commit_certificate, "commitCertificateHash")?.to_owned();
        let proposal = self.proposals.get(&proposal_hash).cloned().ok_or_else(|| error("UNKNOWN_PROPOSAL", string(&proposal_hash)))?;
        let mut committed = 0usize;
        for operation in get_array(&proposal, "operations")? {
            let cluster_id = get_string(operation, "clusterId")?.to_owned();
            let mut state = self.cluster(&cluster_id)?.clone();
            if get_string(&state, "phase")? == "stable" && matches!(required(&state, "pendingCommitCertificateHash")?, JsonValue::Null) { continue; }
            if required(&state, "pendingCommitCertificateHash")?.as_str() != Some(&certificate_hash) { return Err(error("COMMIT_CERTIFICATE_OWNERSHIP_MISMATCH", string(cluster_id))); }
            let prepared_root = get_string(&state, "preparedRoot")?.to_owned();
            let next_revision = get_u64(&state, "revision")? + 1;
            set_field(&mut state, "revision", number(next_revision))?;
            set_field(&mut state, "sovereignRoot", string(prepared_root))?;
            set_field(&mut state, "phase", string("stable"))?;
            set_field(&mut state, "pendingCommitCertificateHash", JsonValue::Null)?;
            set_field(&mut state, "preparedRoot", JsonValue::Null)?;
            self.clusters.insert(cluster_id, with_hash(state, "integrityHash")?);
            committed += 1;
            self.persist()?;
            if crash_point == PartitionCrashPoint::AfterCommit(committed) {
                self.metrics.injected_interruptions += 1;
                self.persist()?;
                return Err(error("PARTITION_HEALING_CRASH_INJECTED_AFTER_COMMIT", number(committed as u64)));
            }
        }
        self.finalize(false)
    }

    fn finalize(&mut self, recovered: bool) -> Result<JsonValue, PartitionError> {
        if !matches!(self.receipt, JsonValue::Null) { return Ok(self.receipt.clone()); }
        let current_root = root_from_clusters(&self.clusters)?;
        if current_root != get_string(&self.commit_certificate, "finalFederationRoot")? {
            self.metrics.federation_root_divergences += 1;
            self.persist()?;
            return Err(error("PARTITION_HEALING_ROOT_DIVERGENCE", string(current_root)));
        }
        self.federation_root.clone_from(&current_root);
        self.parent_certificate_hash = get_string(&self.commit_certificate, "commitCertificateHash")?.to_owned();
        self.receipt = with_hash(object(vec![
            ("format", string("rfe.partition-healing-commit-receipt.v0.9")),
            ("epoch", number(self.epoch)),
            ("committedView", number(get_u64(&self.commit_certificate, "view")?)),
            ("proposalHash", string(get_string(&self.commit_certificate, "proposalHash")?)),
            ("changeHash", string(get_string(&self.commit_certificate, "changeHash")?)),
            ("commitCertificateHash", string(get_string(&self.commit_certificate, "commitCertificateHash")?)),
            ("finalFederationRoot", string(&self.federation_root)),
            ("recovered", bool_value(recovered)),
        ]), "receiptHash")?;
        self.persist()?;
        Ok(self.receipt.clone())
    }

    /// Recovers a durable C11 commit after process restart.
    pub fn recover(&mut self) -> Result<JsonValue, PartitionError> {
        if !matches!(self.receipt, JsonValue::Null) {
            self.metrics.idempotent_recovery_replays += 1;
            self.persist()?;
            return Ok(self.receipt.clone());
        }
        if matches!(self.commit_certificate, JsonValue::Null) { return Err(error("NO_DURABLE_COMMIT_CERTIFICATE", JsonValue::Null)); }
        self.metrics.recoveries += 1;
        let proposal_hash = get_string(&self.commit_certificate, "proposalHash")?.to_owned();
        let certificate_hash = get_string(&self.commit_certificate, "commitCertificateHash")?.to_owned();
        let proposal = self.proposals.get(&proposal_hash).cloned().ok_or_else(|| error("UNKNOWN_PROPOSAL", string(&proposal_hash)))?;
        for operation in get_array(&proposal, "operations")? {
            let cluster_id = get_string(operation, "clusterId")?.to_owned();
            let mut state = self.cluster(&cluster_id)?.clone();
            if get_string(&state, "phase")? == "stable" && matches!(required(&state, "pendingCommitCertificateHash")?, JsonValue::Null) { continue; }
            if required(&state, "pendingCommitCertificateHash")?.as_str() != Some(&certificate_hash) { return Err(error("RECOVERY_CERTIFICATE_OWNERSHIP_MISMATCH", string(cluster_id))); }
            let prepared_root = get_string(&state, "preparedRoot")?.to_owned();
            let next_revision = get_u64(&state, "revision")? + 1;
            set_field(&mut state, "revision", number(next_revision))?;
            set_field(&mut state, "sovereignRoot", string(prepared_root))?;
            set_field(&mut state, "phase", string("stable"))?;
            set_field(&mut state, "pendingCommitCertificateHash", JsonValue::Null)?;
            set_field(&mut state, "preparedRoot", JsonValue::Null)?;
            self.clusters.insert(cluster_id, with_hash(state, "integrityHash")?);
            self.persist()?;
        }
        self.finalize(true)
    }

    fn result(&self, first_prepare: JsonValue, timeout: JsonValue, stale: JsonValue, conflict: JsonValue, healing_proposal_hash: String, healing_prepare: JsonValue, interrupted: JsonValue, replay: JsonValue, initial_parent: String) -> Result<JsonValue, PartitionError> {
        if matches!(self.receipt, JsonValue::Null) { return Err(error("MISSING_FINAL_RECEIPT", JsonValue::Null)); }
        with_hash(object(vec![
            ("format", string("rfe.partition-healing-reality-result.v0.9")),
            ("livenessModel", string("partial-synchrony-with-weighted-timeout-certificates")),
            ("safetyModel", string("byzantine-weighted-lock-preservation-across-views")),
            ("totalWeight", number(self.total_weight)),
            ("byzantineBudgetWeight", number(self.byzantine_budget_weight)),
            ("quorumWeight", number(self.quorum_weight)),
            ("initialFederationRoot", string(&self.initial_federation_root)),
            ("parentCertificateHash", string(initial_parent)),
            ("partitionObservations", JsonValue::Array(self.partition_observations.clone())),
            ("firstPrepareCertificate", first_prepare),
            ("timeoutCertificate", timeout),
            ("staleViewRejection", stale),
            ("lockedConflictRejection", conflict),
            ("healingProposalHash", string(healing_proposal_hash)),
            ("healingPrepareCertificate", healing_prepare),
            ("commitCertificate", self.commit_certificate.clone()),
            ("interruptedCommitState", interrupted),
            ("commitReceipt", self.receipt.clone()),
            ("recoveryReplayReceipt", replay),
            ("finalFederationRoot", string(&self.federation_root)),
            ("finalView", number(self.view)),
            ("clusterStates", object_owned(self.clusters.iter().map(|(key, value)| (key.clone(), value.clone())).collect())),
            ("equivocationEvidence", JsonValue::Array(self.evidence.values().cloned().collect())),
            ("metrics", self.metrics.to_json()),
        ]), "partitionHealingRealityResultHash")
    }

    /// Executes the frozen C11 acceptance scenario from vector inputs.
    pub fn run_acceptance_scenario(&mut self, vector: &JsonValue) -> Result<JsonValue, PartitionError> {
        let initial_parent = self.parent_certificate_hash.clone();
        let first_proposal = self.create_proposal(required(vector, "initialProposal")?)?;
        for cluster_id in strings(vector, "prepareVoters")? {
            let vote = self.sign_vote(&cluster_id, "prepare", &first_proposal, self.view)?;
            self.register_vote(vote)?;
        }
        let first_prepare = self.form_prepare_certificate(get_string(&first_proposal, "proposalHash")?)?;
        if matches!(first_prepare, JsonValue::Null) { return Err(error("C11_FIRST_PREPARE_QUORUM_NOT_REACHED", JsonValue::Null)); }
        self.observe_partition(&strings(vector, "partitionedReachableClusterIds")?, get_string(vector, "partitionLabel")?)?;
        for cluster_id in strings(vector, "timeoutVoters")? {
            let vote = self.sign_timeout_vote(&cluster_id, &first_prepare)?;
            self.register_timeout_vote(vote)?;
        }
        let timeout = self.form_timeout_certificate()?;
        if matches!(timeout, JsonValue::Null) { return Err(error("C11_TIMEOUT_QUORUM_NOT_REACHED", JsonValue::Null)); }
        self.advance_view(get_string(&timeout, "timeoutCertificateHash")?)?;

        let stale_vote = self.sign_vote(&strings(vector, "prepareVoters")?[0], "prepare", &first_proposal, get_u64(&timeout, "sourceView")?)?;
        let stale_failure = self.register_vote(stale_vote).expect_err("C11 stale view must be rejected");
        let stale = json_error(stale_failure.code, stale_failure.detail);
        let conflict_failure = self.create_proposal(required(vector, "conflictingProposal")?).expect_err("C11 conflicting lock must be rejected");
        let conflict = json_error(conflict_failure.code, conflict_failure.detail);

        self.observe_partition(&strings(vector, "healedReachableClusterIds")?, get_string(vector, "healedLabel")?)?;
        let healing_proposal = self.create_proposal(required(vector, "healingProposal")?)?;
        for cluster_id in strings(vector, "prepareVoters")? {
            let vote = self.sign_vote(&cluster_id, "prepare", &healing_proposal, self.view)?;
            self.register_vote(vote)?;
        }
        let healing_prepare = self.form_prepare_certificate(get_string(&healing_proposal, "proposalHash")?)?;
        if matches!(healing_prepare, JsonValue::Null) { return Err(error("C11_HEALING_PREPARE_QUORUM_NOT_REACHED", JsonValue::Null)); }
        for cluster_id in strings(vector, "commitVoters")? {
            let vote = self.sign_vote(&cluster_id, "commit", &healing_proposal, self.view)?;
            self.register_vote(vote)?;
        }
        let commit_certificate = self.form_commit_certificate(get_string(&healing_proposal, "proposalHash")?)?;
        if matches!(commit_certificate, JsonValue::Null) { return Err(error("C11_COMMIT_QUORUM_NOT_REACHED", JsonValue::Null)); }
        self.prepare_commit()?;
        let crash_after = get_u64(vector, "crashAfterCommittedClusters")? as usize;
        let crash = self.commit(PartitionCrashPoint::AfterCommit(crash_after)).expect_err("C11 interruption required");
        if crash.code != "PARTITION_HEALING_CRASH_INJECTED_AFTER_COMMIT" { return Err(crash); }
        let operation_ids = get_array(&healing_proposal, "operations")?.iter().map(|value| get_string(value, "clusterId").map(ToOwned::to_owned)).collect::<Result<BTreeSet<_>, _>>()?;
        let committed = self.clusters.values().filter(|state| operation_ids.contains(get_string(state, "clusterId").unwrap_or_default()) && get_string(state, "phase").ok() == Some("stable") && required(state, "pendingCommitCertificateHash").is_ok_and(|value| matches!(value, JsonValue::Null))).count() as u64;
        let prepared = self.clusters.values().filter(|state| operation_ids.contains(get_string(state, "clusterId").unwrap_or_default()) && get_string(state, "phase").ok() == Some("prepared")).count() as u64;
        let interrupted = object(vec![
            ("crash", json_error(crash.code, crash.detail)),
            ("durableCommitCertificatePresent", bool_value(true)),
            ("committedClusters", number(committed)),
            ("preparedClusters", number(prepared)),
        ]);
        let root = self.root.clone();
        let mut reopened = Self::open(root)?;
        let _commit_receipt = reopened.recover()?;
        let replay = reopened.recover()?;
        reopened.result(
            first_prepare,
            timeout,
            stale,
            conflict,
            get_string(&healing_proposal, "proposalHash")?.to_owned(),
            healing_prepare,
            interrupted,
            replay,
            initial_parent,
        )
    }
}

