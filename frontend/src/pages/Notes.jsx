import { Archive, Edit3, FilePlus2, Pin, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import RichTextEditor from "../components/RichTextEditor";
import SectionModal from "../components/SectionModal";

const blankNote = { title: "", category: "", sectionId: "", tags: "", content: "", pinned: false };

export default function Notes({ setMessage }) {
  const [sections, setSections] = useState([]);
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [sectionModal, setSectionModal] = useState(null);
  const [noteForm, setNoteForm] = useState(blankNote);
  const [editingId, setEditingId] = useState("");

  useEffect(() => {
    loadSections();
    loadNotes();
  }, []);

  useEffect(() => {
    loadNotes({ search: query, sectionId: selectedSection });
  }, [selectedSection]);

  async function loadSections() {
    setSections(await api.sections.list());
  }

  async function loadNotes(params = {}) {
    setNotes(await api.notes.list(params));
  }

  async function searchNotes(event) {
    event?.preventDefault();
    await loadNotes({ search: query, sectionId: selectedSection });
  }

  async function saveSection(form) {
    if (form.id) await api.sections.update(form.id, form);
    else await api.sections.create(form);
    setSectionModal(null);
    await loadSections();
    setMessage("Section saved.");
  }

  async function saveNote(event) {
    event.preventDefault();
    const body = {
      ...noteForm,
      tags: noteForm.tags,
      content: noteForm.content || "<p></p>"
    };

    if (editingId) {
      await api.notes.update(editingId, body);
      setMessage("Note updated.");
    } else {
      await api.notes.create(body);
      setMessage("Note created.");
    }

    setEditingId("");
    setNoteForm(blankNote);
    await loadNotes({ search: query, sectionId: selectedSection });
  }

  function editNote(note) {
    setEditingId(note.id);
    setNoteForm({ ...note, tags: (note.tags || []).join(", ") });
  }

  async function deleteNote(id) {
    if (!window.confirm("Delete note?")) return;
    await api.notes.remove(id);
    await loadNotes({ search: query, sectionId: selectedSection });
    setMessage("Note deleted.");
  }

  async function archiveSection(id) {
    await api.sections.archive(id, true);
    await loadSections();
    if (selectedSection === id) setSelectedSection("");
    setMessage("Section archived.");
  }

  const currentSection = useMemo(() => sections.find((section) => section.id === selectedSection), [sections, selectedSection]);

  return (
    <div className="page-stack notes-page">
      <section className="section-strip">
        <button className="add-section-box" type="button" onClick={() => setSectionModal({})}>
          <Plus size={22} />
          <span>Add New Section</span>
        </button>
        {sections.map((section) => (
          <article className={selectedSection === section.id ? "section-pill active" : "section-pill"} key={section.id}>
            <button type="button" onClick={() => setSelectedSection(section.id)}>
              <strong>{section.title}</strong>
              <span>{section.purpose || "Learning objective"}</span>
            </button>
            <div>
              <button className="icon-button" type="button" onClick={() => setSectionModal(section)} title="Edit">
                <Edit3 size={15} />
              </button>
              <button className="icon-button" type="button" onClick={() => archiveSection(section.id)} title="Archive">
                <Archive size={15} />
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="two-column notes-layout">
        <form className="panel note-editor-panel" onSubmit={saveNote}>
          <div className="panel-head">
            <h2>{editingId ? "Edit Note" : "Create Note"}</h2>
            <button className="primary-button" type="submit">
              <FilePlus2 size={16} />
              Save
            </button>
          </div>
          <div className="form-grid compact">
            <label>
              Title
              <input value={noteForm.title} onChange={(event) => setNoteForm({ ...noteForm, title: event.target.value })} required />
            </label>
            <label>
              Category
              <input value={noteForm.category || ""} onChange={(event) => setNoteForm({ ...noteForm, category: event.target.value })} />
            </label>
            <label>
              Section
              <select value={noteForm.sectionId || ""} onChange={(event) => setNoteForm({ ...noteForm, sectionId: event.target.value })}>
                <option value="">No section</option>
                {sections.map((section) => (
                  <option value={section.id} key={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tags
              <input value={noteForm.tags || ""} onChange={(event) => setNoteForm({ ...noteForm, tags: event.target.value })} />
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={Boolean(noteForm.pinned)} onChange={(event) => setNoteForm({ ...noteForm, pinned: event.target.checked })} />
              Pinned
            </label>
          </div>
          <RichTextEditor value={noteForm.content} onChange={(content) => setNoteForm((current) => ({ ...current, content }))} />
        </form>

        <section className="panel note-list-panel">
          <div className="panel-head">
            <div>
              <h2>{currentSection?.title || "All Notes"}</h2>
              <span>{notes.length} saved</span>
            </div>
          </div>
          <form className="inline-search" onSubmit={searchNotes}>
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes" />
            <button className="secondary-button" type="submit">
              Search
            </button>
          </form>
          <div className="note-list">
            {notes.map((note) => (
              <article className="note-card" key={note.id}>
                <div className="note-head">
                  <div>
                    <h3>{note.title}</h3>
                    <span>{note.category || "General"}</span>
                  </div>
                  {note.pinned && <Pin size={15} />}
                </div>
                <div className="note-preview" dangerouslySetInnerHTML={{ __html: note.content }} />
                <div className="tag-row">
                  {(note.tags || []).map((tag) => (
                    <b key={tag}>{tag}</b>
                  ))}
                </div>
                <div className="button-row">
                  <button className="secondary-button" type="button" onClick={() => editNote(note)}>
                    <Edit3 size={15} />
                    Edit
                  </button>
                  <button className="danger-button" type="button" onClick={() => deleteNote(note.id)}>
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {!notes.length && <p className="empty-state">No notes found.</p>}
          </div>
        </section>
      </section>

      {sectionModal && <SectionModal section={sectionModal.id ? sectionModal : null} onClose={() => setSectionModal(null)} onSave={saveSection} />}
    </div>
  );
}
