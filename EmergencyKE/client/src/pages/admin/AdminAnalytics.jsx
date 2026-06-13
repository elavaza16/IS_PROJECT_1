import { useState, useEffect } from "react";
import { getAnalytics } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

const BAR_COLORS = {
  road_accident:    '#f97316',
  medical_distress: '#ef4444',
  fire_hazard:      '#dc2626',
  security_threat:  '#7c3aed',
  other:            '#6b7280',
};

export default function AdminAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout title="Analytics">
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</p>
    </DashboardLayout>
  );

  const maxDay = Math.max(...(data?.incidents?.by_day?.map(d => d.count) ?? [1]));
  const maxCat = Math.max(...(data?.incidents?.by_category?.map(c => c.count) ?? [1]));

  return (
    <DashboardLayout title="Analytics">

      {/* Summary cards */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Incidents',      value: data?.incidents?.total_incidents ?? 0 },
          { label: 'Resolved',             value: data?.incidents?.resolved ?? 0 },
          { label: 'Avg Resolution (min)', value: data?.incidents?.avg_resolution_minutes
              ? Math.round(data.incidents.avg_resolution_minutes) : '—' },
          { label: 'Active Volunteers',    value: data?.volunteers?.active ?? 0 },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Incidents last 30 days */}
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Incidents — Last 30 Days</span>
          </div>
          <div style={{ padding: '16px 16px 8px', display: 'flex',
            alignItems: 'flex-end', gap: 4, height: 160 }}>
            {data?.incidents?.by_day?.map(d => (
              <div key={d.date} style={{ flex: 1, display: 'flex',
                flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{
                  width: '100%', background: '#2563eb',
                  borderRadius: '2px 2px 0 0',
                  height: `${Math.max((d.count / maxDay) * 100, 4)}px`,
                  minHeight: 4,
                  transition: 'height 0.3s',
                }} title={`${d.date}: ${d.count}`} />
              </div>
            ))}
            {(!data?.incidents?.by_day?.length) && (
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 'auto' }}>
                No data yet
              </p>
            )}
          </div>
          <div style={{ padding: '4px 16px 12px', fontSize: 10,
            color: 'var(--muted)', textAlign: 'right' }}>
            Each bar = 1 day
          </div>
        </div>

        {/* By category */}
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">By Category</span>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data?.incidents?.by_category?.map(row => (
              <div key={row.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  marginBottom: 4 }}>
                  <span style={{ fontSize: 12, textTransform: 'capitalize' }}>
                    {row.category?.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{row.count}</span>
                </div>
                <div style={{ background: 'var(--line)', borderRadius: 4, height: 8 }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: BAR_COLORS[row.category] || '#6b7280',
                    width: `${(row.count / maxCat) * 100}%`,
                    transition: 'width 0.4s',
                  }} />
                </div>
              </div>
            ))}
            {(!data?.incidents?.by_category?.length) && (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>No data yet</p>
            )}
          </div>
        </div>

        {/* Volunteer breakdown */}
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Volunteer Status Breakdown</span>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Active',    value: data?.volunteers?.active    ?? 0, color: '#059669' },
              { label: 'Pending',   value: data?.volunteers?.pending   ?? 0, color: '#d97706' },
              { label: 'Suspended', value: data?.volunteers?.suspended ?? 0, color: '#6b7280' },
              { label: 'Rejected',  value: data?.volunteers?.rejected  ?? 0, color: '#dc2626' },
            ].map(row => {
              const total = (data?.volunteers?.total_volunteers ?? 1);
              return (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{row.value}</span>
                  </div>
                  <div style={{ background: 'var(--line)', borderRadius: 4, height: 8 }}>
                    <div style={{
                      height: '100%', borderRadius: 4, background: row.color,
                      width: `${total > 0 ? (row.value / total) * 100 : 0}%`,
                      transition: 'width 0.4s',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident resolution */}
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Incident Resolution Rate</span>
          </div>
          <div style={{ padding: 16 }}>
            {[
              { label: 'Resolved',    value: data?.incidents?.resolved    ?? 0, color: '#059669' },
              { label: 'In Progress', value: data?.incidents?.in_progress ?? 0, color: '#2563eb' },
              { label: 'Reported',    value: data?.incidents?.reported    ?? 0, color: '#d97706' },
              { label: 'Cancelled',   value: data?.incidents?.cancelled   ?? 0, color: '#6b7280' },
            ].map(row => {
              const total = data?.incidents?.total_incidents ?? 1;
              return (
                <div key={row.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {row.value} ({total > 0 ? Math.round((row.value/total)*100) : 0}%)
                    </span>
                  </div>
                  <div style={{ background: 'var(--line)', borderRadius: 4, height: 8 }}>
                    <div style={{
                      height: '100%', borderRadius: 4, background: row.color,
                      width: `${total > 0 ? (row.value / total) * 100 : 0}%`,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}