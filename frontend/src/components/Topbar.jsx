import { Moon, Search, Settings, SlidersHorizontal, Sun, UserRound } from "lucide-react";
import { assetUrl } from "../api/client";

export default function Topbar({ user, profile, activePage, setActivePage, settings, onThemeToggle }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{activePage.replace(/^\w/, (letter) => letter.toUpperCase())}</p>
        <h1>{activePage === "dashboard" ? "Study Dashboard" : pageTitle(activePage)}</h1>
      </div>

      <div className="topbar-actions">
        <label className="search-shell">
          <Search size={17} />
          <input aria-label="Quick search" placeholder="Search" />
        </label>
        <button className="icon-button" type="button" onClick={onThemeToggle} title="Toggle theme">
          {settings?.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="profile-chip" type="button" onClick={() => setActivePage("profile")} title="Profile">
          <span className="avatar-mini">{profile?.avatarUrl ? <img src={assetUrl(profile.avatarUrl)} alt="" /> : <UserRound size={16} />}</span>
          <span>{user?.fullName}</span>
        </button>
        <div className="right-menu" aria-label="Dashboard menu">
          <button type="button" onClick={() => setActivePage("profile")} title="Profile">
            <UserRound size={16} />
          </button>
          <button type="button" onClick={() => setActivePage("settings")} title="Settings">
            <Settings size={16} />
          </button>
          <button type="button" onClick={() => setActivePage("customization")} title="Customization">
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

function pageTitle(page) {
  const titles = {
    profile: "Profile",
    customization: "Profile Settings",
    notes: "Notes",
    tasks: "Daily Target",
    gallery: "Gallery",
    settings: "App Settings",
    admin: "Admin Dashboard"
  };

  return titles[page] || "Dashboard";
}
