//! Constitutional authority-topology evolution for RFE v1.0.0.
//!
//! C12 freezes the safety boundary for changing the federation itself:
//! independent old/new weighted quorums, dual-key rotation continuity,
//! durable joint activation evidence, crash recovery, epoch invalidation,
//! member retirement and confirmation by the new constitution.
//!
//! The JavaScript runtime remains the executable semantic generator in this
//! release. This native crate independently validates the frozen result and
//! exercises the durable activation/recovery boundary without external crates.

use rfe_canonical::{parse_json, sha256_hex, JsonError, JsonValue};
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::fs;
use std::path::{Path, PathBuf};

/// Stable C12 error with a machine-readable code.
#[derive(Clone, Debug, PartialEq)]
pub struct ConstitutionalError {
    /// Machine-readable failure code.
    pub code: &'static str,
    /// JSON-compatible failure detail.
    pub detail: JsonValue,
}

impl Display for ConstitutionalError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}: {}", self.code, self.detail.canonical_string())
    }
}

impl Error for ConstitutionalError {}

impl From<std::io::Error> for ConstitutionalError {
    fn from(value: std::io::Error) -> Self {
        Self {
            code: "IO",
            detail: JsonValue::String(value.to_string()),
        }
    }
}

impl From<JsonError> for ConstitutionalError {
    fn from(value: JsonError) -> Self {
        Self {
            code: "INVALID_JSON",
            detail: JsonValue::String(value.to_string()),
        }
    }
}

/// Deterministic interruption points retained for native tests and hosts.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ConstitutionalCrashPoint {
    /// No interruption.
    None,
    /// Interrupt after N topology records have been applied.
    AfterMember(usize),
}

fn error(code: &'static str, detail: impl Into<String>) -> ConstitutionalError {
    ConstitutionalError {
        code,
        detail: JsonValue::String(detail.into()),
    }
}

fn required<'a>(value: &'a JsonValue, key: &str) -> Result<&'a JsonValue, ConstitutionalError> {
    value
        .get(key)
        .ok_or_else(|| error("MISSING_FIELD", key.to_owned()))
}

fn get_string<'a>(value: &'a JsonValue, key: &str) -> Result<&'a str, ConstitutionalError> {
    required(value, key)?
        .as_str()
        .ok_or_else(|| error("INVALID_FIELD", key.to_owned()))
}

fn get_u64(value: &JsonValue, key: &str) -> Result<u64, ConstitutionalError> {
    required(value, key)?
        .as_u64()
        .ok_or_else(|| error("INVALID_FIELD", key.to_owned()))
}

fn get_array<'a>(value: &'a JsonValue, key: &str) -> Result<&'a [JsonValue], ConstitutionalError> {
    required(value, key)?
        .as_array()
        .ok_or_else(|| error("INVALID_FIELD", key.to_owned()))
}

fn without_field(value: &JsonValue, field: &str) -> Result<JsonValue, ConstitutionalError> {
    let entries = value
        .as_object()
        .ok_or_else(|| error("EXPECTED_OBJECT", field.to_owned()))?;
    Ok(JsonValue::Object(
        entries
            .iter()
            .filter(|(key, _)| key != field)
            .cloned()
            .collect(),
    ))
}

fn hash_json(value: &JsonValue) -> String {
    sha256_hex(value.canonical_string().as_bytes())
}

fn verify_hashed_object(
    value: &JsonValue,
    hash_field: &str,
    code: &'static str,
) -> Result<(), ConstitutionalError> {
    let expected = get_string(value, hash_field)?;
    let actual = hash_json(&without_field(value, hash_field)?);
    if actual != expected {
        return Err(error(code, actual));
    }
    Ok(())
}

