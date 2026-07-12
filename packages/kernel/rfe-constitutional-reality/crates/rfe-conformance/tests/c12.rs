use rfe_canonical::{parse_json, JsonValue};
use rfe_constitutional_reality::ConstitutionalCoordinator;
use std::time::{SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value.get(key).unwrap_or_else(|| panic!("missing {key}"))
}

#[test]
fn c12_constitutional_reality_vector_is_native_conformant() {
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c12-constitutional-reality.json"
    ))
    .expect("C12 vector");
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    let root = std::env::temp_dir().join(format!("rfe-conformance-c12-{nonce}"));
    let mut coordinator = ConstitutionalCoordinator::bootstrap(&root, &vector).expect("bootstrap");
    let actual = coordinator
        .run_acceptance_scenario(&vector)
        .expect("run C12");
    assert_eq!(
        actual.canonical_string(),
        required(&vector, "expected").canonical_string()
    );
    std::fs::remove_dir_all(root).expect("cleanup");
}
