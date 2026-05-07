export default function Button({
  children,
  onClick,
  variant = "primary",
  style = {},
}) {
  const base = {
    padding: "10px 22px",
    borderRadius: "8px",
    fontSize: "13px",
    fontFamily: "'Space Mono', monospace",
    cursor: "pointer",
    border: "1px solid",
    transition: "all .2s",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    ...style,
  };

  const variants = {
    primary: {
      background: "var(--cyan)",
      color: "#000",
      borderColor: "var(--cyan)",
      fontWeight: 700,
    },
    secondary: {
      background: "transparent",
      color: "var(--text2)",
      borderColor: "var(--border2)",
    },
    purple: {
      background: "rgba(168,85,247,.15)",
      color: "var(--purple)",
      borderColor: "rgba(168,85,247,.4)",
    },
  };

  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}
