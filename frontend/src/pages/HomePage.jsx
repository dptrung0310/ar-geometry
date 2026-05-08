import { useNavigate } from "react-router-dom";
import SHAPES from "../data/shapes";
import ShapeCard from "../components/ui/ShapeCard";
import Button from "../components/ui/Button";
import SectionHeader from "../components/ui/SectionHeader";

const STATS = [
  { val: "12+", label: "Hình 3D", color: "var(--cyan)" },
  { val: "AR", label: "Thực tế tăng cường", color: "var(--purple)" },
  { val: "∞", label: "Tương tác", color: "var(--green)" },
  { val: "0đ", label: "Miễn phí", color: "var(--orange)" },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroBg} />
        <div style={styles.heroGrid} />

        <div style={styles.heroContent}>
          <div style={styles.eyebrow}>✦ Toán học không gian</div>
          <h1 style={styles.heroTitle}>
            Khám phá <span style={{ color: "var(--cyan)" }}>Hình học</span>
            <br />
            <span style={{ color: "var(--purple)" }}>3D</span> trực quan
          </h1>
          <p style={styles.heroDesc}>
            Học hình học không gian qua mô hình 3D tương tác và công nghệ thực
            tế tăng cường. Xoay, phóng to, khám phá từng hình theo cách của bạn.
          </p>
          <div style={styles.heroBtns} className="hero-btns">
            <Button onClick={() => navigate("/explore")}>🔷 Khám phá 3D</Button>
            <Button variant="secondary" onClick={() => navigate("/learn")}>
              📚 Học ngay
            </Button>
          </div>
        </div>
      </section>

      <section style={styles.statsSection} className="stats-grid">
        {STATS.map((s) => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ ...styles.statVal, color: s.color }}>{s.val}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </section>

      <section style={styles.section}>
        <SectionHeader
          eyebrow="thư viện hình học"
          title="Các hình 3D nổi bật"
          desc="Click vào bất kỳ hình nào để xem chi tiết trong trình xem 3D tương tác."
        />
        <div style={styles.shapeGrid} className="shape-grid">
          {SHAPES.map((shape) => (
            <ShapeCard key={shape.id} shape={shape} />
          ))}
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: { maxWidth: "1400px", margin: "0 auto", padding: "0 24px 60px" },

  hero: {
    position: "relative",
    padding: "80px 0 60px",
    overflow: "hidden",
  },
  heroBg: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,229,255,.07) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  heroGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    opacity: 0.3,
    pointerEvents: "none",
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: "600px",
  },
  eyebrow: {
    fontSize: "11px",
    fontFamily: "'Space Mono', monospace",
    color: "var(--cyan)",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "16px",
  },
  heroTitle: {
    fontSize: "clamp(32px, 6vw, 56px)",
    fontWeight: 700,
    lineHeight: 1.15,
    color: "var(--text)",
    marginBottom: "18px",
  },
  heroDesc: {
    fontSize: "15px",
    color: "var(--text2)",
    lineHeight: 1.75,
    maxWidth: "480px",
    marginBottom: "28px",
  },
  heroBtns: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  statsSection: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    marginBottom: "64px",
  },
  statCard: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  },
  statVal: {
    fontSize: "28px",
    fontFamily: "'Space Mono', monospace",
    fontWeight: 700,
  },
  statLabel: {
    fontSize: "12px",
    color: "var(--text3)",
    marginTop: "4px",
  },

  section: { marginBottom: "60px" },
  shapeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "16px",
  },
};
