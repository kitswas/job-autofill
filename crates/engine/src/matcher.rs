use crate::dom::DomSnapshot;
use crate::state::{Action, ProfileData};

pub fn match_fields(dom: &DomSnapshot, profile: &ProfileData) -> Vec<Action> {
    let mut actions = Vec::new();

    // Define keywords for each profile field
    let keywords = vec![
        (
            "full_name",
            vec!["name", "full name", "first name", "last name", "your name"],
        ),
        ("email", vec!["email", "e-mail", "email address"]),
        ("phone", vec!["phone", "telephone", "mobile", "cell"]),
    ];

    for field in &dom.fields {
        if field.kind != "input" && field.kind != "textarea" && field.kind != "select" {
            continue;
        }

        let text = format!(
            "{} {}",
            field.label.as_deref().unwrap_or(""),
            field.placeholder.as_deref().unwrap_or("")
        )
        .to_lowercase();

        let debug_msg = format!(
            "DEBUG: Checking field {} with text: '{}'",
            field.name.as_deref().unwrap_or("no-name"),
            text
        );
        web_sys::console::log_1(&debug_msg.into());

        for (field_key, key_list) in &keywords {
            for keyword in key_list {
                let keyword_debug = format!("DEBUG: Checking keyword '{}' in text", keyword);
                web_sys::console::log_1(&keyword_debug.into());

                if text.contains(keyword) {
                    let match_debug = format!(
                        "DEBUG: Found match for {} with keyword '{}'",
                        field_key, keyword
                    );
                    web_sys::console::log_1(&match_debug.into());

                    // Check if keyword appears in the field text
                    let value = match *field_key {
                        "full_name" => profile.full_name.as_ref(),
                        "email" => profile.email.as_ref(),
                        "phone" => profile.phone.as_ref(),
                        _ => None,
                    };
                    if let Some(val) = value {
                        let value_debug = format!("DEBUG: Have value '{}' for {}", val, field_key);
                        web_sys::console::log_1(&value_debug.into());

                        let selector = if let Some(id) = &field.id {
                            format!("#{}", id)
                        } else if let Some(name) = &field.name {
                            format!("[name=\"{}\"]", name)
                        } else {
                            let no_selector_debug =
                                "DEBUG: No id or name for selector, skipping".to_string();
                            web_sys::console::log_1(&no_selector_debug.into());
                            continue; // No selector
                        };
                        let selector_debug = format!("DEBUG: Created selector: {}", selector);
                        web_sys::console::log_1(&selector_debug.into());

                        actions.push(Action {
                            selector,
                            action: "set_value".to_string(),
                            payload: val.clone(),
                        });
                        break; // Matched, move to next field
                    } else {
                        let no_value_debug = format!("DEBUG: No value for {}", field_key);
                        web_sys::console::log_1(&no_value_debug.into());
                    }
                }
            }
        }
    }

    let actions_debug = format!("DEBUG: Returning {} actions", actions.len());
    web_sys::console::log_1(&actions_debug.into());
    actions
}
