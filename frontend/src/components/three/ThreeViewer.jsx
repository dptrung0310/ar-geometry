import { useRef } from "react";
import useThreeViewer from "../../hooks/useThreeViewer";
import useViewerStore from "../../store/useViewerStore";

export default function ThreeViewer() {
  const containerRef = useRef(null);

  const {
    currentShape,
    wireframe,
    toggleWireframe,
    autoRotate,
    toggleAutoRotate,
    size,
    setSize,
    opacity,
    setOpacity,
  } = useViewerStore();

  const { resetCamera, takeScreenshot } = useThreeViewer(
    containerRef,
    currentShape,
    { wireframe, autoRotate, size, opacity },
  );

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <div style={styles.shapeName}>{currentShape?.name}</div>
          <div style={styles.shapeType}>
            {currentShape?.faces} mặt · {currentShape?.edges} cạnh ·{" "}
            {currentShape?.verts} đỉnh
          </div>
        </div>
        <div style={styles.headerBtns}>
          <Btn active={wireframe} onClick={toggleWireframe}>
            Wireframe
          </Btn>
          <Btn active={autoRotate} onClick={toggleAutoRotate}>
            Xoay
          </Btn>
        </div>
      </div>

      <div ref={containerRef} style={styles.canvas} />

      <div style={styles.controls}>
        <SliderRow
          label="Kích thước"
          value={size}
          min={0.3}
          max={2.0}
          step={0.01}
          onChange={(v) => setSize(v)}
        />
        <SliderRow
          label="Độ trong suốt"
          value={opacity}
          min={0.1}
          max={1.0}
          step={0.01}
          onChange={(v) => setOpacity(v)}
        />
        <div style={styles.actionBtns}>
          <ActionBtn onClick={resetCamera}>⟳ Reset</ActionBtn>
          <ActionBtn onClick={takeScreenshot}>↓ Screenshot</ActionBtn>
        </div>
      </div>
    </div>
  );
}

function Btn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px",
        borderRadius: "6px",
        fontSize: "12px",
        border: "1px solid",
        cursor: "pointer",
        fontFamily: "'Space Mono', monospace",
        transition: "all .2s",
        background: active ? "rgba(0,229,255,.12)" : "transparent",
        color: active ? "var(--cyan)" : "var(--text3)",
        borderColor: active ? "rgba(0,229,255,.4)" : "var(--border)",
      }}
    >
      {children}
    </button>
  );
}

function SliderRow({ label, value, min, max, step, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "11px",
            color: "var(--text3)",
            fontFamily: "Space Mono, monospace",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "var(--cyan)",
            fontFamily: "Space Mono, monospace",
          }}
        >
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ accentColor: "var(--cyan)" }}
      />
    </div>
  );
}

function ActionBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "8px",
        borderRadius: "6px",
        fontSize: "12px",
        border: "1px solid var(--border)",
        background: "var(--bg3)",
        color: "var(--text2)",
        cursor: "pointer",
        fontFamily: "'Space Mono', monospace",
        transition: "all .2s",
      }}
    >
      {children}
    </button>
  );
}

const styles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    overflow: "hidden",
    height: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid var(--border)",
  },
  shapeName: {
    fontSize: "15px",
    fontWeight: 500,
    color: "var(--text)",
  },
  shapeType: {
    fontSize: "11px",
    color: "var(--text3)",
    fontFamily: "'Space Mono', monospace",
    marginTop: "3px",
  },
  headerBtns: {
    display: "flex",
    gap: "8px",
  },
  canvas: {
    flex: 1,
    minHeight: "280px",
    cursor: "grab",
  },
  controls: {
    padding: "16px 20px",
    borderTop: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  actionBtns: {
    display: "flex",
    gap: "8px",
  },
};
