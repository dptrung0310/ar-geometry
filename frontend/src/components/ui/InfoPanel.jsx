import ShapePicker from "./ShapePicker";
import useViewerStore from "../../store/useViewerStore";

export default function InfoPanel() {
  const { currentShape } = useViewerStore();
  if (!currentShape) return null;

  const hexColor = "#" + currentShape.color.toString(16).padStart(6, "0");

  return (
    <div style={styles.wrap}>
      <div style={styles.section}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              ...styles.colorDot,
              background: hexColor,
              boxShadow: `0 0 10px ${hexColor}66`,
            }}
          />
          <span style={styles.shapeName}>{currentShape.name}</span>
        </div>
        <p style={styles.desc}>{currentShape.desc}</p>
      </div>

      <div style={styles.statsRow}>
        {[
          { k: "Mặt", v: currentShape.faces },
          { k: "Cạnh", v: currentShape.edges },
          { k: "Đỉnh", v: currentShape.verts },
        ].map((s) => (
          <div key={s.k} style={styles.stat}>
            <div style={styles.statVal}>{s.v}</div>
            <div style={styles.statKey}>{s.k}</div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Công thức</div>
        <div style={styles.formulaList}>
          {currentShape.formulas.map((f, i) => (
            <div key={i} style={styles.formulaRow}>
              <span style={styles.formulaKey}>{f.k}</span>
              <code style={styles.formulaVal}>{f.v}</code>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <ShapePicker />
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    overflow: "hidden",
    height: "100%",
  },
  section: {
    padding: "18px 20px",
    borderBottom: "1px solid var(--border)",
  },
  colorDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  shapeName: {
    fontSize: "16px",
    fontWeight: 500,
    color: "var(--text)",
  },
  desc: {
    fontSize: "13px",
    color: "var(--text2)",
    lineHeight: 1.65,
  },
  statsRow: {
    display: "flex",
    borderBottom: "1px solid var(--border)",
  },
  stat: {
    flex: 1,
    padding: "14px",
    textAlign: "center",
    borderRight: "1px solid var(--border)",
  },
  statVal: {
    fontSize: "22px",
    fontFamily: "'Space Mono', monospace",
    color: "var(--cyan)",
    fontWeight: 700,
  },
  statKey: {
    fontSize: "10px",
    color: "var(--text3)",
    marginTop: "3px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  sectionTitle: {
    fontSize: "11px",
    fontFamily: "'Space Mono', monospace",
    color: "var(--text3)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "12px",
  },
  formulaList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  formulaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--bg3)",
    padding: "8px 12px",
    borderRadius: "6px",
  },
  formulaKey: {
    fontSize: "12px",
    color: "var(--text2)",
  },
  formulaVal: {
    fontSize: "12px",
    fontFamily: "'Space Mono', monospace",
    color: "var(--cyan)",
  },
};
