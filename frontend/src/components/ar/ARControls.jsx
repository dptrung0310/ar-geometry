import { useRef, useState } from "react";
import SHAPES from "../../data/shapes";
import MOCK_GEOMETRY_PROBLEMS from "../../data/mockGeometryOutput";
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
    mode,
    setGeometryData,
    showEdgeLengths,
    showConstraints,
    toggleEdgeLengths,
    toggleConstraints,
  } = useViewerStore();

  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("preset"); // 'preset' | 'problem'
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadProblem = (id) => {
    if (!id) return;
    setSelectedProblemId(id);
    const found = MOCK_GEOMETRY_PROBLEMS.find((p) => p.id === id);
    if (found) setGeometryData(found);
  };

  const handleUploadImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    // Stub: giả lập backend xử lý 1.2 giây, sau đó trả mock data ngẫu nhiên
    setTimeout(() => {
      const found =
        MOCK_GEOMETRY_PROBLEMS[
          Math.floor(Math.random() * MOCK_GEOMETRY_PROBLEMS.length)
        ];
      setGeometryData(found);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="ar-controls">
      {/* ── CAMERA ──────────────────────────────────────────────── */}
      <div className="section">
        <button
          className={`camera-btn ${cameraActive ? "active" : ""}`}
          onClick={onToggleCamera}
        >
          <span>{cameraActive ? "🟢 Camera Active" : "📷 Bật Camera"}</span>
        </button>
        {error && <div className="error-message">{error}</div>}
      </div>

      {/* ── TABS ────────────────────────────────────────────────── */}
      <div className="tab-row">
        <button
          className={`tab-btn ${activeTab === "preset" ? "active" : ""}`}
          onClick={() => setActiveTab("preset")}
        >
          Hình chuẩn
        </button>
        <button
          className={`tab-btn ${activeTab === "problem" ? "active" : ""}`}
          onClick={() => setActiveTab("problem")}
        >
          📐 Bài toán
        </button>
      </div>

      {/* ── TAB: HÌNH CHUẨN ────────────────────────────────────── */}
      {activeTab === "preset" && (
        <div className="section">
          <div className="section-title">Chọn hình khối</div>
          <div className="shapes-grid">
            {SHAPES.map((shape) => {
              const color = `#${shape.color.toString(16).padStart(6, "0")}`;
              const isActive = mode === "preset" && currentShape?.id === shape.id;
              return (
                <button
                  key={shape.id}
                  className={`shape-btn ${isActive ? "active" : ""}`}
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
      )}

      {/* ── TAB: BÀI TOÁN ───────────────────────────────────────── */}
      {activeTab === "problem" && (
        <div className="section">
          <div className="section-title">Chọn bài toán mẫu</div>

          {/* Dropdown chọn bài */}
          <select
            className="problem-select"
            value={selectedProblemId}
            onChange={(e) => handleLoadProblem(e.target.value)}
          >
            <option value="">-- Chọn bài toán --</option>
            {MOCK_GEOMETRY_PROBLEMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Divider */}
          <div className="divider">
            <span>hoặc</span>
          </div>

          {/* Upload ảnh đề bài */}
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <span>📷 Upload ảnh đề bài</span>
            <span className="upload-sub">OCR → LLM → Geometry Engine</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleUploadImage}
          />

          {/* Loading indicator */}
          {isLoading && (
            <div className="loading-bar">
              <div className="loading-inner" />
              <span>Đang phân tích ảnh...</span>
            </div>
          )}

          {/* Đang hiển thị bài toán nào */}
          {mode === "custom" && selectedProblemId && (
            <div className="active-problem">
              ✅ Đang hiển thị:{" "}
              <strong>
                {MOCK_GEOMETRY_PROBLEMS.find((p) => p.id === selectedProblemId)?.label}
              </strong>
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS ─────────────────────────────────────────────── */}
      <div className="section">
        <div className="section-title">Tùy chỉnh</div>

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

        <div className="control-group">
          <div className="label-row">
            <span>Độ trong suốt</span>
            <span className="value">{(opacity * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="slider"
          />
        </div>

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

        {/* Toggle hiển thị geometry annotations — chỉ hiện trong custom mode */}
        {mode === "custom" && (
          <div className="toggle-buttons" style={{ marginTop: 6 }}>
            <button
              className={`toggle-btn ${showEdgeLengths ? "active" : ""}`}
              onClick={toggleEdgeLengths}
              title="Hiện/ẩn độ dài các cạnh"
            >
              📏 Độ dài
            </button>
            <button
              className={`toggle-btn ${showConstraints ? "active" : ""}`}
              onClick={toggleConstraints}
              title="Hiện/ẩn ký hiệu góc vuông, cạnh bằng"
            >
              ∟ Ký hiệu
            </button>
          </div>
        )}
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
          gap: 12px;
        }

        .section-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text3);
          font-family: 'Space Mono', monospace;
        }

        /* ── TABS ─────────────────────────── */
        .tab-row {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
        }

        .tab-btn {
          flex: 1;
          padding: 9px 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg3);
          color: var(--text2);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all .2s ease;
        }

        .tab-btn:hover {
          background: rgba(0,229,255,.05);
          border-color: rgba(0,229,255,.25);
        }

        .tab-btn.active {
          background: rgba(0,229,255,.1);
          border-color: rgba(0,229,255,.4);
          color: var(--cyan);
        }

        /* ── CAMERA BTN ─────────────────── */
        .camera-btn {
          width: 100%;
          padding: 13px 14px;
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

        .camera-btn:hover { background: rgba(0,229,255,.05); border-color: rgba(0,229,255,.35); }
        .camera-btn.active { background: rgba(16,255,160,.1); color: #10ffa0; border-color: rgba(16,255,160,.4); }

        /* ── ERROR ──────────────────────── */
        .error-message {
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(255,0,0,.08);
          border: 1px solid rgba(255,0,0,.2);
          color: #ff8a8a;
          font-size: 12px;
          line-height: 1.5;
        }

        /* ── SHAPES GRID ────────────────── */
        .shapes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }

        .shape-btn {
          background: var(--bg3);
          border: 1px solid var(--border);
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

        .shape-btn:hover { transform: translateY(-2px); border-color: rgba(0,229,255,.25); background: rgba(0,229,255,.04); }
        .shape-btn.active { background: rgba(0,229,255,.08); border-color: rgba(0,229,255,.35); color: var(--cyan); }

        .shape-color { width: 38px; height: 38px; border-radius: 50%; }
        .shape-btn span { font-size: 12px; }

        /* ── PROBLEM SELECT ─────────────── */
        .problem-select {
          width: 100%;
          padding: 10px 12px;
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-size: 13px;
          cursor: pointer;
          outline: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }

        .problem-select:focus { border-color: rgba(0,229,255,.4); }
        .problem-select option { background: #1a1a2e; }

        /* ── DIVIDER ────────────────────── */
        .divider {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text3);
          font-size: 11px;
        }

        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        /* ── UPLOAD BTN ─────────────────── */
        .upload-btn {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg3);
          border: 1px dashed var(--border);
          border-radius: 12px;
          color: var(--text2);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: all .2s ease;
        }

        .upload-btn:hover { border-color: rgba(0,229,255,.3); background: rgba(0,229,255,.04); }
        .upload-sub { font-size: 10px; color: var(--text3); font-family: 'Space Mono', monospace; }

        /* ── LOADING ────────────────────── */
        .loading-bar {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 11px;
          color: var(--text3);
          font-family: 'Space Mono', monospace;
        }

        .loading-inner {
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--cyan), transparent);
          border-radius: 2px;
          animation: shimmer 1.2s infinite;
          background-size: 200% 100%;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* ── ACTIVE PROBLEM ─────────────── */
        .active-problem {
          font-size: 12px;
          color: var(--text2);
          padding: 10px 12px;
          background: rgba(16,255,160,.06);
          border: 1px solid rgba(16,255,160,.2);
          border-radius: 10px;
          line-height: 1.5;
        }

        /* ── CONTROLS ───────────────────── */
        .control-group { display: flex; flex-direction: column; gap: 8px; }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: var(--text2);
        }

        .value { color: var(--cyan); font-family: 'Space Mono', monospace; }
        .slider { width: 100%; accent-color: var(--cyan); cursor: pointer; }

        .toggle-buttons { display: flex; gap: 10px; }

        .toggle-btn {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg3);
          color: var(--text2);
          cursor: pointer;
          font-size: 12px;
          transition: all .2s ease;
        }

        .toggle-btn:hover { background: rgba(0,229,255,.05); border-color: rgba(0,229,255,.25); }
        .toggle-btn.active { background: rgba(0,229,255,.12); color: var(--cyan); border-color: rgba(0,229,255,.4); }
      `}</style>
    </div>
  );
}
