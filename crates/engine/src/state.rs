use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileData {
    pub full_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
}
