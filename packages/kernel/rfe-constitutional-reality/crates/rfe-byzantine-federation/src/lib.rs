//! Byzantine-safe federated reality for RFE v0.8.0.
//!
//! C10 adds epoch/round-bound keyed attestations, equivocation evidence,
//! deterministic quarantine, Byzantine-safe weighted quorum intersection, and
//! store-first recovery of one unique federation certificate.

use rfe_canonical::{parse_json, sha256_hex, JsonError, JsonValue};
use std::collections::BTreeMap;
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::fs;
use std::path::{Path, PathBuf};

/// Stable C10 error.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ByzantineError {
    /// Machine-readable code.
    pub code: &'static str,
    /// Diagnostic detail.
    pub message: String,
}

impl Display for ByzantineError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}: {}", self.code, self.message)
    }
}

impl Error for ByzantineError {}

impl From<std::io::Error> for ByzantineError {
    fn from(value: std::io::Error) -> Self {
        Self {
            code: "IO",
            message: value.to_string(),
        }
    }
}

impl From<JsonError> for ByzantineError {
    fn from(value: JsonError) -> Self {
        Self {
            code: "INVALID_JSON",
            message: value.to_string(),
        }
    }
}

/// Deterministic interruption points.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ByzantineCrashPoint {
    /// No interruption.
    None,
    /// Interrupt after N operation-cluster commits.
    AfterCommit(usize),
}

#[derive(Clone, Debug, Default)]
struct Metrics {
    attestations_accepted: u64,
    forged_attestations_rejected: u64,
    equivocations_detected: u64,
    quarantined_weight: u64,
    conflicting_certificates_formed: u64,
    stale_round_attestations_rejected: u64,
    wrong_parent_attestations_rejected: u64,
    certificate_recoveries: u64,
    idempotent_recovery_replays: u64,
    partial_federation_commits_exposed: u64,
    federation_root_divergences: u64,
    injected_interruptions: u64,
}

impl Metrics {
    fn to_json(&self) -> JsonValue {
        object(vec![
            ("attestationsAccepted", number(self.attestations_accepted)),
            (
                "forgedAttestationsRejected",
                number(self.forged_attestations_rejected),
            ),
            ("equivocationsDetected", number(self.equivocations_detected)),
            ("quarantinedWeight", number(self.quarantined_weight)),
            (
                "conflictingCertificatesFormed",
                number(self.conflicting_certificates_formed),
            ),
            (
                "staleRoundAttestationsRejected",
                number(self.stale_round_attestations_rejected),
            ),
            (
                "wrongParentAttestationsRejected",
                number(self.wrong_parent_attestations_rejected),
            ),
            ("certificateRecoveries", number(self.certificate_recoveries)),
            (
                "idempotentRecoveryReplays",
                number(self.idempotent_recovery_replays),
            ),
            (
                "partialFederationCommitsExposed",
                number(self.partial_federation_commits_exposed),
            ),
            (
                "federationRootDivergences",
                number(self.federation_root_divergences),
            ),
            ("injectedInterruptions", number(self.injected_interruptions)),
        ])
    }

    fn from_json(value: &JsonValue) -> Result<Self, ByzantineError> {
        Ok(Self {
            attestations_accepted: get_u64(value, "attestationsAccepted")?,
            forged_attestations_rejected: get_u64(value, "forgedAttestationsRejected")?,
            equivocations_detected: get_u64(value, "equivocationsDetected")?,
            quarantined_weight: get_u64(value, "quarantinedWeight")?,
            conflicting_certificates_formed: get_u64(value, "conflictingCertificatesFormed")?,
            stale_round_attestations_rejected: get_u64(value, "staleRoundAttestationsRejected")?,
            wrong_parent_attestations_rejected: get_u64(value, "wrongParentAttestationsRejected")?,
            certificate_recoveries: get_u64(value, "certificateRecoveries")?,
            idempotent_recovery_replays: get_u64(value, "idempotentRecoveryReplays")?,
            partial_federation_commits_exposed: get_u64(value, "partialFederationCommitsExposed")?,
            federation_root_divergences: get_u64(value, "federationRootDivergences")?,
            injected_interruptions: get_u64(value, "injectedInterruptions")?,
        })
    }
}

fn error(code: &'static str, message: impl Into<String>) -> ByzantineError {
    ByzantineError {
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

fn required<'a>(value: &'a JsonValue, key: &str) -> Result<&'a JsonValue, ByzantineError> {
    value.get(key).ok_or_else(|| error("MISSING_FIELD", key))
}

fn get_string<'a>(value: &'a JsonValue, key: &str) -> Result<&'a str, ByzantineError> {
    required(value, key)?
        .as_str()
        .ok_or_else(|| error("INVALID_FIELD", key))
}

fn get_u64(value: &JsonValue, key: &str) -> Result<u64, ByzantineError> {
    required(value, key)?
        .as_u64()
        .ok_or_else(|| error("INVALID_FIELD", key))
}

fn get_array<'a>(value: &'a JsonValue, key: &str) -> Result<&'a [JsonValue], ByzantineError> {
    required(value, key)?
        .as_array()
        .ok_or_else(|| error("INVALID_FIELD", key))
}

