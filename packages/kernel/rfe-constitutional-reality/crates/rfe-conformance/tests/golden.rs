use rfe_canonical::{parse_json, sha256_hex, JsonValue};
use rfe_native_kernel::{execute_causal_plan, verify_continuity_fixture, NativeWorld};
use std::path::PathBuf;

fn vector(name: &str) -> JsonValue {
    let source = match name {
        "c1" => include_str!("../../../conformance/vectors/c1-canonical.json"),
        "c2" => include_str!("../../../conformance/vectors/c2-transaction.json"),
        "c3" => include_str!("../../../conformance/vectors/c3-replay-scheduler.json"),
        "c4" => include_str!("../../../conformance/vectors/c4-proof-persistence-generation.json"),
        _ => panic!("unknown vector"),
    };
    parse_json(source).expect("golden vector must be valid JSON")
}

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value
        .get(key)
        .unwrap_or_else(|| panic!("missing key: {key}"))
}

#[test]
fn c1_canonical_serialization_and_sha256_match_reference_runtime() {
    let input = vector("c1");
    let cases = required(&input, "cases").as_array().expect("cases array");
    assert!(cases.len() >= 8);
    for case in cases {
        let id = required(case, "id").as_str().expect("case id");
        let value = required(case, "value");
        let canonical = value.canonical_string();
        assert_eq!(
            canonical,
            required(case, "canonical").as_str().expect("canonical"),
            "canonical mismatch: {id}"
        );
        assert_eq!(
            sha256_hex(canonical.as_bytes()),
            required(case, "sha256").as_str().expect("sha256"),
            "hash mismatch: {id}"
        );
    }
}

#[test]
fn c2_set_fact_transaction_matches_event_world_and_proof_root() {
    let input = vector("c2");
    let expected = required(&input, "expected");
    let mut world =
        NativeWorld::from_document(required(&input, "baseWorld").clone()).expect("base world");
    let event = world
        .commit_set_fact(required(&input, "transaction"), 32)
        .expect("native transaction");
    assert_eq!(
        event.canonical_string(),
        required(expected, "event").canonical_string()
    );
    assert_eq!(
        event.get("eventHash").and_then(JsonValue::as_str),
        required(expected, "eventAuthoritativeHash").as_str()
    );
    assert_eq!(
        world.structural_root(32).expect("proof root"),
        required(expected, "proofRoot").as_str().expect("root")
    );
    assert_eq!(
        world
            .current_fact("object:door", "state")
            .and_then(|fact| fact.get("value"))
            .and_then(JsonValue::as_str),
        Some("unlocked")
    );
    let mut document = world.into_document();
    if let Some(events) = document.get_mut("events") {
        *events = JsonValue::Array(Vec::new());
    }
    assert_eq!(
        document.canonical_string(),
        required(expected, "afterWorld").canonical_string()
    );
}

#[test]
fn c3_scheduler_order_event_chain_and_final_reality_match() {
    let input = vector("c3");
    let expected = required(&input, "expected");
    let run = execute_causal_plan(
        required(&input, "baseWorld").clone(),
        required(&input, "plan"),
        required(&input, "targetTime")
            .as_u64()
            .expect("target time"),
    )
    .expect("causal plan");
    let expected_order = required(expected, "executionOrder")
        .as_array()
        .expect("execution order")
        .iter()
        .map(|value| value.as_str().expect("task id").to_owned())
        .collect::<Vec<_>>();
    assert_eq!(run.execution_order, expected_order);
    assert_eq!(
        run.world.document().canonical_string(),
        required(expected, "finalWorld").canonical_string()
    );
    assert_eq!(
        run.world.reality_hash(),
        required(expected, "finalRealityHash")
            .as_str()
            .expect("reality hash")
    );
}

#[test]
fn c4_generation_integrity_and_store_first_recovery_match() {
    let input = vector("c4");
    let expected = required(&input, "expected");
    let root =
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../conformance/fixtures/c4-door-store");
    let report = verify_continuity_fixture(&root).expect("C4 store verification");
    assert_eq!(
        report.generation_id,
        required(required(expected, "afterGeneration"), "generationId")
            .as_str()
            .expect("generation id")
    );
    assert_eq!(report.revision, 1);
    assert_eq!(report.door_state, "unlocked");
    assert_eq!(
        report.evidence_root,
        required(expected, "evidenceRoot")
            .as_str()
            .expect("evidence root")
    );
    assert_eq!(
        u64::try_from(report.object_count).expect("object count fits u64"),
        required(expected, "objectCount")
            .as_u64()
            .expect("object count")
    );
}

