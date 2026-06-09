import Spinner from "./Spinner";

export default function Button({
  children,
  variant  = "primary",
  size     = "",
  loading  = false,
  disabled = false,
  onClick,
  type     = "button",
  style,
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}${size ? ` btn-${size}` : ""}`}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
    >
      {loading ? <Spinner color={variant === "primary" ? "#fff" : "#C0392B"} /> : children}
    </button>
  );
}