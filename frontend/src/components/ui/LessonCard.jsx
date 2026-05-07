const LEVEL_COLOR = {
  "Cơ bản": { bg: "rgba(16,255,160,.1)", color: "#10ffa0" },
  "Trung bình": { bg: "rgba(251,191,36,.1)", color: "#fbbf24" },
  "Nâng cao": { bg: "rgba(248,113,113,.1)", color: "#f87171" },
};

export default function LessonCard({ lesson }) {
  const level = LEVEL_COLOR[lesson.level] || LEVEL_COLOR["Cơ bản"];

  return (
    <div style={styles.card}>
      <div style={styles.icon}>{lesson.icon}</div>
      <div style={styles.body}>
        <div style={styles.titleRow}>
          <span style={styles.title}>{lesson.title}</span>
          <span
            style={{
              ...styles.badge,
              background: level.bg,
              color: level.color,
            }}
          >
            {lesson.level}
          </span>
        </div>
        <p style={styles.desc}>{lesson.desc}</p>
        <div style={styles.footer}>
          <span style={styles.time}>⏱ {lesson.time}</span>
          <span style={styles.start}>Bắt đầu →</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: "flex",
    gap: "16px",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "18px 20px",
    transition: "all .2s",
    cursor: "pointer",
  },
  icon: {
    fontSize: "26px",
    flexShrink: 0,
    marginTop: "2px",
  },
  body: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--text)",
  },
  badge: {
    padding: "2px 8px",
    borderRadius: "20px",
    fontSize: "10px",
    fontFamily: "'Space Mono', monospace",
  },
  desc: {
    fontSize: "13px",
    color: "var(--text2)",
    lineHeight: 1.6,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "4px",
  },
  time: {
    fontSize: "11px",
    color: "var(--text3)",
    fontFamily: "'Space Mono', monospace",
  },
  start: {
    fontSize: "11px",
    color: "var(--cyan)",
    fontFamily: "'Space Mono', monospace",
  },
};
