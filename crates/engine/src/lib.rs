use wasm_bindgen::prelude::*;

mod dom;
mod matcher;
mod state;

#[wasm_bindgen]
pub fn analyze_form(dom_payload: &str, profile_payload: &str) -> String {
    let _ = (dom_payload, profile_payload);
    serde_json::json!({
        "actions": []
    })
    .to_string()
}
