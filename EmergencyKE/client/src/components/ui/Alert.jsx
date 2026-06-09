const ICONS = {
  error:   "⚠",
  success: "✓",
  warning: "ℹ",
  info:    "ℹ",
};

export default function Alert({ type = "info", title, children }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`}>
      <span className="alert-icon">{ICONS[type]}</span>
      <div className="alert-body">
        {title && <div className="alert-title">{title}</div>}
        {children}
      </div>
    </div>
  );
}