import { useState, useEffect } from "react";

type Profile = {
  id: string;
  name: string;
  full_name?: string;
  email?: string;
  phone?: string;
};

type ProfilesData = {
  profiles: Record<string, Profile>;
  selectedProfileId: string | null;
};

export function App() {
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Load profiles from chrome storage
    chrome.storage.sync.get(["profiles", "selectedProfileId"], (result) => {
      if (result.profiles) {
        setProfiles(result.profiles);
      }
      if (result.selectedProfileId) {
        setSelectedProfileId(result.selectedProfileId);
      }
    });
  }, []);

  const saveProfiles = (
    newProfiles: Record<string, Profile>,
    newSelectedId: string | null,
  ) => {
    setProfiles(newProfiles);
    setSelectedProfileId(newSelectedId);
    chrome.storage.sync.set({
      profiles: newProfiles,
      selectedProfileId: newSelectedId,
    });
  };

  const createProfile = () => {
    const newProfile: Profile = {
      id: Date.now().toString(),
      name: "",
      full_name: "",
      email: "",
      phone: "",
    };
    setEditingProfile(newProfile);
    setIsCreating(true);
  };

  const editProfile = (profile: Profile) => {
    setEditingProfile({ ...profile });
    setIsCreating(false);
  };

  const saveProfile = () => {
    if (!editingProfile) return;

    const newProfiles = { ...profiles };
    newProfiles[editingProfile.id] = editingProfile;
    saveProfiles(newProfiles, selectedProfileId);
    setEditingProfile(null);
  };

  const deleteProfile = (id: string) => {
    const newProfiles = { ...profiles };
    delete newProfiles[id];
    let newSelectedId = selectedProfileId;
    if (selectedProfileId === id) {
      newSelectedId =
        Object.keys(newProfiles).length > 0
          ? Object.keys(newProfiles)[0]
          : null;
    }
    saveProfiles(newProfiles, newSelectedId);
  };

  const selectProfile = (id: string) => {
    saveProfiles(profiles, id);
  };

  // Run autofill end-to-end from the popup (doesn't rely on content script injection)
  const autofillActiveTab = async () => {
    if (!selectedProfileId) {
      alert("Select a profile first");
      return;
    }

    const profile = profiles[selectedProfileId];

    const tabs = await new Promise<chrome.tabs.Tab[]>((resolve) =>
      chrome.tabs.query({ active: true, currentWindow: true }, (t) =>
        resolve(t),
      ),
    );
    const tab = tabs[0];
    if (!tab?.id) {
      alert("No active tab");
      return;
    }

    // extract DOM snapshot from the page
    let domSnapshot: any = null;
    try {
      if ((chrome as any).scripting?.executeScript) {
        const results = await (chrome as any).scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const elements = Array.from(
              document.querySelectorAll("input, select, textarea"),
            );
            return {
              url: location.href,
              fields: elements.map((el) => ({
                id: el.id || null,
                name: el.getAttribute("name"),
                label: el.getAttribute("aria-label"),
                placeholder: el.getAttribute("placeholder"),
                kind: el.tagName.toLowerCase(),
              })),
            };
          },
        });
        domSnapshot = results[0].result;
      } else if ((chrome as any).tabs?.executeScript) {
        domSnapshot = await new Promise((resolve) =>
          chrome.tabs.executeScript(
            tab.id!,
            {
              code: `(() => { const elements = Array.from(document.querySelectorAll('input, select, textarea')); return JSON.stringify({url:location.href,fields: elements.map(el=>({id:el.id||null,name:el.getAttribute('name'),label:el.getAttribute('aria-label'),placeholder:el.getAttribute('placeholder'),kind:el.tagName.toLowerCase()}))}); })();`,
            },
            (res) => resolve(JSON.parse(res?.[0] ?? "{}")),
          ),
        );
      } else {
        alert("scripting.executeScript not available in this browser");
        return;
      }
    } catch (err) {
      console.error("extract DOM failed", err);
      alert("Failed to read page DOM — check console");
      return;
    }

    const domPayload = JSON.stringify(domSnapshot);
    const profilePayload = JSON.stringify({
      full_name: profile.full_name || null,
      email: profile.email || null,
      phone: profile.phone || null,
    });

    console.debug("[Job Autofill][popup] domPayload:", domPayload);
    console.debug("[Job Autofill][popup] profilePayload:", profilePayload);
    // Debug: show what we extracted
    const fieldSummary = domSnapshot.fields
      .map(
        (f) =>
          `${f.kind}[${f.name || f.id}]: "${f.label || ""}" "${f.placeholder || ""}"`,
      )
      .join("\n");
    alert(
      `Extracted ${domSnapshot.fields.length} fields:\n${fieldSummary}\n\nProfile: name=${profile.full_name}, email=${profile.email}, phone=${profile.phone}`,
    );
    const response: any = await new Promise((resolve) =>
      chrome.runtime.sendMessage(
        { type: "ANALYZE_FORM", domPayload, profilePayload },
        (res) => resolve(res),
      ),
    );

    console.debug("[Job Autofill][popup] analyzer response:", response);

    if (!response?.actions?.length) {
      alert(
        "Analyzer returned no actions — check background console and popup console",
      );
      return;
    }

    try {
      if ((chrome as any).scripting?.executeScript) {
        await (chrome as any).scripting.executeScript({
          target: { tabId: tab.id },
          args: [response.actions],
          func: (actions: any[]) => {
            for (const a of actions) {
              try {
                const t = document.querySelector(a.selector) as
                  | HTMLInputElement
                  | HTMLTextAreaElement
                  | HTMLSelectElement
                  | null;
                if (!t) continue;
                t.focus();
                (t as any).value = a.payload;
                t.dispatchEvent(new Event("input", { bubbles: true }));
                t.dispatchEvent(new Event("change", { bubbles: true }));
              } catch (e) {
                /* ignore per-field errors */
              }
            }
            return true;
          },
        });
      } else if ((chrome as any).tabs?.executeScript) {
        const code = `(() => { const actions = ${JSON.stringify(response.actions)}; for (const a of actions) { const t = document.querySelector(a.selector); if (!t) continue; t.focus(); t.value = a.payload; t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new Event('change', { bubbles: true })); } return true; })();`;
        await new Promise((resolve) =>
          chrome.tabs.executeScript(tab.id!, { code }, () => resolve(true)),
        );
      }
      alert("Autofill applied — check the page");
    } catch (err) {
      console.error("apply actions failed", err);
      alert("Failed to apply actions — check console");
    }
  };

  return (
    <main
      style={{ padding: "16px", fontFamily: "sans-serif", maxWidth: "400px" }}
    >
      <h1>Job Autofill</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>Profiles</h2>
        <div style={{ marginBottom: "8px" }}>
          <button onClick={autofillActiveTab}>
            Run autofill on active tab
          </button>
        </div>
        {Object.values(profiles).map((profile) => (
          <div
            key={profile.id}
            style={{
              border: "1px solid #ccc",
              padding: "8px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{profile.name || "Unnamed Profile"}</strong>
                {selectedProfileId === profile.id && (
                  <span style={{ color: "green" }}> (Selected)</span>
                )}
              </div>
              <div>
                <button onClick={() => selectProfile(profile.id)}>
                  Select
                </button>
                <button onClick={() => editProfile(profile)}>Edit</button>
                <button onClick={() => deleteProfile(profile.id)}>
                  Delete
                </button>
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              Name: {profile.full_name || "Not set"}
              <br />
              Email: {profile.email || "Not set"}
              <br />
              Phone: {profile.phone || "Not set"}
            </div>
          </div>
        ))}
        <button onClick={createProfile}>Create New Profile</button>
      </div>

      {editingProfile && (
        <div
          style={{
            border: "1px solid #000",
            padding: "16px",
            marginTop: "20px",
          }}
        >
          <h3>{isCreating ? "Create Profile" : "Edit Profile"}</h3>
          <div style={{ marginBottom: "8px" }}>
            <label>Profile Name: </label>
            <input
              type="text"
              value={editingProfile.name}
              onChange={(e) =>
                setEditingProfile({ ...editingProfile, name: e.target.value })
              }
            />
          </div>
          <div style={{ marginBottom: "8px" }}>
            <label>Full Name: </label>
            <input
              type="text"
              value={editingProfile.full_name || ""}
              onChange={(e) =>
                setEditingProfile({
                  ...editingProfile,
                  full_name: e.target.value,
                })
              }
            />
          </div>
          <div style={{ marginBottom: "8px" }}>
            <label>Email: </label>
            <input
              type="email"
              value={editingProfile.email || ""}
              onChange={(e) =>
                setEditingProfile({ ...editingProfile, email: e.target.value })
              }
            />
          </div>
          <div style={{ marginBottom: "8px" }}>
            <label>Phone: </label>
            <input
              type="tel"
              value={editingProfile.phone || ""}
              onChange={(e) =>
                setEditingProfile({ ...editingProfile, phone: e.target.value })
              }
            />
          </div>
          <button onClick={saveProfile}>Save</button>
          <button onClick={() => setEditingProfile(null)}>Cancel</button>
        </div>
      )}
    </main>
  );
}
