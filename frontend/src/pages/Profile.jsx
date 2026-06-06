import { Edit3, Mail, MapPin, Phone, Trash2, UserRound } from "lucide-react";
import { assetUrl, api } from "../api/client";

export default function Profile({ profile, refreshProfile, setActivePage, setMessage }) {
  async function clearProfile() {
    if (!window.confirm("Delete profile data?")) return;
    const updated = await api.profile.clear();
    refreshProfile(updated);
    setMessage("Profile data cleared.");
  }

  const avatar = profile?.avatarUrl ? assetUrl(profile.avatarUrl) : "";

  return (
    <div className="page-stack">
      <section className="profile-hero">
        <div className="profile-photo">{avatar ? <img src={avatar} alt="" /> : <UserRound size={46} />}</div>
        <div>
          <p className="eyebrow">Profile</p>
          <h2>{profile?.fullName || "Student"}</h2>
          <div className="profile-meta">
            <span>
              <Mail size={15} /> {profile?.email}
            </span>
            <span>
              <Phone size={15} /> {profile?.phone || "Phone missing"}
            </span>
            <span>
              <MapPin size={15} /> {profile?.address || "Address missing"}
            </span>
          </div>
        </div>
        <div className="profile-actions">
          <button className="primary-button" type="button" onClick={() => setActivePage("customization")}>
            <Edit3 size={16} />
            Edit
          </button>
          <button className="danger-button" type="button" onClick={clearProfile}>
            <Trash2 size={16} />
            Delete Data
          </button>
        </div>
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="panel-head">
            <h2>Bio</h2>
            <span>{profile?.completion || 0}%</span>
          </div>
          <p className={profile?.bio ? "" : "muted"}>{profile?.bio || "Missing information"}</p>
          <div className="progress-track">
            <span style={{ width: `${profile?.completion || 0}%` }} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Custom Fields</h2>
          </div>
          <TagGroup title="Skills" values={profile?.skills} />
          <TagGroup title="Strengths" values={profile?.strengths} />
          <TagGroup title="Expertise" values={profile?.expertise} />
          <TagGroup title="Interests" values={profile?.interests} />
          <TagGroup title="Knowledge" values={profile?.knowledgeAreas} />
        </div>
      </section>

      {!!profile?.customSections?.length && (
        <section className="list-grid">
          {profile.customSections.map((section) => (
            <article className="item-card" key={section.id}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function TagGroup({ title, values = [] }) {
  return (
    <div className="tag-group">
      <span>{title}</span>
      <div>
        {values.length ? values.map((value) => <b key={value}>{value}</b>) : <em>Missing</em>}
      </div>
    </div>
  );
}
