import SHAPES from "../../data/shapes";
import useViewerStore from "../../store/useViewerStore";

export default function ShapePicker() {
  const { currentShape, setShape } = useViewerStore();

  return (
    <div style={styles.wrap}>
      <div style={styles.label}>Chọn hình</div>
      <div style={styles.grid}>
        {SHAPES.map((shape) => {
          const active = currentShape?.id === shape.id;
          const hexColor = "#" + shape.color.toString(16).padStart(6, "0");
          return (
            <button
              key={shape.id}
              onClick={() => setShape(shape)}
              style={{
                ...styles.btn,
                background: active ? `${hexColor}18` : "transparent",
                borderColor: active ? `${hexColor}88` : "var(--border)",
                color: active ? hexColor : "var(--text3)",
              }}
            >
              {shape.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: "flex", flexDirection: "column", gap: "10px" },
  label: {
    fontSize: "11px",
    fontFamily: "'Space Mono', monospace",
    color: "var(--text3)",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "6px",
  },
  btn: {
    padding: "8px 10px",
    borderRadius: "8px",
    fontSize: "12px",
    border: "1px solid",
    cursor: "pointer",
    textAlign: "left",
    transition: "all .2s",
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.3,
  },
};
