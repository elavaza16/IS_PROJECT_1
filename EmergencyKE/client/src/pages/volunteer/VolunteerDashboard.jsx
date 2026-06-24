import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdLocationOn,
  MdNotificationsActive, MdDirectionsRun, MdAssignment, MdCheckCircle,
} from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { getMyResponses } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";
import API from "../../services/api";

export default function VolunteerDashboard() {
  const navigate       = useNavigate();
  const { user }       = useAuth();
  const [alerts,    setAlerts]    = useState([]);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Poll for new alerts every 10 seconds
  // Only ever shows unclaimed incidents — reported/dispatching — never
  // in_progress or resolved, since those have already been claimed or closed.
  useEffect(() => {
    const load = () => {
      API.get('/incidents?excludeOwn=true&status=reported,dispatching')
        .then(({ data }) => setAlerts(Array.isArray(data) ? data : []))
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getMyResponses()
      .then(({ data }) => setHistory(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = history.filter(i => i.status === 'in_progress');
  const resolved = history.filter(i => i.status === 'resolved');

  return (
    <DashboardLayout title="Volunteer Dashboard">

      {/* Stats */}
      <div className="stat-grid">
        {[
          {
            label: 'Pending Alerts',
            value: alerts.length,
            color: '#f59e0b', bg: '#fef3c7',
            icon: MdNotificationsActive,
            to: '/volunteer/incidents',
          },
          {
            label: 'Active Incidents',
            value: active.length,
            color: '#10b981', bg: '#d1fae5',
            icon: MdDirectionsRun,
            to: '/volunteer/incidents',
          },
          {
            label: 'Total Responses',
            value: history.length,
            color: '#3b82f6', bg: '#dbeafe',
            icon: MdAssignment,
            to: '/volunteer/history',
          },
          {
            label: 'Resolved',
            value: resolved.length,
            color: '#8b5cf6', bg: '#ede9fe',
            icon: MdCheckCircle,
            to: '/volunteer/history',
          },
        ].map(s => (
          <div key={s.label} className="stat-card"
            onClick={() => navigate(s.to)}
            style={{ cursor: 'pointer' }}>
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

      {/* Incoming alerts */}
      {alerts.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>
              Incoming Alerts
            </span>
            {alerts.length > 3 ? (
              <button className="btn btn-ghost btn-sm"
                onClick={() => navigate('/volunteer/incidents')}>
                View all ({alerts.length})
              </button>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                Updates every 10 s
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.slice(0, 3).map(alert => (
              <div key={alert.incident_id} style={{
                background: '#fff',
                border: '1px solid var(--line)',
                borderLeft: '3px solid var(--red)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: 12,
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13,
                    color: 'var(--navy)', marginBottom: 3, textTransform: 'capitalize' }}>
                    {alert.category?.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)',
                    display: 'flex', alignItems: 'center', gap: 3,
                    overflow: 'hidden' }}>
                    <MdLocationOn size={11} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {alert.location_text ||
                        (alert.latitude
                          ? `${parseFloat(alert.latitude).toFixed(4)}, ${parseFloat(alert.longitude).toFixed(4)}`
                          : '—')}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                    {new Date(alert.reported_at).toLocaleTimeString()}
                  </div>
                </div>
                <button className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/volunteer/alert/${alert.incident_id}`)}>
                  Respond
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active incidents */}
      {active.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>
              Active Incidents
            </span>
            <button className="btn btn-ghost btn-sm"
              onClick={() => navigate('/volunteer/incidents')}>
              View all
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {active.map(i => (
              <div key={i.incident_id} style={{
                background: '#fff', border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)', padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13,
                    textTransform: 'capitalize', color: 'var(--navy)', marginBottom: 2 }}>
                    {i.category?.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--muted)' }}>
                    {i.reference_number}
                  </div>
                </div>
                <Badge status={i.status} />
                <button className="btn btn-ghost btn-sm"
                  onClick={() => navigate(`/volunteer/alert/${i.incident_id}`)}>
                  View →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}