import {
  BookOpen,
  CheckCircle2,
  GalleryHorizontalEnd,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react";

const baseItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "customization", label: "Profile Settings", icon: Sparkles },
  { id: "notes", label: "Notes", icon: BookOpen },
  { id: "tasks", label: "Daily Target", icon: CheckCircle2 },
  { id: "gallery", label: "Gallery", icon: GalleryHorizontalEnd },
  { id: "settings", label: "App Settings", icon: Settings }
];

export default function Sidebar({ activePage, setActivePage, user, collapsed, setCollapsed, onLogout }) {
  const items = user?.role === "admin" ? [...baseItems, { id: "admin", label: "Admin", icon: ShieldCheck }] : baseItems;

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="brand-row">
        <button className="brand-mark" type="button" onClick={() => setActivePage("dashboard")} title="Dashboard">
          SN
        </button>
        {!collapsed && (
          <div>
            <strong>StudyNest</strong>
            <span>Notes & goals</span>
          </div>
        )}
        <button className="icon-button collapse-button" type="button" onClick={() => setCollapsed(!collapsed)} title="Toggle menu">
          <PanelLeftClose size={18} />
        </button>
      </div>

      <nav className="nav-list" aria-label="Main navigation">
        {items.map((item) => (
          <button
            className={activePage === item.id ? "nav-item active" : "nav-item"}
            type="button"
            key={item.id}
            onClick={() => setActivePage(item.id)}
            title={item.label}
          >
            <item.icon size={19} />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <button className="nav-item logout" type="button" onClick={onLogout} title="Logout">
        <LogOut size={19} />
        {!collapsed && <span>Logout</span>}
      </button>
    </aside>
  );
}