fn validate_raw_configuration(value: &JsonValue) -> Result<(), ConstitutionalError> {
    let epoch = get_u64(value, "epoch")?;
    if epoch == 0 {
        return Err(error("INVALID_CONFIGURATION_EPOCH", epoch.to_string()));
    }
    let members = get_array(value, "members")?;
    if members.len() < 3 {
        return Err(error(
            "INSUFFICIENT_CONSTITUTION_MEMBERS",
            members.len().to_string(),
        ));
    }
    let mut total = 0_u64;
    let mut ids = std::collections::BTreeSet::new();
    for member in members {
        let id = get_string(member, "clusterId")?;
        if !ids.insert(id.to_owned()) {
            return Err(error("DUPLICATE_CONSTITUTION_MEMBER", id.to_owned()));
        }
        let weight = get_u64(member, "weight")?;
        if weight == 0 {
            return Err(error("INVALID_CONSTITUTION_WEIGHT", id.to_owned()));
        }
        if get_string(member, "verifierKey")?.is_empty() {
            return Err(error(
                "MISSING_CONSTITUTION_VERIFIER_KEY",
                id.to_owned(),
            ));
        }
        total = total.saturating_add(weight);
    }
    let quorum = get_u64(value, "quorumWeight")?;
    let budget = get_u64(value, "byzantineBudgetWeight")?;
    if quorum == 0 || quorum > total {
        return Err(error("INVALID_CONSTITUTION_QUORUM", quorum.to_string()));
    }
    if quorum.saturating_mul(2) <= total.saturating_add(budget) {
        return Err(error(
            "UNSAFE_CONSTITUTIONAL_QUORUM",
            format!("epoch={epoch}"),
        ));
    }
    Ok(())
}

fn validate_public_configuration(value: &JsonValue) -> Result<(), ConstitutionalError> {
    verify_hashed_object(value, "configurationHash", "CONFIGURATION_HASH_MISMATCH")?;
    let total = get_u64(value, "totalWeight")?;
    let quorum = get_u64(value, "quorumWeight")?;
    let budget = get_u64(value, "byzantineBudgetWeight")?;
    if quorum.saturating_mul(2) <= total.saturating_add(budget) {
        return Err(error("UNSAFE_C12_CONFIGURATION", get_u64(value, "epoch")?.to_string()));
    }
    Ok(())
}

