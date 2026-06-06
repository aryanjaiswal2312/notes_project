import { Activity, Ban, CheckCircle2, Search, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Admin({ setMessage }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load(nextSearch = search) {
    const [nextStats, nextUsers, nextActivity] = await Promise.all([api.admin.stats(), api.admin.users(nextSearch), api.admin.activity()]);
    setStats(nextStats);
    setUsers(nextUsers);
    setActivity(nextActivity);
  }

  async function openUser(id) {
    setSelected(await api.admin.user(id));
  }

  async function toggleStatus(user) {
    const status = user.status === "disabled" ? "active" : "disabled";
    await api.admin.status(user.id, status);
    await load();
    setMessage(`User ${status}.`);
  }

  async function deleteUser(id) {
    if (!window.confirm("Delete user and related data?")) return;
    await api.admin.removeUser(id);
    setSelected(null);
    await load();
    setMessage("User deleted.");
  }

  async function updateUser(id, body) {
    await api.admin.updateUser(id, body);
    setSelected(await api.admin.user(id));
    await load();
    setMessage("User updated.");
  }

  return (
    <div className="page-stack admin-page">
      <section className="dashboard-grid compact-cards">
        <AdminStat icon={UserRound} label="Total Users" value={stats?.totalUsers || 0} />
        <AdminStat icon={CheckCircle2} label="Active Users" value={stats?.activeUsers || 0} />
        <AdminStat icon={Ban} label="Disabled Users" value={stats?.disabledUsers || 0} />
        <AdminStat icon={Activity} label="Activity" value={stats?.activityEvents || 0} />
      </section>

      <section className="two-column admin-layout">
        <div className="panel">
          <div className="panel-head">
            <h2>User Management</h2>
            <ShieldCheck size={18} />
          </div>
          <form
            className="inline-search"
            onSubmit={(event) => {
              event.preventDefault();
              load(search);
            }}
          >
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" />
            <button className="secondary-button" type="submit">
              Search
            </button>
          </form>
          <div className="user-table">
            {users.map((user) => (
              <div className="user-row" key={user.id}>
                <button type="button" onClick={() => openUser(user.id)}>
                  <strong>{user.fullName}</strong>
                  <span>{user.email}</span>
                </button>
                <span className={`status-pill ${user.status}`}>{user.status}</span>
                <button className="icon-button" type="button" onClick={() => toggleStatus(user)} title={user.status === "disabled" ? "Enable" : "Disable"}>
                  {user.status === "disabled" ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                </button>
                <button className="icon-button danger" type="button" onClick={() => deleteUser(user.id)} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>{selected ? "User Details" : "Activity Monitoring"}</h2>
          </div>
          {selected ? (
            <UserDetails payload={selected} onSave={updateUser} />
          ) : (
            <div className="activity-list">
              {activity.slice(0, 12).map((event) => (
                <div className="activity-row" key={event.id}>
                  <span>{event.type.replace(/_/g, " ")}</span>
                  <strong>{event.user?.fullName || "Unknown"}</strong>
                  <em>{new Date(event.createdAt).toLocaleString()}</em>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {!!stats?.mostActiveUsers?.length && (
        <section className="panel">
          <div className="panel-head">
            <h2>Most Active Users</h2>
          </div>
          <div className="list-grid compact-list">
            {stats.mostActiveUsers.map((item) => (
              <article className="item-card" key={item.user.id}>
                <h3>{item.user.fullName}</h3>
                <p>{item.events} events</p>
                <span className="muted">
                  {item.notesCreated} notes, {item.filesUploaded} files, {item.tasksCompleted} tasks
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AdminStat({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function UserDetails({ payload, onSave }) {
  const [form, setForm] = useState({
    fullName: payload.user.fullName,
    email: payload.user.email,
    role: payload.user.role,
    status: payload.user.status
  });
  const taskCompleted = payload.tasks.filter((task) => task.completed).length;

  useEffect(() => {
    setForm({
      fullName: payload.user.fullName,
      email: payload.user.email,
      role: payload.user.role,
      status: payload.user.status
    });
  }, [payload.user]);

  return (
    <div className="user-details">
      <form
        className="admin-edit-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(payload.user.id, form);
        }}
      >
        <label>
          Full Name
          <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>
        <div className="form-grid compact">
          <label>
            Role
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
        </div>
        <button className="primary-button" type="submit">
          Save User
        </button>
      </form>
      <div className="summary-row">
        <span>Role</span>
        <strong>{payload.user.role}</strong>
      </div>
      <div className="summary-row">
        <span>Profile Customizations</span>
        <strong>{payload.profile?.customSections?.length || 0}</strong>
      </div>
      <div className="summary-row">
        <span>Notes Created</span>
        <strong>{payload.notes.length}</strong>
      </div>
      <div className="summary-row">
        <span>Files Uploaded</span>
        <strong>{payload.gallery.length}</strong>
      </div>
      <div className="summary-row">
        <span>Tasks Completed</span>
        <strong>{taskCompleted}</strong>
      </div>
      <div className="activity-list">
        {payload.activity.slice(0, 8).map((event) => (
          <div className="activity-row" key={event.id}>
            <span>{event.type.replace(/_/g, " ")}</span>
            <em>{new Date(event.createdAt).toLocaleString()}</em>
          </div>
        ))}
      </div>
    </div>
  );
}
