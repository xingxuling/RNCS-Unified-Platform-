use rfe_canonical::{parse_json, JsonValue};
use rfe_replicated_authority::ReplicatedAuthorityCluster;
use std::time::{SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value
        .get(key)
        .unwrap_or_else(|| panic!("missing key: {key}"))
}

#[test]
fn c7_replicated_authority_matches_reference_vector() {
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c7-replicated-authority.json"
    ))
    .expect("C7 vector");
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    let root = std::env::temp_dir().join(format!("rfe-c7-conformance-{nonce}"));
    let cluster = ReplicatedAuthorityCluster::bootstrap(
        &root,
        required(&vector, "bootstrap"),
        required(&vector, "session"),
        required(&vector, "cluster"),
    )
    .expect("bootstrap C7 cluster");
    let result = cluster.run_acceptance_scenario().expect("run C7 scenario");
    assert_eq!(
        result.canonical_string(),
        required(&vector, "expected").canonical_string()
    );
    assert_eq!(
        required(&result, "replicatedAuthorityResultHash").as_str(),
        Some("61b2bbd1b98ceb14f3027eba05b22f83c93df4e47171f49bc3acf52682d7f3ec")
    );
    std::fs::remove_dir_all(root).expect("remove C7 conformance store");
}
