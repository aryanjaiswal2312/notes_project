import { X } from "lucide-react";
import { useEffect, useState } from "react";

const blank = { title: "", purpose: "", description: "" };

export default function SectionModal({ section, onClose, onSave }) {
  const [form, setForm] = useState(blank);

  useEffect(() => {
    setForm(section || blank);
  }, [section]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form
        className="modal-card"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="modal-head">
          <h2>{section?.id ? "Edit Section" : "Add New Section"}</h2>
          <button className="icon-button close-button" type="button" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <label>
          Title
          <input value={form.title} onChange={(event) => update("title", event.target.value)} required />
        </label>
        <label>
          Purpose
          <input value={form.purpose || ""} onChange={(event) => update("purpose", event.target.value)} />
        </label>
        <label>
          Description
          <textarea value={form.description || ""} onChange={(event) => update("description", event.target.value)} rows={5} />
        </label>
        <button className="primary-button" type="submit">
          Save Section
        </button>
      </form>
    </div>
  );
}
