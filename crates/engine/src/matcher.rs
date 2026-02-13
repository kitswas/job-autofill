use crate::dom::DomSnapshot;
use crate::state::{Action, ProfileData};
use strsim::levenshtein;

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

        for (field_key, key_list) in &keywords {
            for keyword in key_list {
                if levenshtein(&text, keyword) <= 2 {
                    // Fuzzy threshold
                    let value = match *field_key {
                        "full_name" => profile.full_name.as_ref(),
                        "email" => profile.email.as_ref(),
                        "phone" => profile.phone.as_ref(),
                        _ => None,
                    };
                    if let Some(val) = value {
                        let selector = if let Some(id) = &field.id {
                            format!("#{}", id)
                        } else if let Some(name) = &field.name {
                            format!("[name=\"{}\"]", name)
                        } else {
                            continue; // No selector
                        };
                        actions.push(Action {
                            selector,
                            action: "set_value".to_string(),
                            payload: val.clone(),
                        });
                        break; // Matched, move to next field
                    }
                }
            }
        }
    }

    actions
}
