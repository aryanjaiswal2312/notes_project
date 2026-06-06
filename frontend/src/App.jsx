import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import Sidebar from "./components/Sidebar";
import TimerWidget from "./components/TimerWidget";
import Topbar from "./components/Topbar";
import WelcomeModal from "./components/WelcomeModal";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Customization from "./pages/Customization";
import Dashboard from "./pages/Dashboard";
import Gallery from "./pages/Gallery";
import Notes from "./pages/Notes";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Tasks from "./pages/Tasks";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState({ theme: "light", compactMode: false, notifications: true });
  const [activePage, setActivePageState] = useState(sessionStorage.getItem("activePage") || "dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.auth
      .me()
      .then((payload) => {
        if (payload.user) applyPayload(payload);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings?.theme || "light";
    document.documentElement.dataset.compact = settings?.compactMode ? "true" : "false";
  }, [settings]);

  const setMessage = useCallback((text, type = "success") => {
    setToast({ text, type });
    window.clearTimeout(window.__studentMessageTimer);
    window.__studentMessageTimer = window.setTimeout(() => setToast(null), 2000);
  }, []);

  useEffect(() => {
    function showGlobalError(event) {
      const message = event.reason?.message || event.error?.message || event.message || "Something went wrong.";
      setMessage(message, "error");
    }

    window.addEventListener("unhandledrejection", showGlobalError);
    window.addEventListener("error", showGlobalError);

    return () => {
      window.removeEventListener("unhandledrejection", showGlobalError);
      window.removeEventListener("error", showGlobalError);
    };
  }, [setMessage]);

  const setActivePage = useCallback((page) => {
    setActivePageState(page);
    sessionStorage.setItem("activePage", page);
  }, []);

  function applyPayload(payload) {
    setUser(payload.user);
    setProfile(payload.profile);
    setSettings({ theme: "light", compactMode: false, notifications: true, ...(payload.settings || {}) });
  }

  function handleAuth(payload) {
    applyPayload(payload);
    setActivePage("dashboard");
    setWelcomeOpen(true);
  }

  async function logout() {
    await api.auth.logout();
    setUser(null);
    setProfile(null);
    setActivePage("dashboard");
  }

  function refreshProfile(updated) {
    setProfile(updated);
    if (updated?.fullName) setUser((current) => ({ ...current, fullName: updated.fullName }));
  }

  function updateSettings(updated) {
    setSettings((current) => ({ ...current, ...updated }));
  }

  async function toggleTheme() {
    const next = { ...settings, theme: settings.theme === "dark" ? "light" : "dark" };
    updateSettings(await api.settings.update(next));
  }

  const page = useMemo(() => {
    const props = { profile, setActivePage, setMessage };
    switch (activePage) {
      case "profile":
        return <Profile {...props} refreshProfile={refreshProfile} />;
      case "customization":
        return <Customization profile={profile} refreshProfile={refreshProfile} setMessage={setMessage} />;
      case "notes":
        return <Notes setMessage={setMessage} />;
      case "tasks":
        return <Tasks setMessage={setMessage} />;
      case "gallery":
        return <Gallery setMessage={setMessage} />;
      case "settings":
        return <Settings settings={settings} updateSettings={updateSettings} setMessage={setMessage} />;
      case "admin":
        return user?.role === "admin" ? <Admin setMessage={setMessage} /> : <Dashboard {...props} />;
      default:
        return <Dashboard {...props} />;
    }
  }, [activePage, profile, settings, setActivePage, setMessage, user?.role]);

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-mark">SN</div>
      </main>
    );
  }

  if (!user) {
    return (
      <>
        <Auth onAuth={handleAuth} setMessage={setMessage} />
        {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}
      </>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        user={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onLogout={logout}
      />
      <main className="workspace">
        <Topbar user={user} profile={profile} activePage={activePage} setActivePage={setActivePage} settings={settings} onThemeToggle={toggleTheme} />
        {page}
      </main>
      <TimerWidget />
      {welcomeOpen && <WelcomeModal user={user} onClose={() => setWelcomeOpen(false)} />}
      {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}
    </div>
  );
}
