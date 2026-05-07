import SectionHeader from "../components/ui/SectionHeader";
import Button from "../components/ui/Button";

const AR_STEPS = [
  {
    num: "01",
    title: "In marker",
    desc: "Tải và in tờ marker AR từ thư viện của chúng tôi.",
  },
  {
    num: "02",
    title: "Mở camera",
    desc: 'Nhấn "Bắt đầu AR" để cho phép truy cập camera.',
  },
  {
    num: "03",
    title: "Hướng vào marker",
    desc: "Đưa camera hướng vào tờ marker đã in.",
  },
  {
    num: "04",
    title: "Khám phá 3D",
    desc: "Hình 3D xuất hiện ngay trên tờ giấy, xoay để xem.",
  },
];

export default function ARPage() {
  return (
    <div style={styles.page}>
      <SectionHeader
        eyebrow="thực tế tăng cường"
        title="Chế độ AR"
        desc="Trải nghiệm hình học 3D ngay trên bàn học của bạn với công nghệ AR."
      />

      <div style={styles.previewBox}>
        <div style={styles.scanLines} />

        {["topLeft", "topRight", "bottomLeft", "bottomRight"].map((pos) => (
          <div key={pos} style={{ ...styles.corner, ...cornerPos[pos] }} />
        ))}

        <div style={styles.previewCenter}>
          <div style={styles.arIcon}>◈</div>
          <div style={styles.arLabel}>AR Preview</div>
          <div style={styles.arSub}>Camera feed sẽ hiển thị ở đây</div>
          <Button variant="purple" style={{ marginTop: "16px" }}>
            ◎ Bắt đầu AR
          </Button>
        </div>
      </div>

      <div style={styles.stepsGrid} className="steps-grid">
        {AR_STEPS.map((step) => (
          <div key={step.num} style={styles.stepCard}>
            <div style={styles.stepNum}>{step.num}</div>
            <div style={styles.stepTitle}>{step.title}</div>
            <div style={styles.stepDesc}>{step.desc}</div>
          </div>
        ))}
      </div>

      <div style={styles.notice}>
        <span style={styles.noticeDot} />
        <span>
          <strong style={{ color: "var(--purple)" }}>Beta:</strong> Tính năng AR
          đang trong quá trình phát triển. MindAR.js sẽ được tích hợp trong
          phiên bản tiếp theo.
        </span>
      </div>
    </div>
  );
}

const cornerPos = {
  topLeft: {
    top: 12,
    left: 12,
    borderTop: "2px solid var(--purple)",
    borderLeft: "2px solid var(--purple)",
    borderRight: "none",
    borderBottom: "none",
  },
  topRight: {
    top: 12,
    right: 12,
    borderTop: "2px solid var(--purple)",
    borderRight: "2px solid var(--purple)",
    borderLeft: "none",
    borderBottom: "none",
  },
  bottomLeft: {
    bottom: 12,
    left: 12,
    borderBottom: "2px solid var(--purple)",
    borderLeft: "2px solid var(--purple)",
    borderRight: "none",
    borderTop: "none",
  },
  bottomRight: {
    bottom: 12,
    right: 12,
    borderBottom: "2px solid var(--purple)",
    borderRight: "2px solid var(--purple)",
    borderLeft: "none",
    borderTop: "none",
  },
};

const styles = {
  page: { maxWidth: "860px", margin: "0 auto", padding: "40px 24px 60px" },

  previewBox: {
    position: "relative",
    height: "320px",
    background: "var(--card)",
    border: "1px solid rgba(168,85,247,.3)",
    borderRadius: "16px",
    overflow: "hidden",
    marginBottom: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  scanLines: {
    position: "absolute",
    inset: 0,
    background:
      "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(168,85,247,.03) 3px, rgba(168,85,247,.03) 4px)",
    pointerEvents: "none",
  },
  corner: {
    position: "absolute",
    width: "20px",
    height: "20px",
  },
  previewCenter: {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },
  arIcon: {
    fontSize: "48px",
    color: "var(--purple)",
    animation: "pulse 2.5s infinite",
  },
  arLabel: {
    fontFamily: "'Space Mono', monospace",
    color: "var(--purple)",
    fontSize: "14px",
    marginTop: "6px",
  },
  arSub: {
    fontSize: "12px",
    color: "var(--text3)",
  },

  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },
  stepCard: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "18px",
  },
  stepNum: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "22px",
    color: "var(--purple)",
    fontWeight: 700,
    marginBottom: "8px",
  },
  stepTitle: {
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--text)",
    marginBottom: "6px",
  },
  stepDesc: {
    fontSize: "12px",
    color: "var(--text2)",
    lineHeight: 1.6,
  },

  notice: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    background: "rgba(168,85,247,.08)",
    border: "1px solid rgba(168,85,247,.25)",
    borderRadius: "10px",
    padding: "14px 18px",
    fontSize: "13px",
    color: "var(--text2)",
    lineHeight: 1.6,
  },
  noticeDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "var(--purple)",
    flexShrink: 0,
    marginTop: "4px",
    animation: "pulse 2s infinite",
  },
};
