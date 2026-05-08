import SHAPES from "../../data/shapes";

import useViewerStore from "../../store/useViewerStore";

export function ARControls({ onToggleCamera, cameraActive, error }) {
  const {
    currentShape,
    setShape,
    toggleWireframe,
    toggleAutoRotate,
    wireframe,
    autoRotate,
    setSize,
    setOpacity,
    size,
    opacity,
  } = useViewerStore();

  return (
    <div className="ar-controls">
      {/* CAMERA */}
      <div className="section">
        <button
          className={`camera-btn ${cameraActive ? "active" : ""}`}
          onClick={onToggleCamera}
        >
          {cameraActive ? "Camera Active" : "Bật Camera"}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>

      {/* SHAPES */}
      <div className="section">
        <div className="section-title">Chọn hình khối</div>

        <div className="shapes-grid">
          {SHAPES.map((shape) => {
            const color = `#${shape.color.toString(16).padStart(6, "0")}`;

            return (
              <button
                key={shape.id}
                className={`shape-btn ${
                  currentShape.id === shape.id ? "active" : ""
                }`}
                onClick={() => setShape(shape)}
              >
                <div
                  className="shape-color"
                  style={{
                    background: color,
                    boxShadow: `0 0 14px ${color}55`,
                  }}
                />

                <span>{shape.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SETTINGS */}
      <div className="section">
        <div className="section-title">Tùy chỉnh</div>

        {/* SIZE */}
        <div className="control-group">
          <div className="label-row">
            <span>Kích thước</span>

            <span className="value">{size.toFixed(2)}</span>
          </div>

          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={size}
            onChange={(e) => setSize(parseFloat(e.target.value))}
            className="slider"
          />
        </div>

        {/* OPACITY */}
        <div className="control-group">
          <div className="label-row">
            <span>Độ trong suốt</span>

            <span className="value">{(opacity * 100).toFixed(0)}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="slider"
          />
        </div>

        {/* TOGGLES */}
        <div className="toggle-buttons">
          <button
            className={`toggle-btn ${wireframe ? "active" : ""}`}
            onClick={toggleWireframe}
          >
            Wireframe
          </button>

          <button
            className={`toggle-btn ${autoRotate ? "active" : ""}`}
            onClick={toggleAutoRotate}
          >
            Auto Rotate
          </button>
        </div>
      </div>

      <style>{`
        .ar-controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .section-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text3);
          font-family: 'Space Mono', monospace;
        }

        .camera-btn {
          width: 100%;

          padding: 12px 14px;

          background: var(--bg3);

          border: 1px solid var(--border);

          border-radius: 12px;

          color: var(--text);

          font-size: 13px;
          font-weight: 500;

          cursor: pointer;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;

          transition: all .2s ease;
        }

        .camera-btn:hover {
          background: rgba(0,229,255,.05);

          border-color:
            rgba(0,229,255,.35);
        }

        .camera-btn.active {
          background:
            rgba(0,229,255,.12);

          color: var(--cyan);

          border-color:
            rgba(0,229,255,.4);
        }

        .icon {
          font-size: 18px;
        }

        .error-message {
          padding: 10px 12px;

          border-radius: 10px;

          background:
            rgba(255,0,0,.08);

          border:
            1px solid rgba(255,0,0,.2);

          color: #ff8a8a;

          font-size: 12px;

          line-height: 1.5;
        }

        .shapes-grid {
          display: grid;

          grid-template-columns:
            repeat(2, 1fr);

          gap: 10px;
        }

        .shape-btn {
          background: var(--bg3);

          border:
            1px solid var(--border);

          border-radius: 12px;

          padding: 12px;

          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;

          color: var(--text2);

          cursor: pointer;

          transition: all .2s ease;
        }

        .shape-btn:hover {
          transform: translateY(-2px);

          border-color:
            rgba(0,229,255,.25);

          background:
            rgba(0,229,255,.04);
        }

        .shape-btn.active {
          background:
            rgba(0,229,255,.08);

          border-color:
            rgba(0,229,255,.35);

          color: var(--cyan);
        }

        .shape-color {
          width: 38px;
          height: 38px;
          border-radius: 50%;
        }

        .shape-btn span {
          font-size: 12px;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;

          font-size: 12px;

          color: var(--text2);
        }

        .value {
          color: var(--cyan);

          font-family:
            'Space Mono',
            monospace;
        }

        .slider {
          width: 100%;

          accent-color: var(--cyan);

          cursor: pointer;
        }

        .toggle-buttons {
          display: flex;
          gap: 10px;
        }

        .toggle-btn {
          flex: 1;

          padding: 10px;

          border-radius: 10px;

          border:
            1px solid var(--border);

          background: var(--bg3);

          color: var(--text2);

          cursor: pointer;

          font-size: 12px;

          transition: all .2s ease;
        }

        .toggle-btn:hover {
          background:
            rgba(0,229,255,.05);

          border-color:
            rgba(0,229,255,.25);
        }

        .toggle-btn.active {
          background:
            rgba(0,229,255,.12);

          color: var(--cyan);

          border-color:
            rgba(0,229,255,.4);
        }

        @media (max-width: 768px) {
          .shapes-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
