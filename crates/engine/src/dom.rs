use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomField {
    pub id: Option<String>,
    pub name: Option<String>,
    pub label: Option<String>,
    pub placeholder: Option<String>,
    pub kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomSnapshot {
    pub url: String,
    pub fields: Vec<DomField>,
}
