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

  return (
    <main
      style={{ padding: "16px", fontFamily: "sans-serif", maxWidth: "400px" }}
    >
      <h1>Job Autofill</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>Profiles</h2>
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
