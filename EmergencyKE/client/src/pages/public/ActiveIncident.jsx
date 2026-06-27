import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { MdSend } from "react-icons/md";
import { getMessages, sendMessage, cancelIncident } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";
import Alert from "../../components/ui/Alert";
import API from "../../services/api";

const CANCELLABLE = ['reported', 'dispatching', 'in_progress'];

export default function ActiveIncident() {
  const { id }         = useParams();
  const location       = useLocation();
  const { user }       = useAuth();
  const bottomRef      = useRef(null);

  const [incident,          setIncident]          = useState(null);
  const [messages,          setMessages]          = useState([]);
  const [text,              setText]              = useState('');
  const [sending,           setSending]           = useState(false);
  const [cancelling,        setCancelling]        = useState(false);
  const [volunteerCancelled, setVolunteerCancelled] = useState(false);
  const justReported = location.state?.justReported;

  // Track the previous status so we can detect a volunteer dropping the response
  const prevStatusRef = useRef(null);

  const isReporter   = incident && user && incident.reporter_id === user.id;
  const isTerminal   = incident && ['resolved', 'cancelled'].includes(incident.status);
  const canCancel    = isReporter && incident && CANCELLABLE.includes(incident.status);

  const loadIncident = () =>
    API.get(`/incidents/${id}`)
      .then(({ data }) => {
        const prev = prevStatusRef.current;
        // Volunteer cancelled: was being handled, now back to 'reported' unassigned.
        if (
          prev &&
          ['dispatching', 'in_progress'].includes(prev) &&
          data.status === 'reported' &&
          !data.assigned_volunteer
        ) {
          setVolunteerCancelled(true);
        }
        // A new volunteer picked it back up — clear the notice.
        if (data.status === 'in_progress' || data.status === 'dispatching') {
          setVolunteerCancelled(false);
        }
        prevStatusRef.current = data.status;
        setIncident(data);
      })
      .catch(console.error);

  // Fetch incident + poll every 10s so status changes (volunteer cancelling,
  // a new volunteer accepting, resolution) show up live.
  useEffect(() => {
    loadIncident();
    const timer = setInterval(loadIncident, 10000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Poll messages every 5 seconds
  useEffect(() => {
    const load = () =>
      getMessages(id)
        .then(({ data }) => setMessages(data))
        .catch(() => {});
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [id]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage({ incident_id: id, content: text.trim() });
      setText('');
      getMessages(id).then(({ data }) => setMessages(data));
    } catch {
    } finally {
      setSending(false);
    }
  };

  const cancelReport = async () => {
    if (!window.confirm(
      'Cancel this report? Any responding volunteer will be told to stand down. This cannot be undone.'
    )) return;
    setCancelling(true);
    try {
      await cancelIncident(id);
      await loadIncident();        // reflect the cancelled status immediately
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <DashboardLayout title="Active Incident">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {justReported && (
          <Alert type="success">
            Emergency reported successfully! Reference: <strong>{location.state?.reference}</strong>
          </Alert>
        )}

        {volunteerCancelled && (
          <Alert type="warning">
            The volunteer who was responding had to cancel. Your report is back in
            the queue and is being re-dispatched to other volunteers.
          </Alert>
        )}

        {incident?.status === 'cancelled' && (
          <Alert type="error">
            This report has been cancelled. No volunteers are responding.
          </Alert>
        )}

        {/* Incident details */}
        {incident && (
          <div className="table-card" style={{ marginBottom: 20 }}>
            <div className="table-header">
              <span className="table-title">Incident Details</span>
              <Badge status={incident.status} />
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Reference',  incident.reference_number],
                  ['Type',       incident.category?.replace('_',' ')],
                  ['Severity',   incident.severity],
                  ['Location', incident.location_text || (incident.latitude ? `${parseFloat(incident.latitude).toFixed(4)}, ${parseFloat(incident.longitude).toFixed(4)}` : '—')],
                  ['Reported',   new Date(incident.reported_at).toLocaleString()],
                  ['Status',     incident.status],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reporter-only: cancel a false / no-longer-needed report */}
            {canCancel && (
              <div style={{ padding: '0 16px 16px', textAlign: 'right' }}>
                <button
                  className="btn btn-sm"
                  onClick={cancelReport}
                  disabled={cancelling}
                  style={{ background: 'var(--red)', color: '#fff', border: 'none',
                    cursor: cancelling ? 'default' : 'pointer' }}>
                  {cancelling ? 'Cancelling…' : 'Cancel Report'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Chat */}
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Communication</span>
          </div>

          <div style={{ height: 300, overflowY: 'auto', padding: 16,
            display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center',
                marginTop: 'auto', marginBottom: 'auto' }}>
                No messages yet. A volunteer will contact you here once assigned.
              </p>
            )}
            {messages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.message_id} style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                }}>
                  <div style={{
                    background: isMe ? 'var(--red)' : 'var(--grey-lt)',
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

          {/* Message input — disabled once the incident is resolved or cancelled */}
          <form onSubmit={send} style={{ display: 'flex', gap: 10,
            padding: '12px 16px', borderTop: '1px solid var(--line)' }}>
            <input
              type="text"
              placeholder={isTerminal ? 'This incident is closed.' : 'Type a message...'}
              value={text} onChange={e => setText(e.target.value)}
              disabled={isTerminal}
              style={{ flex: 1, padding: '9px 12px',
                border: '1.5px solid var(--line)', borderRadius: 'var(--radius-md)',
                fontSize: 14, outline: 'none', fontFamily: 'var(--font-base)',
                background: isTerminal ? 'var(--grey-lt)' : '#fff' }}
            />
            <button type="submit" disabled={sending || !text.trim() || isTerminal}
              style={{ background: 'var(--red)', color: '#fff', border: 'none',
                borderRadius: 'var(--radius-md)', padding: '0 16px',
                cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <MdSend size={18} />
            </button>
          </form>
        </div>

      </div>
    </DashboardLayout>
  );
}