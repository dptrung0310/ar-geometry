export default function Navbar() {
  return (
    <nav style={styles.nav}>
      {/* Logo */}
      <div style={styles.logo}>
        <svg width="20" height="20" viewBox="0 0 20 20">
          <polygon
            points="10,2 18,16 2,16"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="1.5"
          />
          <polygon points="10,6 15,14 5,14" fill="rgba(0,229,255,.15)" />
        </svg>
        AR<span style={{ color: "var(--purple)" }}>Math</span>3D
      </div>

      {/* AR badge */}
      <div style={styles.badge}>
        <span style={styles.badgeDot} />
        AR Mode
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: "60px",
    background: "rgba(5,7,15,0.92)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    padding: "0 24px",
    gap: 0,
  },
  logo: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "15px",
    color: "var(--cyan)",
    letterSpacing: "1px",
    marginRight: "auto",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
  },
  links: {
    display: "flex",
    gap: "2px",
  },
  link: {
    padding: "6px 14px",
    borderRadius: "6px",
    fontSize: "13px",
    color: "var(--text2)",
    textDecoration: "none",
    transition: "all .2s",
    fontFamily: "'DM Sans', sans-serif",
  },
  linkActive: {
    color: "var(--cyan)",
    background: "rgba(0,229,255,.08)",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    marginLeft: "8px",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontFamily: "'Space Mono', monospace",
    background: "rgba(168,85,247,.12)",
    color: "var(--purple)",
    border: "1px solid rgba(168,85,247,.3)",
    textDecoration: "none",
    cursor: "pointer",
  },
  badgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "var(--purple)",
    animation: "pulse 2s infinite",
    flexShrink: 0,
  },
};
