import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  MdOutlineEmergency, MdDashboard, MdPeople,
  MdAssignment, MdBarChart, MdLogout, MdNotifications,
} from "react-icons/md";

const NAV = {
  community_member: [
    { label: "Report Emergency", icon: MdOutlineEmergency, path: "/"           },
    { label: "My Reports",       icon: MdAssignment,       path: "/my-reports" },
  ],
  volunteer: [
    { label: "Dashboard",        icon: MdDashboard,        path: "/volunteer"          },
    { label: "Active Incidents", icon: MdOutlineEmergency, path: "/volunteer/incidents"},
    { label: "My History",       icon: MdAssignment,       path: "/volunteer/history"  },
  ],
  admin: [
    { label: "Dashboard",        icon: MdDashboard,  path: "/admin"              },
    { label: "Incidents",        icon: MdAssignment, path: "/admin/incidents"    },
    { label: "Volunteers",       icon: MdPeople,     path: "/admin/volunteers"   },
    { label: "Users",            icon: MdPeople,     path: "/admin/users"        },
    { label: "Analytics",        icon: MdBarChart,   path: "/admin/analytics"    },
  ],
};

export default function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const navItems = NAV[user?.role] ?? [];
  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="dash-layout">

      {/* Sidebar */}
      <aside className="dash-sidebar">

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
              onClick={() => navigate(path)}>
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        {/* User info + logout */}
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

      </aside>

      {/* Main */}
      <main className="dash-main">
        <div className="dash-topbar">
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