fn temporary_store(label: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("time after epoch")
        .as_nanos();
    std::env::temp_dir().join(format!("rfe-{label}-{}-{nanos}", std::process::id()))
}

#[test]
fn c5_closed_reality_loop_matches_reference_vector() {
    use rfe_closed_loop::ClosedLoopStore;

    let input = {
        let source = include_str!("../../../conformance/vectors/c5-closed-reality-loop.json");
        parse_json(source).expect("C5 vector must be valid JSON")
    };
    let root = temporary_store("c5-vector");
    let mut store =
        ClosedLoopStore::bootstrap(&root, required(&input, "bootstrap")).expect("bootstrap store");
    let result = store
        .run_intent("branch:main", required(&input, "intent"))
        .expect("closed reality loop");
    let expected = required(&input, "expected");
    for field in [
        "initialView",
        "plans",
        "events",
        "generationIds",
        "views",
        "finalView",
        "feedback",
        "finalGeneration",
        "metrics",
    ] {
        assert_eq!(
            required(&result, field).canonical_string(),
            required(expected, field).canonical_string(),
            "C5 mismatch in {field}"
        );
    }
    assert!(!root.join("world.json").exists());
    assert_eq!(store.metrics().full_world_materializations, 0);
    assert_eq!(store.metrics().max_decision_semantic_groups, 7);
    std::fs::remove_dir_all(root).expect("remove C5 store");
}

#[test]
fn c5_crash_before_pointer_swap_preserves_previous_authority() {
    use rfe_closed_loop::{ClosedLoopStore, CrashPoint};

    let input = parse_json(include_str!(
        "../../../conformance/vectors/c5-closed-reality-loop.json"
    ))
    .expect("C5 vector");
    let root = temporary_store("c5-before-swap");
    let mut store =
        ClosedLoopStore::bootstrap(&root, required(&input, "bootstrap")).expect("bootstrap");
    let plan = store
        .resolve_next_action("branch:main", required(&input, "intent"))
        .expect("resolve unlock");
    let failure = store
        .commit_action(
            "branch:main",
            required(&input, "intent"),
            &plan,
            CrashPoint::BeforePointerSwap,
        )
        .expect_err("crash must be injected");
    assert_eq!(failure.code, "CRASH_INJECTED_BEFORE_POINTER_SWAP");
    let recovered = store
        .observe("branch:main", required(&input, "intent"))
        .expect("recover old authority");
    assert_eq!(required(&recovered, "revision").as_u64(), Some(0));
    assert_eq!(
        required(&recovered, "visibleFacts")
            .as_array()
            .expect("facts")[0]
            .get("value")
            .and_then(JsonValue::as_str),
        Some("locked")
    );
    std::fs::remove_dir_all(root).expect("remove before-swap store");
}

#[test]
fn c5_crash_after_pointer_swap_recovers_new_authority() {
    use rfe_closed_loop::{ClosedLoopStore, CrashPoint};

    let input = parse_json(include_str!(
        "../../../conformance/vectors/c5-closed-reality-loop.json"
    ))
    .expect("C5 vector");
    let root = temporary_store("c5-after-swap");
    let mut store =
        ClosedLoopStore::bootstrap(&root, required(&input, "bootstrap")).expect("bootstrap");
    let plan = store
        .resolve_next_action("branch:main", required(&input, "intent"))
        .expect("resolve unlock");
    let failure = store
        .commit_action(
            "branch:main",
            required(&input, "intent"),
            &plan,
            CrashPoint::AfterPointerSwap,
        )
        .expect_err("crash must be injected");
    assert_eq!(failure.code, "CRASH_INJECTED_AFTER_POINTER_SWAP");
    let mut reopened = ClosedLoopStore::open(&root).expect("reopen store");
    let recovered = reopened
        .observe("branch:main", required(&input, "intent"))
        .expect("recover new authority");
    assert_eq!(required(&recovered, "revision").as_u64(), Some(1));
    assert_eq!(
        required(&recovered, "visibleFacts")
            .as_array()
            .expect("facts")[0]
            .get("value")
            .and_then(JsonValue::as_str),
        Some("unlocked")
    );
    std::fs::remove_dir_all(root).expect("remove after-swap store");
}

