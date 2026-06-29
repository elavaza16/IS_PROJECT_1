import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MdArrowBack, MdCheckCircle, MdCancel } from "react-icons/md";
import { approveVolunteer, rejectVolunteer } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import API from "../../services/api";

export default function AdminVolunteerDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [vol,      setVol]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState('');
  const [ok,       setOk]       = useState('');
  const [modal,    setModal]    = useState(null);
  const [reason,   setReason]   = useState('');

  const load = () => {
    API.get(`/admin/volunteers/${id}`)
      .then(({ data }) => setVol(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleApprove = async () => {
    try {
      await approveVolunteer(id);
      setOk('Volunteer approved successfully.');
      setModal(null);
      load();
    } catch (err) {
      setErr(err.response?.data?.error || 'Approval failed.');
      setModal(null);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    try {
      await rejectVolunteer(id, { reason });
      setOk('Application rejected.');
      setModal(null);
      load();
    } catch (err) {
      setErr(err.response?.data?.error || 'Rejection failed.');
      setModal(null);
    }
  };

  const DOC_LABELS = {
    national_id:       'National ID',
    drivers_licence:   "Driver's Licence",
    number_plate:      'Number Plate',
    vehicle_insurance: 'Vehicle Insurance',
    first_aid_cert:    'First Aid Certificate',
    medical_cert:      'Medical Certificate',
  };

  if (loading) return (
    <DashboardLayout title="Volunteer Details">
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</p>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Volunteer Details">

      <button className="btn btn-ghost" style={{ marginBottom: 20 }}
        onClick={() => navigate('/admin/volunteers')}>
        <MdArrowBack size={16} /> Back to Volunteers
      </button>

      {err && <Alert type="error">{err}</Alert>}
      {ok  && <Alert type="success">{ok}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Profile */}
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Profile</span>
            <Badge status={vol?.status} />
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Full Name',    vol?.full_name],
              ['Email',        vol?.email],
              ['Phone',        vol?.phone],
              ['Tier',         vol?.tier?.replace('_', ' ')],
              ['Applied',      vol?.applied_at
                ? new Date(vol.applied_at).toLocaleDateString() : '—'],
              ['Approved',     vol?.approved_at
                ? new Date(vol.approved_at).toLocaleDateString() : '—'],
              ['Responses',    vol?.total_responses ?? 0],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex',
                justifyContent: 'space-between', borderBottom: '1px solid var(--line)',
                paddingBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600,
                  textTransform: 'capitalize' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          {vol?.status === 'pending' && (
            <div style={{ padding: '0 16px 16px', display: 'flex', gap: 10 }}>
              <Button variant="primary" onClick={() => setModal('approve')}
                style={{ flex: 1, background: 'var(--green)' }}>
                <MdCheckCircle size={16} /> Approve
              </Button>
              <Button variant="danger" onClick={() => { setModal('reject'); setReason(''); }}
                style={{ flex: 1 }}>
                <MdCancel size={16} /> Reject
              </Button>
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Submitted Documents</span>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vol?.documents?.length > 0 ? vol.documents.map(doc => (
              <div key={doc.document_id} style={{
                border: '1px solid var(--line)', borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {DOC_LABELS[doc.document_type] || doc.document_type}
                  </span>
                  <span style={{ fontSize: 11,
                    color: doc.is_verified ? 'var(--green)' : 'var(--muted)',
                    fontWeight: 600 }}>
                    {doc.is_verified ? '✓ Verified' : 'Pending'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4,
                  fontFamily: 'monospace' }}>
                  {doc.document_number || doc.file_path}
                </div>
                {doc.expiry_date && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            )) : (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                No documents submitted yet.
              </p>
            )}
          </div>
        </div>

        {/* Status log */}
        {vol?.logs?.length > 0 && (
          <div className="table-card" style={{ gridColumn: '1 / -1' }}>
            <div className="table-header">
              <span className="table-title">Status History</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Changed By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {vol.logs.map(log => (
                  <tr key={log.log_id}>
                    <td><Badge status={log.old_status} /></td>
                    <td><Badge status={log.new_status} /></td>
                    <td style={{ fontSize: 12 }}>{log.reason || '—'}</td>
                    <td style={{ fontSize: 12 }}>{log.changed_by_name}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Approve modal */}
      <Modal open={modal === 'approve'} onClose={() => setModal(null)}
        title="Approve Volunteer"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleApprove}
              style={{ background: 'var(--green)' }}>
              Confirm Approval
            </Button>
          </>
        }>
        <p style={{ fontSize: 14 }}>
          Approve <strong>{vol?.full_name}</strong> as a volunteer?
          Their account role will be upgraded immediately.
        </p>
      </Modal>

      {/* Reject modal */}
      <Modal open={modal === 'reject'} onClose={() => setModal(null)}
        title="Reject Application"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}
              disabled={!reason.trim()}>
              Confirm Rejection
            </Button>
          </>
        }>
        <p style={{ fontSize: 14, marginBottom: 14 }}>
          Reject <strong>{vol?.full_name}</strong>'s application?
          Please provide a reason.
        </p>
        <textarea
          placeholder="Reason for rejection..."
          value={reason} onChange={e => setReason(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '10px 12px',
            border: '1.5px solid var(--line)', borderRadius: 'var(--radius-md)',
            fontSize: 13, fontFamily: 'var(--font-base)', resize: 'vertical',
            outline: 'none' }}
        />
      </Modal>

    </DashboardLayout>
  );
}