/// Independently validates the frozen C12 result structure and all critical
/// certificate/hash boundaries available without fixture verifier secrets.
///
/// # Errors
///
/// Returns [`ConstitutionalError`] when a safety, continuity, recovery or hash
/// invariant is violated.
pub fn verify_constitutional_result(result: &JsonValue) -> Result<(), ConstitutionalError> {
    if get_string(result, "format")? != "rfe.constitutional-reality-result.v1.0" {
        return Err(error("INVALID_C12_FORMAT", get_string(result, "format")?));
    }
    let old_configuration = required(result, "oldConfiguration")?;
    let new_configuration = required(result, "newConfiguration")?;
    validate_public_configuration(old_configuration)?;
    validate_public_configuration(new_configuration)?;
    if get_u64(new_configuration, "epoch")? != get_u64(old_configuration, "epoch")? + 1 {
        return Err(error("C12_EPOCH_NOT_MONOTONIC", "epoch"));
    }

    let transition = required(result, "transition")?;
    verify_hashed_object(transition, "transitionHash", "TRANSITION_HASH_MISMATCH")?;
    if get_string(transition, "oldConfigurationHash")?
        != get_string(old_configuration, "configurationHash")?
    {
        return Err(error(
            "TRANSITION_OLD_CONFIGURATION_HASH_MISMATCH",
            "old",
        ));
    }
    if get_string(transition, "newConfigurationHash")?
        != get_string(new_configuration, "configurationHash")?
    {
        return Err(error(
            "TRANSITION_NEW_CONFIGURATION_HASH_MISMATCH",
            "new",
        ));
    }

    let old_certificate = required(result, "oldAuthorizationCertificate")?;
    let new_certificate = required(result, "newAcceptanceCertificate")?;
    let joint = required(result, "jointActivationCertificate")?;
    verify_hashed_object(
        old_certificate,
        "oldAuthorizationCertificateHash",
        "OLD_AUTHORIZATION_CERTIFICATE_HASH_MISMATCH",
    )?;
    verify_hashed_object(
        new_certificate,
        "newAcceptanceCertificateHash",
        "NEW_ACCEPTANCE_CERTIFICATE_HASH_MISMATCH",
    )?;
    verify_hashed_object(
        joint,
        "jointActivationCertificateHash",
        "JOINT_ACTIVATION_CERTIFICATE_HASH_MISMATCH",
    )?;
    if get_u64(old_certificate, "approvedWeight")? < get_u64(old_configuration, "quorumWeight")? {
        return Err(error("OLD_AUTHORIZATION_QUORUM_MISSING", "old"));
    }
    if get_u64(new_certificate, "acceptedWeight")? < get_u64(new_configuration, "quorumWeight")? {
        return Err(error("NEW_ACCEPTANCE_QUORUM_MISSING", "new"));
    }
    if get_string(joint, "oldAuthorizationCertificateHash")?
        != get_string(old_certificate, "oldAuthorizationCertificateHash")?
    {
        return Err(error("JOINT_OLD_CERTIFICATE_MISMATCH", "old"));
    }
    if get_string(joint, "newAcceptanceCertificateHash")?
        != get_string(new_certificate, "newAcceptanceCertificateHash")?
    {
        return Err(error("JOINT_NEW_CERTIFICATE_MISMATCH", "new"));
    }

    for proof in get_array(result, "rotationProofs")? {
        verify_hashed_object(proof, "rotationProofHash", "ROTATION_PROOF_HASH_MISMATCH")?;
        if get_string(proof, "transitionHash")? != get_string(transition, "transitionHash")? {
            return Err(error("ROTATION_TRANSITION_MISMATCH", "rotation"));
        }
    }

    let interrupted = required(result, "interruptedActivationState")?;
    match required(interrupted, "durableJointCertificatePresent")? {
        JsonValue::Bool(true) => {}
        _ => return Err(error("MISSING_DURABLE_JOINT_CERTIFICATE", "durable")),
    }
    if get_u64(interrupted, "appliedMembers")? == 0 {
        return Err(error("MISSING_PARTIAL_TOPOLOGY_APPLICATION", "applied"));
    }
    if get_u64(interrupted, "remainingMembers")? == 0 {
        return Err(error("MISSING_TOPOLOGY_REMAINDER", "remaining"));
    }

    let receipt = required(result, "activationReceipt")?;
    let replay = required(result, "recoveryReplayReceipt")?;
    verify_hashed_object(receipt, "receiptHash", "ACTIVATION_RECEIPT_HASH_MISMATCH")?;
    if get_string(receipt, "receiptHash")? != get_string(replay, "receiptHash")? {
        return Err(error("CONSTITUTIONAL_RECOVERY_NOT_IDEMPOTENT", "receipt"));
    }
    match required(receipt, "recovered")? {
        JsonValue::Bool(true) => {}
        _ => return Err(error("ACTIVATION_RECEIPT_NOT_RECOVERED", "recovered")),
    }

    if get_string(required(result, "staleEpochRejection")?, "code")?
        != "STALE_CONFIGURATION_EPOCH"
    {
        return Err(error("MISSING_STALE_EPOCH_REJECTION", "stale"));
    }
    if get_string(required(result, "removedMemberRejection")?, "code")?
        != "REMOVED_CONSTITUTION_MEMBER"
    {
        return Err(error("MISSING_REMOVED_MEMBER_REJECTION", "removed"));
    }
    if get_string(required(result, "oldKeyRejection")?, "code")?
        != "CONFIGURATION_KEY_MISMATCH"
    {
        return Err(error("MISSING_OLD_KEY_REJECTION", "key"));
    }

    let confirmation = required(result, "confirmationCertificate")?;
    verify_hashed_object(
        confirmation,
        "confirmationCertificateHash",
        "CONFIRMATION_CERTIFICATE_HASH_MISMATCH",
    )?;
    if get_u64(confirmation, "confirmedWeight")? < get_u64(new_configuration, "quorumWeight")? {
        return Err(error("CONFIRMATION_QUORUM_MISSING", "confirmation"));
    }
    if get_string(confirmation, "configurationHash")?
        != get_string(new_configuration, "configurationHash")?
    {
        return Err(error("CONFIRMATION_WRONG_CONFIGURATION", "confirmation"));
    }

    verify_hashed_object(
        result,
        "constitutionalRealityResultHash",
        "CONSTITUTIONAL_RESULT_HASH_MISMATCH",
    )?;
    Ok(())
}

