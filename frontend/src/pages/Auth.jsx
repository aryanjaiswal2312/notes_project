import { GraduationCap, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";

const initial = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "user"
};

export default function Auth({ onAuth, setMessage }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = mode === "login" ? await api.auth.login(form) : await api.auth.signup(form);
      onAuth(payload);
    } catch (err) {
      setError(err.message);
      setMessage?.(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <span className="brand-mark large">
            <GraduationCap size={30} />
          </span>
          <div>
            <p className="eyebrow">Student Workspace</p>
            <h1>Student Management & Note-Making Platform</h1>
          </div>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="segmented" role="tablist" aria-label="Authentication mode">
            <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
              <LogIn size={16} />
              Login
            </button>
            <button className={mode === "signup" ? "active" : ""} type="button" onClick={() => setMode("signup")}>
              <UserPlus size={16} />
              Signup
            </button>
          </div>

          {mode === "signup" && (
            <label>
              Full Name
              <input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} required />
            </label>
          )}

          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
          </label>

          <label>
            Password
            <input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} required />
          </label>

          {mode === "signup" && (
            <>
              <label>
                Confirm Password
                <input type="password" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} required />
              </label>
              <label>
                Role
                <select value={form.role} onChange={(event) => update("role", event.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </>
          )}

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button wide" type="submit" disabled={loading}>
            {loading ? "Please wait" : mode === "login" ? "Login" : "Create Account"}
          </button>

          <button className="text-button" type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Create New Account" : "Login Existing Account"}
          </button>
        </form>
      </section>
    </main>
  );
}
