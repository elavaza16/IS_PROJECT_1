import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MdSend, MdCheckCircle, MdCancel, MdLocationOn, MdPhone } from "react-icons/md";
import { acceptAlert, declineAlert, updateStatus, cancelResponse, getMessages, sendMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import API from "../../services/api";

export default function ActiveAlert() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const bottomRef  = useRef(null);

  const [incident,  setIncident]  = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [text,      setText]      = useState('');
  const [accepting,      setAccepting]      = useState(false);
  const [declining,      setDeclining]      = useState(false);
  const [resolving,      setResolving]      = useState(false);
  const [cancelling,     setCancelling]     = useState(false);
  const [cancelConfirm,  setCancelConfirm]  = useState(false);
  const [sending,   setSending]   = useState(false);
  const [err,       setErr]       = useState('');
  const [ok,        setOk]        = useState('');

  useEffect(() => {
    API.get(`/incidents/${id}`)
      .then(({ data }) => setIncident(data))
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    const load = () =>
      getMessages(id)
        .then(({ data }) => setMessages(data))
        .catch(() => {});
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptAlert(id);
      setOk('Alert accepted. Navigate to the scene.');
      API.get(`/incidents/${id}`).then(({ data }) => setIncident(data));
    } catch (err) {
      setErr(err.response?.data?.error || 'Failed to accept.');
      // Refresh incident in case someone else already took it
      API.get(`/incidents/${id}`).then(({ data }) => setIncident(data));
    } finally { setAccepting(false); }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      await declineAlert(id);
      navigate('/volunteer');
    } catch (err) {
      setErr(err.response?.data?.error || 'Failed to decline.');
      setDeclining(false);
    }
  };

  const handleCancelResponse = async () => {
    setCancelling(true);
    try {
      await cancelResponse(id);
      navigate('/volunteer/incidents');
    } catch (err) {
      setErr(err.response?.data?.error || 'Failed to cancel response.');
      setCancelling(false);
      setCancelConfirm(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await updateStatus(id, 'resolved');
      setOk('Incident marked as resolved.');
      setTimeout(() => navigate('/volunteer'), 2000);
    } catch (err) {
      setErr(err.response?.data?.error || 'Failed to resolve.');
      setResolving(false);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage({ incident_id: id, content: text.trim() });
      setText('');
      getMessages(id).then(({ data }) => setMessages(data));
    } catch {
    } finally { setSending(false); }
  };

  const isPending    = incident?.status === 'dispatching' || incident?.status === 'reported';
  const isInProgress = incident?.status === 'in_progress';
  const isTakenByOther = incident && incident.status === 'in_progress' &&
    incident.assigned_volunteer && incident.assigned_volunteer !== user?.volunteer_id;

  return (
    <DashboardLayout title="Incident Response">
      <div style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>

        {err && <Alert type="error">{err}</Alert>}
        {ok  && <Alert type="success">{ok}</Alert>}

        {/* Incident details */}
        {incident && (
          <div className="table-card" style={{ marginBottom: 16 }}>
            <div className="table-header">
              <span className="table-title">Incident Details</span>
              <Badge status={incident.status} />
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12,
                marginBottom: 16 }}>
                {[
                  ['Reference', incident.reference_number],
                  ['Type',      incident.category?.replace('_',' ')],
                  ['Severity',  incident.severity],
                  ['Reported',  new Date(incident.reported_at).toLocaleString()],
                  ['Reporter',  incident.reporter_name || '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Reporter phone — click to call */}
              {incident.reporter_phone && (
                <div style={{ background: 'var(--grey-lt)', borderRadius: 'var(--radius-md)',
                  padding: '10px 12px', marginBottom: 16, display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, color: 'var(--navy)' }}>
                    <MdPhone size={16} color="var(--green)" />
                    Reporter: {incident.reporter_phone}
                  </div>
                  <a href={`tel:${incident.reporter_phone}`} className="btn btn-secondary btn-sm">
                    Call Reporter
                  </a>
                </div>
              )}

              {/* Location + nav link */}
              <div style={{ background: 'var(--grey-lt)', borderRadius: 'var(--radius-md)',
                padding: '10px 12px', marginBottom: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, color: 'var(--navy)' }}>
                  <MdLocationOn size={16} color="var(--red)" />
                  {incident.location_text ||
                    (incident.latitude ? `${parseFloat(incident.latitude).toFixed(4)}, ${parseFloat(incident.longitude).toFixed(4)}` : '—')}
                </div>
                {incident.latitude && (
                  <a href={`https://www.google.com/maps?q=${parseFloat(incident.latitude)},${parseFloat(incident.longitude)}`}
                    target="_blank" rel="noreferrer"
                    className="btn btn-secondary btn-sm">
                    Navigate
                  </a>
                )}
              </div>

              {/* Already taken by another volunteer */}
              {isTakenByOther && (
                <Alert type="warning">
                  This incident has already been accepted by another volunteer.
                </Alert>
              )}

              {/* Action buttons */}
              {isPending && !isTakenByOther && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="primary" loading={accepting} onClick={handleAccept}
                    style={{ flex: 1 }}>
                    <MdCheckCircle size={18} /> Accept Alert
                  </Button>
                  <Button variant="danger" loading={declining} onClick={handleDecline}
                    style={{ flex: 1 }}>
                    <MdCancel size={18} /> Decline
                  </Button>
                </div>
              )}

              {isInProgress && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Button variant="primary" loading={resolving} onClick={handleResolve}
                    style={{ background: 'var(--green)' }}>
                    <MdCheckCircle size={18} /> Mark as Resolved
                  </Button>

                  {!cancelConfirm ? (
                    <button
                      onClick={() => setCancelConfirm(true)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, color: 'var(--muted)', textDecoration: 'underline',
                        padding: '4px 0', textAlign: 'center',
                      }}>
                      Cancel my response
                    </button>
                  ) : (
                    <div style={{
                      padding: '14px', background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 600,
                        color: 'var(--navy)', marginBottom: 10 }}>
                        Cancel your response?
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                        The incident will be returned to the queue so another volunteer can respond.
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="danger" loading={cancelling}
                          onClick={handleCancelResponse} style={{ flex: 1 }}>
                          Yes, cancel
                        </Button>
                        <Button variant="secondary"
                          onClick={() => setCancelConfirm(false)} style={{ flex: 1 }}>
                          Keep responding
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat — only show when in progress */}
        {(isInProgress || incident?.status === 'resolved') && (
          <div className="table-card">
            <div className="table-header">
              <span className="table-title">Communication with Reporter</span>
            </div>
            <div style={{ height: 280, overflowY: 'auto', padding: 16,
              display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center',
                  margin: 'auto' }}>
                  No messages yet. Send a message to the reporter.
                </p>
              )}
              {messages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.message_id}
                    style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                    <div style={{
                      background: isMe ? 'var(--green)' : 'var(--grey-lt)',
                      color: isMe ? '#fff' : 'var(--navy)',
                      padding: '8px 12px', borderRadius: 12,
                      borderBottomRightRadius: isMe ? 2 : 12,
                      borderBottomLeftRadius: isMe ? 12 : 2,
                      fontSize: 13, lineHeight: 1.4,
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)',
                      textAlign: isMe ? 'right' : 'left', marginTop: 2 }}>
                      {msg.sender_name} · {new Date(msg.sent_at).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {incident?.status !== 'resolved' && (
              <form onSubmit={send} style={{ display: 'flex', gap: 10,
                padding: '12px 16px', borderTop: '1px solid var(--line)' }}>
                <input type="text" placeholder="Type a message..."
                  value={text} onChange={e => setText(e.target.value)}
                  style={{ flex: 1, padding: '9px 12px',
                    border: '1.5px solid var(--line)', borderRadius: 'var(--radius-md)',
                    fontSize: 14, outline: 'none', fontFamily: 'var(--font-base)' }}
                />
                <button type="submit" disabled={sending || !text.trim()}
                  style={{ background: 'var(--green)', color: '#fff', border: 'none',
                    borderRadius: 'var(--radius-md)', padding: '0 16px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <MdSend size={18} />
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}