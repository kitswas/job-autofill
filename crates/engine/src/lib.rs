use wasm_bindgen::prelude::*;

mod dom;
mod matcher;
mod state;

#[wasm_bindgen]
pub fn analyze_form(dom_payload: &str, profile_payload: &str) -> String {
    let dom: Result<dom::DomSnapshot, _> = serde_json::from_str(dom_payload);
    let profile: Result<state::ProfileData, _> = serde_json::from_str(profile_payload);

    match (dom, profile) {
        (Ok(d), Ok(p)) => {
            let actions = matcher::match_fields(&d, &p);
            serde_json::json!({ "actions": actions }).to_string()
        }
        _ => serde_json::json!({ "actions": [] }).to_string(),
    }
}