#[test]
fn c5_authority_events_replay_to_final_semantic_root() {
    use rfe_closed_loop::{replay_semantic_root, ClosedLoopStore};

    let input = parse_json(include_str!(
        "../../../conformance/vectors/c5-closed-reality-loop.json"
    ))
    .expect("C5 vector");
    let root = temporary_store("c5-replay");
    let mut store =
        ClosedLoopStore::bootstrap(&root, required(&input, "bootstrap")).expect("bootstrap");
    let result = store
        .run_intent("branch:main", required(&input, "intent"))
        .expect("closed loop");
    let replayed = replay_semantic_root(required(&input, "bootstrap"), required(&result, "events"))
        .expect("replay events");
    assert_eq!(
        replayed,
        required(required(&result, "finalGeneration"), "semanticRoot")
            .as_str()
            .expect("semantic root")
    );
    std::fs::remove_dir_all(root).expect("remove replay store");
}

#[test]
fn c6_multi_subject_session_matches_reference_vector() {
    use rfe_multi_session::{PersistentMultiSession, SessionCrashPoint};

    let input = parse_json(include_str!(
        "../../../conformance/vectors/c6-multi-subject-session.json"
    ))
    .expect("C6 vector must be valid JSON");
    let root = temporary_store("c6-session");
    let mut runtime = PersistentMultiSession::bootstrap(
        &root,
        required(&input, "bootstrap"),
        required(&input, "session"),
    )
    .expect("bootstrap C6 session");
    let result = runtime
        .run_session(required(&input, "session"), SessionCrashPoint::None)
        .expect("run C6 session");
    assert_eq!(
        result.canonical_string(),
        required(&input, "expected").canonical_string()
    );
    assert_eq!(
        required(required(&result, "metrics"), "rounds").as_u64(),
        Some(3)
    );
    assert_eq!(
        required(required(&result, "metrics"), "acceptedCommits").as_u64(),
        Some(4)
    );
    assert_eq!(
        required(required(&result, "metrics"), "conflictRejections").as_u64(),
        Some(2)
    );
    assert_eq!(
        required(
            required(&result, "observerIsolation"),
            "crossSubjectRelationLeaks"
        )
        .as_u64(),
        Some(0)
    );
    std::fs::remove_dir_all(root).expect("remove C6 store");
}

#[test]
fn c6_checkpoint_reopens_and_resumes_without_semantic_drift() {
    use rfe_multi_session::{PersistentMultiSession, SessionCrashPoint};

    let input = parse_json(include_str!(
        "../../../conformance/vectors/c6-multi-subject-session.json"
    ))
    .expect("C6 vector");
    let root = temporary_store("c6-resume");
    let mut runtime = PersistentMultiSession::bootstrap(
        &root,
        required(&input, "bootstrap"),
        required(&input, "session"),
    )
    .expect("bootstrap C6 session");
    let failure = runtime
        .run_session(
            required(&input, "session"),
            SessionCrashPoint::AfterRoundCheckpoint(1),
        )
        .expect_err("session crash must be injected");
    assert_eq!(failure.code, "SESSION_CRASH_INJECTED_AFTER_CHECKPOINT");
    let checkpoint = runtime
        .checkpoint("session:door-lab:alice-bob")
        .expect("checkpoint after round one");
    assert_eq!(required(&checkpoint, "round").as_u64(), Some(1));
    drop(runtime);

    let mut reopened = PersistentMultiSession::open(&root).expect("reopen C6 session");
    let result = reopened
        .run_session(required(&input, "session"), SessionCrashPoint::None)
        .expect("resume C6 session");
    assert_eq!(
        result.canonical_string(),
        required(&input, "expected").canonical_string()
    );
    std::fs::remove_dir_all(root).expect("remove resumed C6 store");
}

#[test]
fn c6_shared_event_sequence_is_unique_and_monotonic() {
    use rfe_multi_session::{PersistentMultiSession, SessionCrashPoint};

    let input = parse_json(include_str!(
        "../../../conformance/vectors/c6-multi-subject-session.json"
    ))
    .expect("C6 vector");
    let root = temporary_store("c6-event-sequence");
    let mut runtime = PersistentMultiSession::bootstrap(
        &root,
        required(&input, "bootstrap"),
        required(&input, "session"),
    )
    .expect("bootstrap C6 session");
    let result = runtime
        .run_session(required(&input, "session"), SessionCrashPoint::None)
        .expect("run C6 session");
    let sequence = required(required(&result, "metrics"), "sharedEventSequence")
        .as_array()
        .expect("shared event sequence")
        .iter()
        .map(|value| value.as_u64().expect("sequence number"))
        .collect::<Vec<_>>();
    assert_eq!(sequence, vec![1, 2, 3, 4]);
    std::fs::remove_dir_all(root).expect("remove event sequence store");
}
