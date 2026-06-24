import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  MdOutlineEmergency, MdDashboard, MdPeople,
  MdAssignment, MdBarChart, MdLogout,
  MdMenu, MdClose, MdNotifications, MdNotificationsNone,
} from "react-icons/md";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../services/api";

const NAV = {
  community_member: [
    { label: "Report Emergency", icon: MdOutlineEmergency, path: "/"           },
    { label: "My Reports",       icon: MdAssignment,       path: "/my-reports" },
  ],
  volunteer: [
    { label: "Dashboard",            icon: MdDashboard,        path: "/volunteer"           },
    { label: "Report Emergency",     icon: MdOutlineEmergency, path: "/report"              },
    { label: "My Reports",           icon: MdAssignment,       path: "/my-reports"          },
    { label: "Active Incidents",     icon: MdOutlineEmergency, path: "/volunteer/incidents" },
    { label: "My Response History",  icon: MdAssignment,       path: "/volunteer/history"   },
  ],
  admin: [
    { label: "Dashboard",  icon: MdDashboard,  path: "/admin"            },
    { label: "Incidents",  icon: MdAssignment, path: "/admin/incidents"  },
    { label: "Volunteers", icon: MdPeople,     path: "/admin/volunteers" },
    { label: "Users",      icon: MdPeople,     path: "/admin/users"      },
    { label: "Analytics",  icon: MdBarChart,   path: "/admin/analytics"  },
  ],
};

const TYPE_LABELS = {
  report_received:    'Report Received',
  new_alert:           'New Emergency Alert',
  volunteer_accepted:  'Volunteer Responding',
  incident_resolved:   'Incident Resolved',
  new_message:         'New Message',
};

export default function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [open, setOpen]  = useState(false);

  const [notifOpen,  setNotifOpen]  = useState(false);
  const [notifs,     setNotifs]     = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  const navItems = NAV[user?.role] ?? [];
  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();

  const handleLogout = () => { logout(); navigate("/login"); };

  // Poll notifications every 15 seconds
  useEffect(() => {
    const load = () => {
      getNotifications()
        .then(({ data }) => {
          setNotifs(data.notifications || []);
          setUnreadCount(data.unread_count || 0);
        })
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleNotif = () => setNotifOpen(o => !o);

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      await markNotificationRead(notif.notification_id);
      setNotifs(prev => prev.map(n =>
        n.notification_id === notif.notification_id ? { ...n, is_read: 1 } : n
      ));
      setUnreadCount(c => Math.max(0, c - 1));
    }
    if (notif.incident_id) {
      const path = user?.role === 'volunteer'
        ? `/volunteer/alert/${notif.incident_id}`
        : `/incident/${notif.incident_id}`;
      navigate(path);
      setNotifOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  };

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const SidebarContent = () => (
    <>
      <div className="dash-logo">
        <div className="dash-logo-icon">
          <MdOutlineEmergency size={18} />
        </div>
        <span className="dash-logo-name">
          Emergency<span>KE</span>
        </span>
      </div>

      <nav className="dash-nav">
        {navItems.map(({ label, icon: Icon, path }) => (
          <button key={label}
            className={`dash-nav-item${location.pathname === path ? " active" : ""}`}
            onClick={() => { navigate(path); setOpen(false); }}>
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

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

      <aside className="dash-sidebar">
        <SidebarContent />
      </aside>

      {open && (
        <div className="dash-overlay" onClick={() => setOpen(false)} />
      )}

      <aside className={`dash-drawer${open ? " open" : ""}`}>
        <button className="dash-drawer-close" onClick={() => setOpen(false)}>
          <MdClose size={22} />
        </button>
        <SidebarContent />
      </aside>

      <main className="dash-main">
        <div className="dash-topbar">
          <button className="dash-hamburger" onClick={() => setOpen(true)}>
            <MdMenu size={24} />
          </button>
          <h1 className="dash-page-title">{title}</h1>

          {/* Notification bell */}
          <div ref={panelRef} style={{ position: 'relative' }}>
            <button onClick={toggleNotif}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                position: 'relative', padding: 8, color: 'var(--navy)',
                display: 'flex', alignItems: 'center',
              }}>
              {unreadCount > 0 ? <MdNotifications size={22} /> : <MdNotificationsNone size={22} />}
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  background: 'var(--red)', color: '#fff',
                  borderRadius: '50%', minWidth: 16, height: 16,
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0,
                width: 320, maxHeight: 400, overflowY: 'auto',
                background: 'var(--white)', border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 50,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderBottom: '1px solid var(--line)',
                }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead}
                      style={{ background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 11, color: 'var(--blue)' }}>
                      Mark all read
                    </button>
                  )}
                </div>

                {notifs.length === 0 ? (
                  <p style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
                    No notifications yet.
                  </p>
                ) : (
                  notifs.map(n => (
                    <div key={n.notification_id}
                      onClick={() => handleNotifClick(n)}
                      style={{
                        padding: '12px 14px', cursor: 'pointer',
                        borderBottom: '1px solid var(--line)',
                        background: n.is_read ? 'var(--white)' : '#fef3c7',
                        display: 'flex', flexDirection: 'column', gap: 3,
                      }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>
                        {TYPE_LABELS[n.type] || n.type}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
                        {n.content}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                        {timeAgo(n.sent_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="dash-content">
          {children}
        </div>
      </main>

    </div>
  );
}