import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdLocationOn, MdBadge, MdDirectionsCar, MdLocalHospital } from "react-icons/md";
import { applyVolunteer } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { reverseGeocode } from "../../utils/geocode";

export default function ApplyVolunteer() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tier:               '',
    latitude:           null,
    longitude:          null,
    national_id:        '',
    drivers_licence:    '',
    number_plate:       '',
    vehicle_insurance:  '',
    first_aid_cert:     '',
    declaration_signed: false,
  });
  const [loading,   setLoading]   = useState(false);
  const [locating,  setLocating]  = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [err,       setErr]       = useState('');
  const [ok,        setOk]        = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const isDriver      = form.tier === 'driver' || form.tier === 'both';
  const isResponder   = form.tier === 'first_responder' || form.tier === 'both';

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const name = await reverseGeocode(latitude, longitude);

        setForm(f => ({ ...f, latitude, longitude }));
        setPlaceName(name);
        setLocating(false);
      },
      () => { setLocating(false); }
    );
  };

  const validate = () => {
    if (!form.tier)                return 'Please select your volunteer tier.';
    if (!form.national_id.trim())  return 'National ID number is required.';
    if (isResponder && !form.first_aid_cert.trim())
      return 'First aid certificate number is required.';
    if (isDriver) {
      if (!form.drivers_licence.trim())   return "Driver's licence number is required.";
      if (!form.number_plate.trim())      return 'Vehicle number plate is required.';
      if (!form.vehicle_insurance.trim()) return 'Chassis number is required.';
    }
    if (!form.declaration_signed) return 'You must agree to the declaration.';
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) { setErr(error); return; }
    setLoading(true);
    try {
      await applyVolunteer(form);
      setOk('Application submitted successfully! Pending admin approval.');
    } catch (err) {
      setErr(err.response?.data?.error || 'Application failed. Please try again.');
      setLoading(false);
    }
  };

  if (ok) return (
    <DashboardLayout title="Application Submitted">
      <div style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>
        <Alert type="success">{ok}</Alert>
        <div style={{
          background: 'var(--grey-lt)', borderRadius: 'var(--radius-md)',
          padding: 20, marginBottom: 20,
        }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
            What happens next?
          </p>
          <ol style={{ paddingLeft: 20, fontSize: 13, color: 'var(--muted)', lineHeight: 2 }}>
            <li>An admin will review your application and documents</li>
            <li>You will be notified once approved or rejected</li>
            <li>Once approved your role upgrades to Volunteer</li>
            <li>You will then receive emergency alerts near your location</li>
          </ol>
        </div>
        <Button variant="primary" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Apply to Become a Volunteer">
      <div style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>

        <div style={{
          background: 'var(--blue-lt)', border: '1px solid #AED6F1',
          borderLeft: '3px solid var(--blue)', borderRadius: 'var(--radius-md)',
          padding: '12px 14px', marginBottom: 24, fontSize: 13, color: '#1A5276',
        }}>
          <strong>Note:</strong> Your application will be reviewed by an admin before
          activation. Please provide accurate information. False details will result in rejection.
        </div>

        {err && <Alert type="error">{err}</Alert>}

        <form onSubmit={submit}>

          {/* Tier */}
          <div className="field">
            <label className="field-label">
              Volunteer Tier <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                {
                  value: 'first_responder',
                  label: 'First Responder',
                  desc:  'Provide first aid at the scene. No vehicle required.',
                  icon:  MdLocalHospital,
                },
                {
                  value: 'driver',
                  label: 'Driver',
                  desc:  'Transport victims to hospital using your vehicle.',
                  icon:  MdDirectionsCar,
                },
                {
                  value: 'both',
                  label: 'Both',
                  desc:  'Provide first aid and transport victims.',
                  icon:  MdLocalHospital,
                },
              ].map(t => (
                <button key={t.value} type="button"
                  style={{
                    padding: '12px 14px', borderRadius: 'var(--radius-md)',
                    textAlign: 'left',
                    border: `2px solid ${form.tier === t.value ? 'var(--green)' : 'var(--line)'}`,
                    background: form.tier === t.value ? 'var(--green-xlt)' : 'var(--white)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setForm(f => ({ ...f, tier: t.value }))}>
                  <div style={{ fontWeight: 700, fontSize: 14,
                    color: form.tier === t.value ? 'var(--green)' : 'var(--navy)' }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    {t.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Personal Information */}
          <div style={{ borderTop: '1px solid var(--line)', margin: '20px 0',
            paddingTop: 20, fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
            Personal Information
          </div>

          <div className="field">
            <label className="field-label">
              National ID Number <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <div className="input-wrap">
              <span className="input-icon"><MdBadge size={15} /></span>
              <input name="national_id" type="text"
                placeholder="e.g. 12345678"
                value={form.national_id} onChange={handle} />
            </div>
          </div>

          {/* First aid cert — First Responder and Both only */}
          {isResponder && (
            <div className="field">
              <label className="field-label">
                First Aid Certificate Number <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <div className="input-wrap">
                <span className="input-icon"><MdLocalHospital size={15} /></span>
                <input name="first_aid_cert" type="text"
                  placeholder="e.g. FAC2024001234"
                  value={form.first_aid_cert} onChange={handle} />
              </div>
            </div>
          )}

          {/* Vehicle fields — Driver and Both only */}
          {isDriver && (
            <>
              <div style={{ borderTop: '1px solid var(--line)', margin: '20px 0',
                paddingTop: 20, fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
                Vehicle Information
              </div>

              <div className="field">
                <label className="field-label">
                  Driver's Licence Number <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <div className="input-wrap">
                  <span className="input-icon"><MdDirectionsCar size={15} /></span>
                  <input name="drivers_licence" type="text"
                    placeholder="e.g. DL123456"
                    value={form.drivers_licence} onChange={handle} />
                </div>
              </div>

              <div className="field">
                <label className="field-label">
                  Vehicle Number Plate <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <div className="input-wrap">
                  <span className="input-icon"><MdDirectionsCar size={15} /></span>
                  <input name="number_plate" type="text"
                    placeholder="e.g. KCA 123A"
                    value={form.number_plate} onChange={handle} />
                </div>
              </div>

              <div className="field">
                <label className="field-label">
                  Chassis Number <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <div className="input-wrap">
                  <span className="input-icon"><MdDirectionsCar size={15} /></span>
                  <input name="vehicle_insurance" type="text"
                    placeholder="e.g. KNHCE51H2C2123456"
                    value={form.vehicle_insurance} onChange={handle} />
                </div>
              </div>
            </>
          )}

          {/* Location */}
          <div style={{ borderTop: '1px solid var(--line)', margin: '20px 0',
            paddingTop: 20, fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
            Location
          </div>

          <div className="field">
            <label className="field-label">
              GPS Location
              <span className="field-hint">for proximity matching</span>
            </label>
            <Button variant="secondary" loading={locating}
              onClick={getLocation} type="button">
              <MdLocationOn size={16} />
              {form.latitude
                ? `Captured: ${placeName}`
                : 'Capture my GPS location'}
            </Button>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
              This helps match you to nearby emergencies. Optional but recommended.
            </p>
          </div>

          {/* Declaration */}
          <div style={{ borderTop: '1px solid var(--line)', margin: '20px 0',
            paddingTop: 20 }}>
            <div style={{
              background: 'var(--grey-lt)', borderRadius: 'var(--radius-md)',
              padding: 16, marginBottom: 16,
            }}>
              <p style={{ fontSize: 13, color: 'var(--navy)', lineHeight: 1.7,
                marginBottom: 12 }}>
                I declare that:
              </p>
              <ul style={{ paddingLeft: 20, fontSize: 13, color: 'var(--muted)',
                lineHeight: 2 }}>
                <li>All information provided above is true and accurate</li>
                <li>I am willing and physically able to respond to emergency alerts</li>
                <li>I understand my role as a community volunteer first responder</li>
                <li>I will respond promptly to alerts assigned to me</li>
                <li>I consent to my location being used for emergency matching</li>
              </ul>
            </div>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              <input type="checkbox"
                checked={form.declaration_signed}
                onChange={e => setForm(f => ({ ...f, declaration_signed: e.target.checked }))}
                style={{ accentColor: 'var(--red)', width: 16, height: 16 }}
              />
              I agree to the above declaration
            </label>
          </div>

          <Button type="submit" variant="primary" loading={loading}>
            Submit Volunteer Application
          </Button>

        </form>
      </div>
    </DashboardLayout>
  );
}