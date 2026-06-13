import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdPeople, MdAssignment, MdVolunteerActivism,
  MdBarChart, MdWarning, MdCheckCircle,
} from "react-icons/md";
import { getAnalytics } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout title="Admin Dashboard">
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</p>
    </DashboardLayout>
  );

  const stats = [
    { label: 'Total Incidents',   value: data?.incidents?.total_incidents ?? 0,  icon: MdAssignment,      bg: '#dbeafe', color: '#2563eb' },
    { label: 'Resolved',          value: data?.incidents?.resolved ?? 0,          icon: MdCheckCircle,     bg: '#d1fae5', color: '#059669' },
    { label: 'Active Volunteers', value: data?.volunteers?.active ?? 0,           icon: MdVolunteerActivism, bg: '#ede9fe', color: '#7c3aed' },
    { label: 'Pending Approvals', value: data?.volunteers?.pending ?? 0,          icon: MdWarning,         bg: '#fef3c7', color: '#d97706' },
    { label: 'Total Users',       value: data?.users?.total_users ?? 0,           icon: MdPeople,          bg: '#fce7f3', color: '#db2777' },
    { label: 'Avg Response (min)',value: data?.incidents?.avg_resolution_minutes
        ? Math.round(data.incidents.avg_resolution_minutes) : '—',
      icon: MdBarChart, bg: '#e0f2fe', color: '#0284c7' },
  ];

  return (
    <DashboardLayout title="Admin Dashboard">

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Pending Volunteer Approvals', value: data?.volunteers?.pending ?? 0,
            color: '#d97706', bg: '#fef3c7', path: '/admin/volunteers?status=pending',
            urgent: (data?.volunteers?.pending ?? 0) > 0 },
          { label: 'Active Incidents',            value: data?.incidents?.in_progress ?? 0,
            color: '#2563eb', bg: '#dbeafe', path: '/admin/incidents?status=in_progress',
            urgent: false },
        ].map(card => (
          <div key={card.label}
            onClick={() => navigate(card.path)}
            style={{
              background: card.urgent ? card.bg : 'var(--white)',
              border: `1.5px solid ${card.urgent ? card.color : 'var(--line)'}`,
              borderRadius: 'var(--radius-lg)', padding: 20,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            <div style={{ fontSize: 28, fontWeight: 800,
              color: card.urgent ? card.color : 'var(--navy)' }}>
              {card.value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              {card.label}
            </div>
            {card.urgent && card.value > 0 && (
              <div style={{ fontSize: 11, color: card.color, marginTop: 6,
                fontWeight: 600 }}>
                Action required →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Incidents by category */}
      {data?.incidents?.by_category?.length > 0 && (
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Incidents by Category</span>
            <button className="btn btn-ghost btn-sm"
              onClick={() => navigate('/admin/incidents')}>
              View all
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Count</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {data.incidents.by_category.map(row => (
                <tr key={row.category}>
                  <td style={{ textTransform: 'capitalize' }}>
                    {row.category?.replace('_', ' ')}
                  </td>
                  <td style={{ fontWeight: 600 }}>{row.count}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        height: 6, borderRadius: 3, background: '#2563eb',
                        width: `${Math.round((row.count / data.incidents.total_incidents) * 100)}%`,
                        minWidth: 4,
                      }} />
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {Math.round((row.count / data.incidents.total_incidents) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </DashboardLayout>
  );
}