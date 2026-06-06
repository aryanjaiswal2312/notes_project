import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Settings({ settings, updateSettings, setMessage }) {
  const [form, setForm] = useState(settings || {});

  useEffect(() => {
    setForm(settings || {});
  }, [settings]);

  async function save(event) {
    event.preventDefault();
    const updated = await api.settings.update(form);
    updateSettings(updated);
    setMessage("Settings saved.");
  }

  return (
    <form className="page-stack" onSubmit={save}>
      <section className="panel form-panel">
        <div className="panel-head">
          <h2>App Settings</h2>
          <button className="primary-button" type="submit">
            <Save size={16} />
            Save
          </button>
        </div>
        <div className="settings-list">
          <label className="setting-row">
            <span>Theme</span>
            <select value={form.theme || "light"} onChange={(event) => setForm({ ...form, theme: event.target.value })}>
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </label>
          <label className="setting-row">
            <span>Compact Mode</span>
            <input type="checkbox" checked={Boolean(form.compactMode)} onChange={(event) => setForm({ ...form, compactMode: event.target.checked })} />
          </label>
          <label className="setting-row">
            <span>Notifications</span>
            <input
              type="checkbox"
              checked={form.notifications !== false}
              onChange={(event) => setForm({ ...form, notifications: event.target.checked })}
            />
          </label>
        </div>
      </section>
    </form>
  );
}
