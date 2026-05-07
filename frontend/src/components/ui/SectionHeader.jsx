export default function SectionHeader({
  eyebrow,
  title,
  desc,
  center = false,
}) {
  return (
    <div
      style={{ textAlign: center ? "center" : "left", marginBottom: "32px" }}
    >
      {eyebrow && (
        <div
          style={{
            fontSize: "11px",
            fontFamily: "'Space Mono', monospace",
            color: "var(--cyan)",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          {eyebrow}
        </div>
      )}
      <h2
        style={{
          fontSize: "clamp(22px, 4vw, 32px)",
          fontWeight: 600,
          color: "var(--text)",
          lineHeight: 1.25,
        }}
      >
        {title}
      </h2>
      {desc && (
        <p
          style={{
            marginTop: "10px",
            fontSize: "14px",
            color: "var(--text2)",
            maxWidth: "520px",
            margin: center ? "10px auto 0" : "10px 0 0",
            lineHeight: 1.7,
          }}
        >
          {desc}
        </p>
      )}
    </div>
  );
}
