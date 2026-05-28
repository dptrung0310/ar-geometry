import { useRef, useState, useEffect } from "react";
import MOCK_GEOMETRY_PROBLEMS from "../../data/mockGeometryOutput";
import useViewerStore from "../../store/useViewerStore";
import { analyzeImageProblem } from "../../api/geometryApi";

export function ARControls({
  onToggleCamera,
  cameraActive,
  onToggleXR,
  xrSessionActive,
  error: cameraError
}) {
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
    isLoading,
    setIsLoading,
    apiError,
    setApiError,
    arMode,
    setArMode,
  } = useViewerStore();

  const fileInputRef = useRef(null);
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [xrSupported, setXrSupported] = useState(false);

  useEffect(() => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        setXrSupported(supported);
      });
    }
  }, []);

  const handleLoadProblem = (id) => {
    if (!id) return;
    setSelectedProblemId(id);
    setApiError(null);
    const found = MOCK_GEOMETRY_PROBLEMS.find((p) => p.id === id);
    if (found) setGeometryData(found);
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const data = await analyzeImageProblem(file);
      setGeometryData(data);
    } catch (err) {
      console.error(err);
      setApiError(err.message || "Lỗi không xác định khi kết nối máy chủ AI");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="ar-controls">
      {/* ── CHẾ ĐỘ AR MODE SELECTOR ────────────────────────────── */}
      <div className="section">
        <div className="section-title">Chế độ AR</div>
        <div className="toggle-buttons">
          <button
            className={`toggle-btn ${arMode === "gesture" ? "active" : ""}`}
            onClick={() => {
              if (xrSessionActive) onToggleXR();
              setArMode("gesture");
            }}
          >
            Camera trước (Cử chỉ)
          </button>
          <button
            className={`toggle-btn ${arMode === "webxr" ? "active" : ""}`}
            onClick={() => {
              if (cameraActive) onToggleCamera();
              setArMode("webxr");
            }}
          >
            Camera sau (WebXR)
          </button>
        </div>
      </div>

      {/* ── CAMERA / WEBXR TRIGGER BUTTON ───────────────────────── */}
      <div className="section">
        {arMode === "gesture" ? (
          <button
            className={`camera-btn ${cameraActive ? "active" : ""}`}
            onClick={onToggleCamera}
          >
            <span>{cameraActive ? "🟢 Tắt Camera trước" : "📷 Bật Camera trước"}</span>
          </button>
        ) : (
          <button
            className={`camera-btn ${xrSessionActive ? "active" : ""}`}
            onClick={onToggleXR}
            disabled={!xrSupported}
            style={!xrSupported ? { opacity: 0.5, cursor: "not-allowed" } : {}}
          >
            <span>
              {xrSessionActive
                ? "🟢 Đang chạy WebXR AR..."
                : xrSupported
                ? "🥽 Bật quét sàn WebXR"
                : "🚫 WebXR không hỗ trợ"}
            </span>
          </button>
        )}
        {!xrSupported && arMode === "webxr" && (
          <div className="error-message" style={{ fontSize: "10px", marginTop: "2px" }}>
            * Chế độ quét sàn (WebXR) chỉ chạy trên Android Chrome có Google Play Services cho AR.
          </div>
        )}
        {cameraError && <div className="error-message">{cameraError}</div>}
      </div>

      {/* ── UPLOAD / GIẢI TOÁN ───────────────────────────────── */}
      <div className="section">
        <div className="section-title">Giải toán từ ảnh</div>

        {/* Upload ảnh đề bài */}
        <button
          className="upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
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

        {/* Error display */}
        {apiError && (
          <div className="error-message">
            ⚠️ {apiError}
          </div>
        )}
      </div>

      <style>{`
        .ar-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .section-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text3);
          font-family: 'Inter', sans-serif;
          font-weight: 600;
        }

        /* ── CAMERA BTN ─────────────────── */
        .camera-btn {
          width: 100%;
          padding: 12px 16px;
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all .2s ease;
        }

        .camera-btn:hover { background: rgba(59, 130, 246, 0.05); border-color: rgba(59, 130, 246, 0.25); }
        .camera-btn.active { background: rgba(16, 185, 129, 0.1); color: var(--green); border-color: rgba(16, 185, 129, 0.3); }

        /* ── ERROR ──────────────────────── */
        .error-message {
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          font-size: 12px;
          line-height: 1.4;
        }

        /* ── UPLOAD BTN ─────────────────── */
        .upload-btn {
          width: 100%;
          padding: 16px 20px;
          background: var(--bg3);
          border: 1px dashed var(--border);
          border-radius: 10px;
          color: var(--text2);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: all .2s ease;
        }

        .upload-btn:hover { border-color: rgba(59, 130, 246, 0.25); background: rgba(59, 130, 246, 0.04); }
        .upload-sub { font-size: 10px; color: var(--text3); font-family: 'Fira Code', monospace; }

        /* ── LOADING ────────────────────── */
        .loading-bar {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 11px;
          color: var(--text3);
          font-family: 'Fira Code', monospace;
        }

        .loading-inner {
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--cyan), transparent);
          border-radius: 1px;
          animation: shimmer 1.2s infinite;
          background-size: 200% 100%;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .toggle-buttons { display: flex; gap: 10px; }

        .toggle-btn {
          flex: 1;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--bg3);
          color: var(--text2);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all .2s ease;
        }

        .toggle-btn:hover { background: rgba(59, 130, 246, 0.05); border-color: rgba(59, 130, 246, 0.2); }
        .toggle-btn.active { background: rgba(59, 130, 246, 0.1); color: var(--cyan); border-color: rgba(59, 130, 246, 0.3); }
      `}</style>
    </div>
  );
}
