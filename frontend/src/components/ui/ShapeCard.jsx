import { useNavigate } from "react-router-dom";
import MiniCanvas from "../three/MiniCanvas";
import useViewerStore from "../../store/useViewerStore";

export default function ShapeCard({ shape }) {
  const navigate = useNavigate();
  const setShape = useViewerStore((s) => s.setShape);

  const handleClick = () => {
    setShape(shape);
    navigate("/explore");
  };

  const hexColor = "#" + shape.color.toString(16).padStart(6, "0");

  return (
    <div onClick={handleClick} style={styles.card} className="shape-card-hover">
      <MiniCanvas shape={shape} height="130px" />

      <div style={styles.info}>
        <div style={{ ...styles.dot, background: hexColor }} />
        <div>
          <div style={styles.name}>{shape.name}</div>
          <div style={styles.meta}>
            {shape.faces} mặt · {shape.edges} cạnh · {shape.verts} đỉnh
          </div>
        </div>
      </div>

      <div style={styles.formulas}>
        {shape.formulas.slice(0, 2).map((f, i) => (
          <div key={i} style={styles.formulaRow}>
            <span style={styles.formulaKey}>{f.k}</span>
            <span style={styles.formulaVal}>{f.v}</span>
          </div>
        ))}
      </div>

      <div style={styles.cta}>Khám phá →</div>
    </div>
  );
}

const styles = {
  card: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all .25s",
    display: "flex",
    flexDirection: "column",
  },
  info: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 16px 10px",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  name: {
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--text)",
  },
  meta: {
    fontSize: "11px",
    color: "var(--text3)",
    fontFamily: "'Space Mono', monospace",
    marginTop: "2px",
  },
  formulas: {
    padding: "0 16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  formulaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formulaKey: {
    fontSize: "11px",
    color: "var(--text3)",
  },
  formulaVal: {
    fontSize: "11px",
    fontFamily: "'Space Mono', monospace",
    color: "var(--cyan)",
  },
  cta: {
    padding: "10px 16px",
    fontSize: "11px",
    fontFamily: "'Space Mono', monospace",
    color: "var(--cyan)",
    borderTop: "1px solid var(--border)",
    textAlign: "right",
    letterSpacing: "0.5px",
  },
};
