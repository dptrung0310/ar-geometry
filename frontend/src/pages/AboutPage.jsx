import { TECH, ROADMAP } from "../data/about";
import SectionHeader from "../components/ui/SectionHeader";

const STATUS_STYLE = {
  done: {
    bg: "rgba(16,255,160,.1)",
    color: "#10ffa0",
    dot: "#10ffa0",
    label: "Hoàn thành",
  },
  active: {
    bg: "rgba(0,229,255,.1)",
    color: "var(--cyan)",
    dot: "var(--cyan)",
    label: "Đang làm",
  },
  todo: {
    bg: "rgba(71,85,105,.1)",
    color: "var(--text3)",
    dot: "var(--text3)",
    label: "Kế hoạch",
  },
};

export default function AboutPage() {
  return (
    <div style={styles.page}>
      <SectionHeader
        eyebrow="về dự án"
        title="AR Math 3D"
        desc="Ứng dụng học toán hình học không gian kết hợp công nghệ 3D và thực tế tăng cường, giúp học sinh hiểu sâu hơn qua trải nghiệm trực quan."
      />

      <section style={styles.section}>
        <div style={styles.sectionTitle}>Công nghệ sử dụng</div>
        <div style={styles.techGrid}>
          {TECH.map((t) => (
            <div key={t.name} style={styles.techCard}>
              <div
                style={{ ...styles.techIcon, background: t.bg, color: t.color }}
              >
                {t.icon}
              </div>
              <div>
                <div style={styles.techName}>{t.name}</div>
                <div style={styles.techDesc}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionTitle}>Lộ trình phát triển</div>
        <div style={styles.roadmapList}>
          {ROADMAP.map((item, i) => {
            const s = STATUS_STYLE[item.status];
            return (
              <div key={i} style={styles.roadmapItem}>
                <div
                  style={{
                    ...styles.roadmapDot,
                    background: s.dot,
                    boxShadow: `0 0 8px ${s.dot}`,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <span style={styles.roadmapText}>{item.text}</span>
                </div>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: s.bg,
                    color: s.color,
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: { maxWidth: "860px", margin: "0 auto", padding: "40px 24px 60px" },
  section: { marginBottom: "48px" },
  sectionTitle: {
    fontSize: "11px",
    fontFamily: "'Space Mono', monospace",
    color: "var(--text3)",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    marginBottom: "18px",
  },

  techGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
    gap: "12px",
  },
  techCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "14px 16px",
  },
  techIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontFamily: "'Space Mono', monospace",
    fontWeight: 700,
    flexShrink: 0,
  },
  techName: { fontSize: "13px", fontWeight: 500, color: "var(--text)" },
  techDesc: { fontSize: "11px", color: "var(--text3)", marginTop: "2px" },

  roadmapList: { display: "flex", flexDirection: "column", gap: "0" },
  roadmapItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 18px",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "0",
    marginBottom: "-1px",
  },
  roadmapDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  roadmapText: { fontSize: "13px", color: "var(--text2)" },
  statusBadge: {
    padding: "3px 9px",
    borderRadius: "20px",
    fontSize: "10px",
    fontFamily: "'Space Mono', monospace",
    flexShrink: 0,
  },
};
