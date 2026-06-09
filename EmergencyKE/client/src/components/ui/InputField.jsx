import { useState } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";

function getStrength(pw) {
  if (!pw) return { level: 0, label: "", color: "var(--line)" };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: "Weak",   color: "#E74C3C" };
  if (score === 2) return { level: 2, label: "Fair",   color: "#F39C12" };
  if (score === 3) return { level: 3, label: "Good",   color: "#1E8449" };
  return              { level: 4, label: "Strong", color: "#1A5276" };
}

export default function InputField({
  id,
  label,
  type        = "text",
  placeholder = "",
  value,
  onChange,
  icon:   Icon,
  hint,
  autoComplete,
  autoFocus   = false,
  invalid     = false,
  error,
  showStrength = false,
  confirmValue,
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType  = isPassword ? (show ? "text" : "password") : type;
  const strength   = showStrength ? getStrength(value) : null;
  const mismatch   = confirmValue !== undefined && confirmValue !== "" && confirmValue !== value;

  return (
    <div className="field">

      {/* Label */}
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
          {hint && <span className="field-hint">{hint}</span>}
        </label>
      )}

      {/* Input */}
      <div className="input-wrap">
        {Icon && (
          <span className="input-icon">
            <Icon size={15} />
          </span>
        )}
        <input
          id={id}
          name={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={invalid || mismatch ? "invalid" : ""}
        />
        {isPassword && (
          <button type="button" className="input-eye"
            onClick={() => setShow(!show)}
            aria-label={show ? "Hide password" : "Show password"}>
            {show ? <HiEyeOff size={17} /> : <HiEye size={17} />}
          </button>
        )}
      </div>

      {/* Password strength bar */}
      {showStrength && value.length > 0 && (
        <div className="strength-bar">
          {[1,2,3,4].map(i => (
            <div key={i} className="strength-seg"
              style={{ background: i <= strength.level ? strength.color : "var(--line)" }} />
          ))}
          <span className="strength-lbl" style={{ color: strength.color }}>
            {strength.label}
          </span>
        </div>
      )}

      {/* Mismatch error */}
      {mismatch && (
        <p className="field-error">Passwords do not match</p>
      )}

      {/* Custom error */}
      {error && <p className="field-error">{error}</p>}

    </div>
  );
}