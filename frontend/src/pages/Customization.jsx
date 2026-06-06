import { Camera, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { assetUrl, api } from "../api/client";

const listFields = ["socialLinks", "skills", "strengths", "expertise", "interests", "knowledgeAreas"];

export default function Customization({ profile, refreshProfile, setMessage }) {
  const [form, setForm] = useState(profile || {});
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    const next = { ...(profile || {}) };
    listFields.forEach((field) => {
      next[field] = Array.isArray(next[field]) ? next[field].join(", ") : "";
    });
    setForm(next);
  }, [profile]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateCustom(index, field, value) {
    setForm((current) => {
      const customSections = [...(current.customSections || [])];
      customSections[index] = { ...customSections[index], [field]: value };
      return { ...current, customSections };
    });
  }

  async function save(event) {
    event.preventDefault();
    const body = { ...form };
    const updated = await api.profile.update(body);
    refreshProfile(updated);
    setMessage("Profile updated.");
  }

  async function uploadAvatar() {
    if (!avatarFile) return;
    const data = new FormData();
    data.append("avatar", avatarFile);
    const updated = await api.profile.avatar(data);
    refreshProfile(updated);
    setAvatarFile(null);
    setMessage("Profile picture updated.");
  }

  return (
    <form className="page-stack" onSubmit={save}>
      <section className="panel form-panel">
        <div className="panel-head">
          <h2>Profile Customization</h2>
          <button className="primary-button" type="submit">
            <Save size={16} />
            Save
          </button>
        </div>

        <div className="profile-edit-row">
          <div className="profile-photo small">
            {profile?.avatarUrl ? <img src={assetUrl(profile.avatarUrl)} alt="" /> : <Camera size={32} />}
          </div>
          <label className="file-control">
            <Camera size={17} />
            <span>{avatarFile?.name || "Profile Picture"}</span>
            <input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
          </label>
          <button className="secondary-button" type="button" onClick={uploadAvatar} disabled={!avatarFile}>
            Upload
          </button>
        </div>

        <div className="form-grid">
          <label>
            Full Name
            <input value={form.fullName || ""} onChange={(event) => update("fullName", event.target.value)} required />
          </label>
          <label>
            Email
            <input value={form.email || ""} disabled />
          </label>
          <label>
            Phone Number
            <input value={form.phone || ""} onChange={(event) => update("phone", event.target.value)} />
          </label>
          <label>
            Address
            <input value={form.address || ""} onChange={(event) => update("address", event.target.value)} />
          </label>
          <label className="span-2">
            Bio
            <textarea value={form.bio || ""} onChange={(event) => update("bio", event.target.value)} rows={4} />
          </label>
          <TextList label="Social Links" field="socialLinks" form={form} update={update} />
          <TextList label="Skills" field="skills" form={form} update={update} />
          <TextList label="Strengths" field="strengths" form={form} update={update} />
          <TextList label="Expertise" field="expertise" form={form} update={update} />
          <TextList label="Interests" field="interests" form={form} update={update} />
          <TextList label="Knowledge Areas" field="knowledgeAreas" form={form} update={update} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Custom Sections</h2>
          <button
            className="secondary-button"
            type="button"
            onClick={() => update("customSections", [...(form.customSections || []), { title: "", body: "" }])}
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        <div className="custom-section-list">
          {(form.customSections || []).map((section, index) => (
            <div className="custom-section-row" key={section.id || index}>
              <input placeholder="Title" value={section.title || ""} onChange={(event) => updateCustom(index, "title", event.target.value)} />
              <textarea placeholder="Description" value={section.body || ""} onChange={(event) => updateCustom(index, "body", event.target.value)} />
              <button
                className="icon-button danger"
                type="button"
                onClick={() =>
                  update(
                    "customSections",
                    (form.customSections || []).filter((_, currentIndex) => currentIndex !== index)
                  )
                }
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}

function TextList({ label, field, form, update }) {
  return (
    <label>
      {label}
      <input value={form[field] || ""} onChange={(event) => update(field, event.target.value)} />
    </label>
  );
}
