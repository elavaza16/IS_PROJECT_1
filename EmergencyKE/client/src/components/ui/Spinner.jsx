export default function Spinner({ size = 16, color = "#fff" }) {
  return (
    <span style={{
      display:      "inline-block",
      width:        size,
      height:       size,
      borderRadius: "50%",
      border:       `2px solid ${color}33`,
      borderTopColor: color,
      animation:    "spin 0.6s linear infinite",
      flexShrink:   0,
    }} />
  );
}