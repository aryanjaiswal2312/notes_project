import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";

const blank = { title: "", details: "", dueDate: "", priority: "medium" };

export default function Tasks({ setMessage }) {
  const [payload, setPayload] = useState({ tasks: [], summary: { total: 0, completed: 0, pending: 0, completionPercentage: 0 } });
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setPayload(await api.tasks.list());
  }

  async function save(event) {
    event.preventDefault();
    if (editingId) await api.tasks.update(editingId, form);
    else await api.tasks.create(form);
    setForm(blank);
    setEditingId("");
    await loadTasks();
    setMessage("Daily target updated.");
  }

  function edit(task) {
    setEditingId(task.id);
    setForm({ title: task.title, details: task.details, dueDate: task.dueDate, priority: task.priority });
  }

  async function complete(task) {
    await api.tasks.complete(task.id, !task.completed);
    await loadTasks();
  }

  async function remove(id) {
    if (!window.confirm("Delete task?")) return;
    await api.tasks.remove(id);
    await loadTasks();
    setMessage("Task deleted.");
  }

  return (
    <div className="page-stack">
      <section className="dashboard-grid compact-cards">
        <Stat label="Total" value={payload.summary.total} />
        <Stat label="Complete" value={payload.summary.completed} />
        <Stat label="Pending" value={payload.summary.pending} />
        <Stat label="Progress" value={`${payload.summary.completionPercentage}%`} />
      </section>

      <section className="two-column tasks-layout">
        <form className="panel" onSubmit={save}>
          <div className="panel-head">
            <h2>{editingId ? "Edit Task" : "Create Task"}</h2>
            <button className="primary-button" type="submit">
              <Plus size={16} />
              Save
            </button>
          </div>
          <label>
            Task
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </label>
          <label>
            Details
            <textarea value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} rows={4} />
          </label>
          <div className="form-grid compact">
            <label>
              Due Date
              <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
            </label>
            <label>
              Priority
              <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </label>
          </div>
        </form>

        <section className="panel">
          <div className="panel-head">
            <h2>Daily Summary</h2>
            <span>{payload.summary.completionPercentage}%</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${payload.summary.completionPercentage}%` }} />
          </div>
          <div className="task-list">
            {payload.tasks.map((task) => (
              <article className={`task-row ${task.completed ? "completed" : ""}`} key={task.id}>
                <button className="check-button" type="button" onClick={() => complete(task)} title="Mark complete">
                  <Check size={16} />
                </button>
                <div>
                  <h3>{task.title}</h3>
                  <p>{task.details}</p>
                  <span className={`priority ${task.priority}`}>{task.priority}</span>
                </div>
                <button className="icon-button" type="button" onClick={() => edit(task)} title="Edit">
                  <Pencil size={16} />
                </button>
                <button className="icon-button danger" type="button" onClick={() => remove(task.id)} title="Delete">
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
