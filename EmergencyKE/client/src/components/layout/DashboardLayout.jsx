import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  MdOutlineEmergency, MdDashboard, MdPeople,
  MdAssignment, MdBarChart, MdLogout,
  MdNotifications, MdMenu, MdClose,
} from "react-icons/md";

const NAV = {
  community_member: [
    { label: "Report Emergency", icon: MdOutlineEmergency, path: "/"           },
    { label: "My Reports",       icon: MdAssignment,       path: "/my-reports" },
  ],
  volunteer: [
    { label: "Dashboard",        icon: MdDashboard,        path: "/volunteer"           },
    { label: "Report Emergency", icon: MdOutlineEmergency, path: "/report"     },
    { label: "Active Incidents", icon: MdOutlineEmergency, path: "/volunteer" },
    { label: "My History",       icon: MdAssignment,       path: "/volunteer/history"   },
  ],
  admin: [
    { label: "Dashboard",  icon: MdDashboard,  path: "/admin"           },
    { label: "Incidents",  icon: MdAssignment, path: "/admin/incidents" },
    { label: "Volunteers", icon: MdPeople,     path: "/admin/volunteers"},
    { label: "Users",      icon: MdPeople,     path: "/admin/users"     },
    { label: "Analytics",  icon: MdBarChart,   path: "/admin/analytics" },
  ],
};

export default function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [open, setOpen]  = useState(false);

  const navItems = NAV[user?.role] ?? [];
  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();

  const handleLogout = () => { logout(); navigate("/login"); };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="dash-logo">
        <div className="dash-logo-icon">
          <MdOutlineEmergency size={18} />
        </div>
        <span className="dash-logo-name">
          Emergency<span>KE</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="dash-nav">
        {navItems.map(({ label, icon: Icon, path }) => (
          <button key={path}
            className={`dash-nav-item${location.pathname === path ? " active" : ""}`}
            onClick={() => { navigate(path); setOpen(false); }}>
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      {/* User + logout */}
      <div className="dash-sidebar-footer">
        <div className="dash-user">
          <div className="dash-avatar">{initials}</div>
          <div>
            <div className="dash-user-name">{user?.full_name}</div>
            <div className="dash-user-role">{user?.role?.replace("_", " ")}</div>
          </div>
        </div>
        <button className="dash-nav-item" onClick={handleLogout}
          style={{ color: "#fca5a5" }}>
          <MdLogout size={17} />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="dash-layout">

      {/* Desktop sidebar */}
      <aside className="dash-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="dash-overlay" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`dash-drawer${open ? " open" : ""}`}>
        <button className="dash-drawer-close" onClick={() => setOpen(false)}>
          <MdClose size={22} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="dash-main">
        <div className="dash-topbar">
          {/* Hamburger — mobile only */}
          <button className="dash-hamburger" onClick={() => setOpen(true)}>
            <MdMenu size={24} />
          </button>
          <h1 className="dash-page-title">{title}</h1>
          <button className="btn btn-ghost" style={{ color: "var(--muted)", fontSize: 22 }}>
            <MdNotifications size={22} />
          </button>
        </div>
        <div className="dash-content">
          {children}
        </div>
      </main>

    </div>
  );
}