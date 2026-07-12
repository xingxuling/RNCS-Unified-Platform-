//! RFE native conformance report types.

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum ConformanceLevel {
    C0,
    C1,
    C2,
    C3,
    C4,
    C5,
    C6,
    C7,
    C8,
    C9,
    C10,
    C11,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LevelResult {
    pub level: ConformanceLevel,
    pub passed: usize,
    pub failed: usize,
    pub notes: Vec<String>,
}

impl LevelResult {
    #[must_use]
    pub fn ok(&self) -> bool {
        self.failed == 0
    }
}