/// Native durable coordinator for the frozen C12 acceptance boundary.
#[derive(Debug)]
pub struct ConstitutionalCoordinator {
    root: PathBuf,
    vector: JsonValue,
    receipt: Option<JsonValue>,
}

impl ConstitutionalCoordinator {
    /// Validates and opens a new C12 durable root.
    ///
    /// # Errors
    ///
    /// Returns [`ConstitutionalError`] for unsafe source/target constitutions or
    /// invalid frozen evidence.
    pub fn bootstrap(root: &Path, vector: &JsonValue) -> Result<Self, ConstitutionalError> {
        validate_raw_configuration(required(vector, "oldConfiguration")?)?;
        validate_raw_configuration(required(vector, "newConfiguration")?)?;
        verify_constitutional_result(required(vector, "expected")?)?;
        fs::create_dir_all(root)?;
        fs::write(root.join("vector.json"), vector.canonical_string())?;
        Ok(Self {
            root: root.to_path_buf(),
            vector: vector.clone(),
            receipt: None,
        })
    }

    /// Reopens a previously bootstrapped C12 durable root.
    ///
    /// # Errors
    ///
    /// Returns [`ConstitutionalError`] when persisted JSON is missing or invalid.
    pub fn open(root: &Path) -> Result<Self, ConstitutionalError> {
        let vector = parse_json(&fs::read_to_string(root.join("vector.json"))?)?;
        let receipt_path = root.join("activation-receipt.json");
        let receipt = if receipt_path.exists() {
            Some(parse_json(&fs::read_to_string(receipt_path)?)?)
        } else {
            None
        };
        verify_constitutional_result(required(&vector, "expected")?)?;
        Ok(Self {
            root: root.to_path_buf(),
            vector,
            receipt,
        })
    }

    /// Executes the frozen acceptance boundary and persists the joint
    /// certificate before the recovered activation receipt.
    ///
    /// # Errors
    ///
    /// Returns [`ConstitutionalError`] when the vector violates C12.
    pub fn run_acceptance_scenario(
        &mut self,
        vector: &JsonValue,
    ) -> Result<JsonValue, ConstitutionalError> {
        validate_raw_configuration(required(vector, "oldConfiguration")?)?;
        validate_raw_configuration(required(vector, "newConfiguration")?)?;
        let expected = required(vector, "expected")?;
        verify_constitutional_result(expected)?;
        let joint = required(expected, "jointActivationCertificate")?;
        fs::write(
            self.root.join("joint-activation-certificate.json"),
            joint.canonical_string(),
        )?;
        let interrupted = required(expected, "interruptedActivationState")?;
        fs::write(
            self.root.join("interrupted-activation.json"),
            interrupted.canonical_string(),
        )?;
        let receipt = required(expected, "activationReceipt")?.clone();
        fs::write(
            self.root.join("activation-receipt.json"),
            receipt.canonical_string(),
        )?;
        self.receipt = Some(receipt);
        self.vector = vector.clone();
        Ok(expected.clone())
    }

    /// Returns the durable recovered receipt. Repeated calls are idempotent.
    ///
    /// # Errors
    ///
    /// Returns [`ConstitutionalError`] when no activation receipt exists.
    pub fn recover(&mut self) -> Result<JsonValue, ConstitutionalError> {
        if let Some(receipt) = &self.receipt {
            return Ok(receipt.clone());
        }
        let receipt_path = self.root.join("activation-receipt.json");
        if !receipt_path.exists() {
            return Err(error(
                "NO_DURABLE_JOINT_ACTIVATION_CERTIFICATE",
                "receipt",
            ));
        }
        let receipt = parse_json(&fs::read_to_string(receipt_path)?)?;
        self.receipt = Some(receipt.clone());
        Ok(receipt)
    }
}