fn strings(value: &JsonValue, key: &str) -> Result<Vec<String>, ByzantineError> {
    get_array(value, key)?
        .iter()
        .map(|item| {
            item.as_str()
                .map(ToOwned::to_owned)
                .ok_or_else(|| error("INVALID_FIELD", key))
        })
        .collect()
}

fn set_field(
    value: &mut JsonValue,
    key: &str,
    replacement: JsonValue,
) -> Result<(), ByzantineError> {
    match value {
        JsonValue::Object(entries) => {
            if let Some((_, current)) = entries.iter_mut().find(|(candidate, _)| candidate == key) {
                *current = replacement;
            } else {
                entries.push((key.to_owned(), replacement));
            }
            Ok(())
        }
        _ => Err(error("INVALID_OBJECT", key)),
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

fn with_hash(mut value: JsonValue, field: &str) -> Result<JsonValue, ByzantineError> {
    remove_field(&mut value, field);
    let digest = hash_json(&value);
    set_field(&mut value, field, string(digest))?;
    Ok(value)
}

fn verify_hash(value: &JsonValue, field: &str, code: &'static str) -> Result<(), ByzantineError> {
    let expected = get_string(value, field)?.to_owned();
    let mut body = value.clone();
    remove_field(&mut body, field);
    if hash_json(&body) == expected {
        Ok(())
    } else {
        Err(error(code, expected))
    }
}

fn atomic_write(path: &Path, value: &JsonValue) -> Result<(), ByzantineError> {
    let parent = path
        .parent()
        .ok_or_else(|| error("INVALID_PATH", path.display().to_string()))?;
    fs::create_dir_all(parent)?;
    let temporary = path.with_extension("tmp");
    fs::write(&temporary, value.canonical_string())?;
    fs::rename(temporary, path)?;
    Ok(())
}

fn keyed_attestation(body: &JsonValue, verifier_key: &str) -> String {
    hash_json(&object(vec![
        ("format", string("rfe.keyed-attestation-fixture.v0.8")),
        ("body", body.clone()),
        ("verifierKey", string(verifier_key)),
    ]))
}

/// Store-first C10 coordinator.
#[derive(Debug)]
pub struct ByzantineRealityCoordinator {
    root: PathBuf,
    clusters: BTreeMap<String, JsonValue>,
    verifier_keys: BTreeMap<String, String>,
    proposals: BTreeMap<String, JsonValue>,
    attestations: Vec<JsonValue>,
    evidence: BTreeMap<String, JsonValue>,
    certificate: JsonValue,
    receipt: JsonValue,
    total_weight: u64,
    quorum_weight: u64,
    byzantine_budget_weight: u64,
    parent_certificate_hash: String,
    epoch: u64,
    round: u64,
    federation_root: String,
    metrics: Metrics,
}

impl ByzantineRealityCoordinator {
    /// Creates a new C10 checkpoint.
    pub fn bootstrap(
        root: impl AsRef<Path>,
        clusters: &JsonValue,
        quorum_weight: u64,
        byzantine_budget_weight: u64,
        parent_certificate_hash: &str,
    ) -> Result<Self, ByzantineError> {
        let mut states = BTreeMap::new();
        let mut verifier_keys = BTreeMap::new();
        let mut total_weight = 0;
        for seed in clusters
            .as_array()
            .ok_or_else(|| error("INVALID_CLUSTERS", "array"))?
        {
            let cluster_id = get_string(seed, "clusterId")?.to_owned();
            let weight = get_u64(seed, "weight")?;
            let verifier_key = get_string(seed, "verifierKey")?.to_owned();
            if states.contains_key(&cluster_id) {
                return Err(error("DUPLICATE_CLUSTER", cluster_id));
            }
            let identity_commitment = hash_json(&object(vec![
                ("clusterId", string(&cluster_id)),
                ("verifierKey", string(&verifier_key)),
            ]));
            let state = with_hash(
                object(vec![
                    ("format", string("rfe.byzantine-cluster-state.v0.8")),
                    ("clusterId", string(&cluster_id)),
                    ("weight", number(weight)),
                    (
                        "authorityProofHash",
                        string(get_string(seed, "authorityProofHash")?),
                    ),
                    ("policyHash", string(get_string(seed, "policyHash")?)),
                    ("identityCommitment", string(identity_commitment)),
                    (
                        "revision",
                        number(
                            seed.get("revision")
                                .and_then(JsonValue::as_u64)
                                .unwrap_or(0),
                        ),
                    ),
                    ("sovereignRoot", string(get_string(seed, "sovereignRoot")?)),
                    ("phase", string("stable")),
                    ("pendingCertificateHash", JsonValue::Null),
                    ("preparedRoot", JsonValue::Null),
                    ("quarantined", bool_value(false)),
                    ("quarantineEvidenceHash", JsonValue::Null),
                ]),
                "integrityHash",
            )?;
            verifier_keys.insert(cluster_id.clone(), verifier_key);
            states.insert(cluster_id, state);
            total_weight += weight;
        }
        if quorum_weight <= byzantine_budget_weight
            || 2 * quorum_weight <= total_weight + byzantine_budget_weight
        {
            return Err(error(
                "QUORUM_INTERSECTION_NOT_BYZANTINE_SAFE",
                quorum_weight.to_string(),
            ));
        }
        let mut coordinator = Self {
            root: root.as_ref().to_path_buf(),
            clusters: states,
            verifier_keys,
            proposals: BTreeMap::new(),
            attestations: Vec::new(),
            evidence: BTreeMap::new(),
            certificate: JsonValue::Null,
            receipt: JsonValue::Null,
            total_weight,
            quorum_weight,
            byzantine_budget_weight,
            parent_certificate_hash: parent_certificate_hash.to_owned(),
            epoch: 1,
            round: 1,
            federation_root: String::new(),
            metrics: Metrics::default(),
        };
        coordinator.federation_root = coordinator.current_federation_root()?;
        coordinator.persist()?;
        Ok(coordinator)
    }

    /// Opens an existing C10 checkpoint.
    pub fn open(root: impl AsRef<Path>) -> Result<Self, ByzantineError> {
        let root = root.as_ref().to_path_buf();
        let snapshot = parse_json(&fs::read_to_string(root.join("byzantine-federation.json"))?)?;
        verify_hash(&snapshot, "snapshotHash", "SNAPSHOT_HASH_MISMATCH")?;
        let clusters = get_array(&snapshot, "clusters")?
            .iter()
            .map(|state| {
                verify_hash(state, "integrityHash", "CLUSTER_STATE_INTEGRITY_MISMATCH")?;
                Ok((get_string(state, "clusterId")?.to_owned(), state.clone()))
            })
            .collect::<Result<BTreeMap<_, _>, ByzantineError>>()?;
        let verifier_keys = get_array(&snapshot, "verifierKeys")?
            .iter()
            .map(|entry| {
                Ok((
                    get_string(entry, "clusterId")?.to_owned(),
                    get_string(entry, "verifierKey")?.to_owned(),
                ))
            })
            .collect::<Result<BTreeMap<_, _>, ByzantineError>>()?;
        let proposals = get_array(&snapshot, "proposals")?
            .iter()
            .map(|proposal| {
                Ok((
                    get_string(proposal, "proposalHash")?.to_owned(),
                    proposal.clone(),
                ))
            })
            .collect::<Result<BTreeMap<_, _>, ByzantineError>>()?;
        let evidence = get_array(&snapshot, "evidence")?
            .iter()
            .map(|item| Ok((get_string(item, "clusterId")?.to_owned(), item.clone())))
            .collect::<Result<BTreeMap<_, _>, ByzantineError>>()?;
        Ok(Self {
            root,
            clusters,
            verifier_keys,
            proposals,
            attestations: get_array(&snapshot, "attestations")?.to_vec(),
            evidence,
            certificate: required(&snapshot, "certificate")?.clone(),
            receipt: required(&snapshot, "receipt")?.clone(),
            total_weight: get_u64(&snapshot, "totalWeight")?,
            quorum_weight: get_u64(&snapshot, "quorumWeight")?,
            byzantine_budget_weight: get_u64(&snapshot, "byzantineBudgetWeight")?,
            parent_certificate_hash: get_string(&snapshot, "parentCertificateHash")?.to_owned(),
            epoch: get_u64(&snapshot, "epoch")?,
            round: get_u64(&snapshot, "round")?,
            federation_root: get_string(&snapshot, "federationRoot")?.to_owned(),
            metrics: Metrics::from_json(required(&snapshot, "metrics")?)?,
        })
    }

    fn snapshot(&self) -> Result<JsonValue, ByzantineError> {
        let verifier_keys = self
            .verifier_keys
            .iter()
            .map(|(cluster_id, verifier_key)| {
                object(vec![
                    ("clusterId", string(cluster_id)),
                    ("verifierKey", string(verifier_key)),
                ])
            })
            .collect();
        with_hash(
            object(vec![
                ("format", string("rfe.byzantine-federation-checkpoint.v0.8")),
                ("totalWeight", number(self.total_weight)),
                ("quorumWeight", number(self.quorum_weight)),
                (
                    "byzantineBudgetWeight",
                    number(self.byzantine_budget_weight),
                ),
                (
                    "parentCertificateHash",
                    string(&self.parent_certificate_hash),
                ),
                ("epoch", number(self.epoch)),
                ("round", number(self.round)),
                ("federationRoot", string(&self.federation_root)),
                (
                    "clusters",
                    JsonValue::Array(self.clusters.values().cloned().collect()),
                ),
                ("verifierKeys", JsonValue::Array(verifier_keys)),
                (
                    "proposals",
                    JsonValue::Array(self.proposals.values().cloned().collect()),
                ),
                ("attestations", JsonValue::Array(self.attestations.clone())),
                (
                    "evidence",
                    JsonValue::Array(self.evidence.values().cloned().collect()),
                ),
                ("certificate", self.certificate.clone()),
                ("receipt", self.receipt.clone()),
                ("metrics", self.metrics.to_json()),
            ]),
            "snapshotHash",
        )
    }

    fn persist(&self) -> Result<(), ByzantineError> {
        atomic_write(
            &self.root.join("byzantine-federation.json"),
            &self.snapshot()?,
        )
    }

    /// Returns the canonical federation root.
    pub fn current_federation_root(&self) -> Result<String, ByzantineError> {
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
                    (
                        "identityCommitment",
                        string(get_string(state, "identityCommitment")?),
                    ),
                    ("quarantined", required(state, "quarantined")?.clone()),
                    (
                        "quarantineEvidenceHash",
                        required(state, "quarantineEvidenceHash")?.clone(),
                    ),
                ]))
            })
            .collect::<Result<Vec<_>, ByzantineError>>()?;
        Ok(hash_json(&JsonValue::Array(summaries)))
    }

    /// Returns one cluster state.
    pub fn cluster_state(&self, cluster_id: &str) -> Result<JsonValue, ByzantineError> {
        self.clusters
            .get(cluster_id)
            .cloned()
            .ok_or_else(|| error("UNKNOWN_CLUSTER", cluster_id))
    }

    fn create_proposal(&mut self, transaction: &JsonValue) -> Result<JsonValue, ByzantineError> {
        let mut operations = get_array(transaction, "operations")?.to_vec();
        operations.sort_by(|left, right| {
            get_string(left, "clusterId")
                .unwrap_or_default()
                .cmp(get_string(right, "clusterId").unwrap_or_default())
        });
        let mut required_ids = strings(transaction, "requiredClusterIds")?;
        required_ids.sort();
        let operation_hashes = operations
            .iter()
            .map(|operation| {
                Ok(object(vec![
                    ("clusterId", string(get_string(operation, "clusterId")?)),
                    (
                        "operationHash",
                        string(hash_json(required(operation, "operation")?)),
                    ),
                ]))
            })
            .collect::<Result<Vec<_>, ByzantineError>>()?;
        let mut proposal = with_hash(
            object(vec![
                ("format", string("rfe.byzantine-proposal.v0.8")),
                ("epoch", number(self.epoch)),
                ("round", number(self.round)),
                ("parentFederationRoot", string(&self.federation_root)),
                (
                    "parentCertificateHash",
                    string(&self.parent_certificate_hash),
                ),
                ("proposalId", string(get_string(transaction, "proposalId")?)),
                (
                    "requiredClusterIds",
                    JsonValue::Array(required_ids.into_iter().map(string).collect()),
                ),
                ("operationHashes", JsonValue::Array(operation_hashes)),
            ]),
            "proposalHash",
        )?;
        set_field(&mut proposal, "operations", JsonValue::Array(operations))?;
        self.proposals.insert(
            get_string(&proposal, "proposalHash")?.to_owned(),
            proposal.clone(),
        );
        self.persist()?;
        Ok(proposal)
    }

    fn sign_attestation(
        &self,
        cluster_id: &str,
        proposal: &JsonValue,
    ) -> Result<JsonValue, ByzantineError> {
        let state = self
            .clusters
            .get(cluster_id)
            .ok_or_else(|| error("UNKNOWN_CLUSTER", cluster_id))?;
        let body = object(vec![
            ("format", string("rfe.byzantine-attestation.v0.8")),
            ("epoch", number(self.epoch)),
            ("round", number(self.round)),
            ("parentFederationRoot", string(&self.federation_root)),
            ("proposalId", string(get_string(proposal, "proposalId")?)),
            (
                "proposalHash",
                string(get_string(proposal, "proposalHash")?),
            ),
            ("clusterId", string(cluster_id)),
            ("decision", string("approve")),
            ("weight", number(get_u64(state, "weight")?)),
            (
                "authorityProofHash",
                string(get_string(state, "authorityProofHash")?),
            ),
            ("policyHash", string(get_string(state, "policyHash")?)),
            (
                "identityCommitment",
                string(get_string(state, "identityCommitment")?),
            ),
        ]);
        let mut attestation = body.clone();
        set_field(
            &mut attestation,
            "attestationHash",
            string(hash_json(&body)),
        )?;
        set_field(
            &mut attestation,
            "keyedProof",
            string(keyed_attestation(
                &body,
                self.verifier_keys
                    .get(cluster_id)
                    .ok_or_else(|| error("MISSING_VERIFIER_KEY", cluster_id))?,
            )),
        )?;
        Ok(attestation)
    }

    fn verify_attestation(&mut self, attestation: &JsonValue) -> Result<(), ByzantineError> {
        let cluster_id = get_string(attestation, "clusterId")?.to_owned();
        let state = self
            .clusters
            .get(&cluster_id)
            .cloned()
            .ok_or_else(|| error("UNKNOWN_CLUSTER", &cluster_id))?;
        if get_u64(attestation, "epoch")? != self.epoch
            || get_u64(attestation, "round")? != self.round
        {
            self.metrics.stale_round_attestations_rejected += 1;
            return Err(error("STALE_BYZANTINE_ROUND", cluster_id));
        }
        if get_string(attestation, "parentFederationRoot")? != self.federation_root {
            self.metrics.wrong_parent_attestations_rejected += 1;
            return Err(error("ATTESTATION_PARENT_ROOT_MISMATCH", cluster_id));
        }
        let fields_match = get_u64(attestation, "weight")? == get_u64(&state, "weight")?
            && get_string(attestation, "authorityProofHash")?
                == get_string(&state, "authorityProofHash")?
            && get_string(attestation, "policyHash")? == get_string(&state, "policyHash")?
            && get_string(attestation, "identityCommitment")?
                == get_string(&state, "identityCommitment")?;
        if !fields_match {
            self.metrics.forged_attestations_rejected += 1;
            return Err(error("ATTESTATION_AUTHORITY_MISMATCH", cluster_id));
        }
        let mut body = attestation.clone();
        remove_field(&mut body, "keyedProof");
        remove_field(&mut body, "attestationHash");
        if hash_json(&body) != get_string(attestation, "attestationHash")? {
            self.metrics.forged_attestations_rejected += 1;
            return Err(error("ATTESTATION_HASH_MISMATCH", cluster_id));
        }
        let expected = keyed_attestation(
            &body,
            self.verifier_keys
                .get(&cluster_id)
                .ok_or_else(|| error("MISSING_VERIFIER_KEY", &cluster_id))?,
        );
        if expected != get_string(attestation, "keyedProof")? {
            self.metrics.forged_attestations_rejected += 1;
            return Err(error("ATTESTATION_KEYED_PROOF_MISMATCH", cluster_id));
        }
        if !self
            .proposals
            .contains_key(get_string(attestation, "proposalHash")?)
        {
            return Err(error("UNKNOWN_ATTESTED_PROPOSAL", cluster_id));
        }
        Ok(())
    }

    /// Registers one authority-bound attestation.
    pub fn register_attestation(&mut self, attestation: &JsonValue) -> Result<(), ByzantineError> {
        self.verify_attestation(attestation)?;
        if self.attestations.iter().any(|current| {
            get_string(current, "attestationHash").ok()
                == get_string(attestation, "attestationHash").ok()
        }) {
            return Err(error(
                "DUPLICATE_ATTESTATION",
                get_string(attestation, "clusterId")?,
            ));
        }
        let conflict = self
            .attestations
            .iter()
            .find(|current| {
                get_string(current, "clusterId").ok() == get_string(attestation, "clusterId").ok()
                    && get_u64(current, "epoch").ok() == get_u64(attestation, "epoch").ok()
                    && get_u64(current, "round").ok() == get_u64(attestation, "round").ok()
                    && get_string(current, "proposalHash").ok()
                        != get_string(attestation, "proposalHash").ok()
            })
            .cloned();
        self.attestations.push(attestation.clone());
        self.metrics.attestations_accepted += 1;
        if let Some(left) = conflict {
            self.record_equivocation(&left, attestation)?;
        }
        self.persist()?;
        Ok(())
    }

    fn record_equivocation(
        &mut self,
        left: &JsonValue,
        right: &JsonValue,
    ) -> Result<(), ByzantineError> {
        let cluster_id = get_string(left, "clusterId")?.to_owned();
        if self.evidence.contains_key(&cluster_id) {
            return Ok(());
        }
        let (first, second) =
            if get_string(left, "proposalHash")? <= get_string(right, "proposalHash")? {
                (left, right)
            } else {
                (right, left)
            };
        let evidence = with_hash(
            object(vec![
                ("format", string("rfe.equivocation-evidence.v0.8")),
                ("epoch", number(self.epoch)),
                ("round", number(self.round)),
                ("clusterId", string(&cluster_id)),
                ("parentFederationRoot", string(&self.federation_root)),
                (
                    "firstProposalHash",
                    string(get_string(first, "proposalHash")?),
                ),
                (
                    "secondProposalHash",
                    string(get_string(second, "proposalHash")?),
                ),
                (
                    "firstAttestationHash",
                    string(get_string(first, "attestationHash")?),
                ),
                (
                    "secondAttestationHash",
                    string(get_string(second, "attestationHash")?),
                ),
            ]),
            "evidenceHash",
        )?;
        self.evidence.insert(cluster_id.clone(), evidence.clone());
        let mut state = self
            .clusters
            .get(&cluster_id)
            .cloned()
            .ok_or_else(|| error("UNKNOWN_CLUSTER", &cluster_id))?;
        set_field(&mut state, "quarantined", bool_value(true))?;
        set_field(
            &mut state,
            "quarantineEvidenceHash",
            string(get_string(&evidence, "evidenceHash")?),
        )?;
        self.clusters
            .insert(cluster_id, with_hash(state, "integrityHash")?);
        self.metrics.equivocations_detected += 1;
        self.metrics.quarantined_weight += get_u64(left, "weight")?;
        Ok(())
    }

    fn effective_approvals(&self, proposal_hash: &str) -> Vec<JsonValue> {
        self.attestations
            .iter()
            .filter(|attestation| {
                get_string(attestation, "proposalHash").ok() == Some(proposal_hash)
                    && get_string(attestation, "decision").ok() == Some("approve")
                    && self
                        .clusters
                        .get(get_string(attestation, "clusterId").unwrap_or_default())
                        .is_some_and(|state| {
                            required(state, "quarantined").ok() == Some(&JsonValue::Bool(false))
                        })
            })
            .cloned()
            .collect()
    }

    fn approval_weight(&self, proposal_hash: &str) -> Result<u64, ByzantineError> {
        self.effective_approvals(proposal_hash)
            .iter()
            .map(|item| get_u64(item, "weight"))
            .sum()
    }

    fn required_approvals_present(&self, proposal: &JsonValue) -> Result<bool, ByzantineError> {
        let approvals = self.effective_approvals(get_string(proposal, "proposalHash")?);
        Ok(strings(proposal, "requiredClusterIds")?
            .iter()
            .all(|required_id| {
                approvals
                    .iter()
                    .any(|item| get_string(item, "clusterId").ok() == Some(required_id))
            }))
    }

    fn projected_federation_root(&self, proposal: &JsonValue) -> Result<String, ByzantineError> {
        let operations = get_array(proposal, "operations")?;
        let summaries = self
            .clusters
            .values()
            .map(|state| {
                let operation = operations.iter().find(|item| {
                    get_string(item, "clusterId").ok() == get_string(state, "clusterId").ok()
                });
                let (revision, sovereign_root) = if let Some(operation) = operation {
                    let next_revision = get_u64(state, "revision")? + 1;
                    let root = hash_json(&object(vec![
                        ("clusterId", string(get_string(state, "clusterId")?)),
                        ("beforeRoot", string(get_string(state, "sovereignRoot")?)),
                        ("nextRevision", number(next_revision)),
                        (
                            "operationHash",
                            string(hash_json(required(operation, "operation")?)),
                        ),
                        (
                            "proposalHash",
                            string(get_string(proposal, "proposalHash")?),
                        ),
                    ]));
                    (next_revision, root)
                } else {
                    (
                        get_u64(state, "revision")?,
                        get_string(state, "sovereignRoot")?.to_owned(),
                    )
                };
                Ok(object(vec![
                    ("clusterId", string(get_string(state, "clusterId")?)),
                    ("weight", number(get_u64(state, "weight")?)),
                    ("revision", number(revision)),
                    ("sovereignRoot", string(sovereign_root)),
                    (
                        "authorityProofHash",
                        string(get_string(state, "authorityProofHash")?),
                    ),
                    ("policyHash", string(get_string(state, "policyHash")?)),
                    (
                        "identityCommitment",
                        string(get_string(state, "identityCommitment")?),
                    ),
                    ("quarantined", required(state, "quarantined")?.clone()),
                    (
                        "quarantineEvidenceHash",
                        required(state, "quarantineEvidenceHash")?.clone(),
                    ),
                ]))
            })
            .collect::<Result<Vec<_>, ByzantineError>>()?;
        Ok(hash_json(&JsonValue::Array(summaries)))
    }

    fn form_certificate(&mut self, proposal_hash: &str) -> Result<JsonValue, ByzantineError> {
        if !matches!(self.certificate, JsonValue::Null) {
            return Err(error("CERTIFICATE_ALREADY_FORMED", proposal_hash));
        }
        let proposal = self
            .proposals
            .get(proposal_hash)
            .cloned()
            .ok_or_else(|| error("UNKNOWN_PROPOSAL", proposal_hash))?;
        let mut approvals = self.effective_approvals(proposal_hash);
        approvals.sort_by(|left, right| {
            get_string(left, "clusterId")
                .unwrap_or_default()
                .cmp(get_string(right, "clusterId").unwrap_or_default())
        });
        let approval_weight = approvals
            .iter()
            .map(|item| get_u64(item, "weight"))
            .sum::<Result<u64, _>>()?;
        if approval_weight < self.quorum_weight || !self.required_approvals_present(&proposal)? {
            return Ok(JsonValue::Null);
        }
        let certificate = with_hash(
            object(vec![
                ("format", string("rfe.byzantine-quorum-certificate.v0.8")),
                ("epoch", number(self.epoch)),
                ("round", number(self.round)),
                ("parentFederationRoot", string(&self.federation_root)),
                (
                    "parentCertificateHash",
                    string(&self.parent_certificate_hash),
                ),
                ("proposalId", string(get_string(&proposal, "proposalId")?)),
                ("proposalHash", string(proposal_hash)),
                (
                    "finalFederationRoot",
                    string(self.projected_federation_root(&proposal)?),
                ),
                ("totalWeight", number(self.total_weight)),
                (
                    "byzantineBudgetWeight",
                    number(self.byzantine_budget_weight),
                ),
                ("quorumWeight", number(self.quorum_weight)),
                ("approvalWeight", number(approval_weight)),
                (
                    "requiredClusterIds",
                    required(&proposal, "requiredClusterIds")?.clone(),
                ),
                (
                    "attestationHashes",
                    JsonValue::Array(
                        approvals
                            .iter()
                            .map(|item| {
                                string(get_string(item, "attestationHash").unwrap_or_default())
                            })
                            .collect(),
                    ),
                ),
                (
                    "excludedEvidenceHashes",
                    JsonValue::Array(
                        self.evidence
                            .values()
                            .map(|item| {
                                string(get_string(item, "evidenceHash").unwrap_or_default())
                            })
                            .collect(),
                    ),
                ),
            ]),
            "byzantineCertificateHash",
        )?;
        self.certificate = certificate.clone();
        self.persist()?;
        Ok(certificate)
    }

    fn prepare_certificate(&mut self) -> Result<(), ByzantineError> {
        let proposal_hash = get_string(&self.certificate, "proposalHash")?.to_owned();
        let certificate_hash =
            get_string(&self.certificate, "byzantineCertificateHash")?.to_owned();
        let proposal = self
            .proposals
            .get(&proposal_hash)
            .cloned()
            .ok_or_else(|| error("UNKNOWN_PROPOSAL", &proposal_hash))?;
        for operation in get_array(&proposal, "operations")? {
            let cluster_id = get_string(operation, "clusterId")?.to_owned();
            let mut state = self
                .clusters
                .get(&cluster_id)
                .cloned()
                .ok_or_else(|| error("UNKNOWN_CLUSTER", &cluster_id))?;
            let prepared_root = hash_json(&object(vec![
                ("clusterId", string(&cluster_id)),
                ("beforeRoot", string(get_string(&state, "sovereignRoot")?)),
                ("nextRevision", number(get_u64(&state, "revision")? + 1)),
                (
                    "operationHash",
                    string(hash_json(required(operation, "operation")?)),
                ),
                ("proposalHash", string(&proposal_hash)),
            ]));
            set_field(&mut state, "phase", string("prepared"))?;
            set_field(
                &mut state,
                "pendingCertificateHash",
                string(&certificate_hash),
            )?;
            set_field(&mut state, "preparedRoot", string(prepared_root))?;
            self.clusters
                .insert(cluster_id, with_hash(state, "integrityHash")?);
        }
        self.persist()
    }

    /// Commits the durable C10 certificate.
    pub fn commit_certificate(
        &mut self,
        crash_point: ByzantineCrashPoint,
    ) -> Result<JsonValue, ByzantineError> {
        if matches!(self.certificate, JsonValue::Null) {
            return Err(error("NO_DURABLE_BYZANTINE_CERTIFICATE", "missing"));
        }
        let proposal_hash = get_string(&self.certificate, "proposalHash")?.to_owned();
        let certificate_hash =
            get_string(&self.certificate, "byzantineCertificateHash")?.to_owned();
        let proposal = self
            .proposals
            .get(&proposal_hash)
            .cloned()
            .ok_or_else(|| error("UNKNOWN_PROPOSAL", &proposal_hash))?;
        for (index, operation) in get_array(&proposal, "operations")?.iter().enumerate() {
            let cluster_id = get_string(operation, "clusterId")?.to_owned();
            let mut state = self
                .clusters
                .get(&cluster_id)
                .cloned()
                .ok_or_else(|| error("UNKNOWN_CLUSTER", &cluster_id))?;
            if get_string(&state, "phase")? == "stable" {
                continue;
            }
            if required(&state, "pendingCertificateHash")?.as_str() != Some(&certificate_hash) {
                return Err(error("CERTIFICATE_OWNERSHIP_MISMATCH", cluster_id));
            }
            let prepared_root = get_string(&state, "preparedRoot")?.to_owned();
            let next_revision = get_u64(&state, "revision")? + 1;
            set_field(&mut state, "revision", number(next_revision))?;
            set_field(&mut state, "sovereignRoot", string(prepared_root))?;
            set_field(&mut state, "phase", string("stable"))?;
            set_field(&mut state, "pendingCertificateHash", JsonValue::Null)?;
            set_field(&mut state, "preparedRoot", JsonValue::Null)?;
            self.clusters
                .insert(cluster_id, with_hash(state, "integrityHash")?);
            self.persist()?;
            if crash_point == ByzantineCrashPoint::AfterCommit(index + 1) {
                self.metrics.injected_interruptions += 1;
                self.persist()?;
                return Err(error(
                    "BYZANTINE_CRASH_INJECTED_AFTER_COMMIT",
                    (index + 1).to_string(),
                ));
            }
        }
        self.finalize(false)
    }

    fn finalize(&mut self, recovered: bool) -> Result<JsonValue, ByzantineError> {
        let root = self.current_federation_root()?;
        if root != get_string(&self.certificate, "finalFederationRoot")? {
            return Err(error("BYZANTINE_FINAL_ROOT_MISMATCH", root));
        }
        self.federation_root.clone_from(&root);
        if matches!(self.receipt, JsonValue::Null) {
            self.receipt = with_hash(
                object(vec![
                    ("format", string("rfe.byzantine-federation-receipt.v0.8")),
                    ("epoch", number(self.epoch)),
                    ("round", number(self.round)),
                    (
                        "proposalId",
                        string(get_string(&self.certificate, "proposalId")?),
                    ),
                    (
                        "proposalHash",
                        string(get_string(&self.certificate, "proposalHash")?),
                    ),
                    ("status", string("committed")),
                    ("finalFederationRoot", string(&root)),
                    (
                        "byzantineCertificateHash",
                        string(get_string(&self.certificate, "byzantineCertificateHash")?),
                    ),
                    (
                        "approvalWeight",
                        number(get_u64(&self.certificate, "approvalWeight")?),
                    ),
                    ("quorumWeight", number(self.quorum_weight)),
                    ("quarantinedWeight", number(self.metrics.quarantined_weight)),
                    ("recovered", bool_value(recovered)),
                ]),
                "receiptHash",
            )?;
        }
        self.persist()?;
        Ok(self.receipt.clone())
    }

    /// Recovers a durable C10 certificate after process restart.
    pub fn recover(&mut self) -> Result<JsonValue, ByzantineError> {
        if matches!(self.certificate, JsonValue::Null) {
            return Err(error("NO_DURABLE_BYZANTINE_CERTIFICATE", "missing"));
        }
        self.metrics.certificate_recoveries += 1;
        if !matches!(self.receipt, JsonValue::Null) {
            self.metrics.idempotent_recovery_replays += 1;
            self.persist()?;
            return Ok(self.receipt.clone());
        }
        self.commit_certificate(ByzantineCrashPoint::None)?;
        let mut receipt = self.receipt.clone();
        set_field(&mut receipt, "recovered", bool_value(true))?;
        remove_field(&mut receipt, "receiptHash");
        self.receipt = with_hash(receipt, "receiptHash")?;
        self.persist()?;
        Ok(self.receipt.clone())
    }

    fn rejected_fork(&self, fork: &JsonValue) -> Result<JsonValue, ByzantineError> {
        with_hash(
            object(vec![
                ("format", string("rfe.rejected-byzantine-fork.v0.8")),
                ("proposalId", string(get_string(fork, "proposalId")?)),
                ("proposalHash", string(get_string(fork, "proposalHash")?)),
                (
                    "effectiveApprovalWeight",
                    number(self.approval_weight(get_string(fork, "proposalHash")?)?),
                ),
                ("quorumWeight", number(self.quorum_weight)),
                ("reason", string("INSUFFICIENT_NON_EQUIVOCATING_QUORUM")),
            ]),
            "rejectionHash",
        )
    }

    /// Executes the frozen C10 Byzantine scenario.
    pub fn run_acceptance_scenario(
        &mut self,
        main_transaction: &JsonValue,
        fork_transaction: &JsonValue,
    ) -> Result<JsonValue, ByzantineError> {
        let initial_federation_root = self.current_federation_root()?;
        let main = self.create_proposal(main_transaction)?;
        let fork = self.create_proposal(fork_transaction)?;
        let attestation_plan = [
            ("cluster:aurora", &main),
            ("cluster:forge", &main),
            ("cluster:harbor", &main),
            ("cluster:harbor", &fork),
            ("cluster:mirror", &fork),
        ];
        for (cluster_id, proposal) in attestation_plan {
            let attestation = self.sign_attestation(cluster_id, proposal)?;
            self.register_attestation(&attestation)?;
        }
        let rejected_fork = self.rejected_fork(&fork)?;
        let certificate = self.form_certificate(get_string(&main, "proposalHash")?)?;
        if matches!(certificate, JsonValue::Null) {
            return Err(error("MAIN_PROPOSAL_FAILED_TO_FORM_CERTIFICATE", "missing"));
        }
        self.prepare_certificate()?;
        let crash = self
            .commit_certificate(ByzantineCrashPoint::AfterCommit(1))
            .expect_err("C10 acceptance requires interruption");
        if crash.code != "BYZANTINE_CRASH_INJECTED_AFTER_COMMIT" {
            return Err(crash);
        }
        let committed_clusters = get_array(&main, "operations")?
            .iter()
            .filter(|operation| {
                self.clusters
                    .get(get_string(operation, "clusterId").unwrap_or_default())
                    .is_some_and(|state| get_string(state, "phase").ok() == Some("stable"))
            })
            .count() as u64;
        let prepared_clusters = get_array(&main, "operations")?
            .iter()
            .filter(|operation| {
                self.clusters
                    .get(get_string(operation, "clusterId").unwrap_or_default())
                    .is_some_and(|state| get_string(state, "phase").ok() == Some("prepared"))
            })
            .count() as u64;
        let interrupted = object(vec![
            ("committedClusters", number(committed_clusters)),
            ("preparedClusters", number(prepared_clusters)),
            ("durableCertificatePresent", bool_value(true)),
        ]);
        let commit_receipt = self.recover()?;
        let replay_receipt = self.recover()?;
        let result = object(vec![
            (
                "format",
                string("rfe.byzantine-federated-reality-result.v0.8"),
            ),
            (
                "consensusModel",
                string("weighted-byzantine-quorum-with-equivocation-exclusion"),
            ),
            ("totalWeight", number(self.total_weight)),
            (
                "byzantineBudgetWeight",
                number(self.byzantine_budget_weight),
            ),
            ("quorumWeight", number(self.quorum_weight)),
            ("initialFederationRoot", string(initial_federation_root)),
            (
                "parentCertificateHash",
                string(&self.parent_certificate_hash),
            ),
            (
                "mainProposalHash",
                string(get_string(&main, "proposalHash")?),
            ),
            (
                "forkProposalHash",
                string(get_string(&fork, "proposalHash")?),
            ),
            (
                "equivocationEvidence",
                JsonValue::Array(self.evidence.values().cloned().collect()),
            ),
            ("rejectedFork", rejected_fork),
            ("certificate", certificate),
            ("interruptedCommitState", interrupted),
            ("commitReceipt", commit_receipt),
            ("recoveryReplayReceipt", replay_receipt),
            (
                "finalFederationRoot",
                string(self.current_federation_root()?),
            ),
            (
                "clusterStates",
                object_owned(
                    self.clusters
                        .iter()
                        .map(|(key, value)| (key.clone(), value.clone()))
                        .collect(),
                ),
            ),
            ("metrics", self.metrics.to_json()),
        ]);
        with_hash(result, "byzantineFederatedRealityResultHash")
    }
}
