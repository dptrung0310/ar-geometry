import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";

import SectionHeader from "../components/ui/SectionHeader";
import { ARControls } from "../components/ar/ARControls";
import MathRenderer from "../components/ui/MathRenderer";

import useViewerStore from "../store/useViewerStore";
import { useAR } from "../hooks/useAR";
import { computeLabelPositions } from "../utils/buildCustomGeometry";

function TerminalLoader() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const messages = [
      "[SYSTEM] Khởi động luồng xử lý hình học AR...",
      "[OCR] Đang chạy OCR quét đề toán từ hình ảnh...",
      "[LLM] Đang phân tích và trích xuất các ràng buộc...",
      "[ENGINE] Đang khởi tạo bộ giải Geometry Engine...",
      "[ENGINE] Đang tối ưu hóa hệ tọa độ 3D...",
      "[LLM] Đang soạn thảo chứng minh toán học (LaTeX)...",
      "[SYSTEM] Hoàn tất! Đang kết xuất hình học không gian..."
    ];

    setLogs([messages[0]]);
    
    const timers = [];
    for (let i = 1; i < messages.length; i++) {
      const t = setTimeout(() => {
        setLogs(prev => [...prev, messages[i]]);
      }, i * 1100);
      timers.push(t);
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, []);

  return (
    <div style={styles.terminal}>
      <div style={styles.terminalHeader}>
        <div style={styles.terminalDotRed} />
        <div style={styles.terminalDotYellow} />
        <div style={styles.terminalDotGreen} />
        <span style={styles.terminalTitle}>geometry_engine_terminal.sh</span>
      </div>
      <div style={styles.terminalBody}>
        {logs.map((log, idx) => {
          let color = "var(--text2)";
          if (log.includes("[SYSTEM]")) color = "#10ffa0";
          else if (log.includes("[OCR]")) color = "#00e5ff";
          else if (log.includes("[LLM]")) color = "#ffd700";
          else if (log.includes("[ENGINE]")) color = "#ff79c6";

          return (
            <div key={idx} style={{ ...styles.terminalLine, color }}>
              <span style={styles.terminalPrompt}>$</span> {log}
            </div>
          );
        })}
        <div style={styles.terminalCursor} />
      </div>
    </div>
  );
}

export default function ARPage() {
  const canvasRef = useRef(null);
  const labelContainerRef = useRef(null);
  const rafIdRef = useRef(null);

  const {
    currentShape,
    size,
    opacity,
    wireframe,
    autoRotate,
    mode,
    geometryData,
    showEdgeLengths,
    showConstraints,
    isLoading,
    apiError,
  } = useViewerStore();

  const {
    cameraActive,
    toggleCamera,
    xrSessionActive,
    toggleXR,
    error,
    videoRef,
    cameraRef,
    customGroupRef,
  } = useAR(
    canvasRef,
    currentShape,
    { size, opacity, wireframe, autoRotate, showConstraints },
    mode === "custom" ? geometryData : null,
  );

  // ── Dữ liệu label 3D (tọa độ world-space, tính 1 lần khi geometry đổi) ──
  const [labelData, setLabelData] = useState({ vertexLabels: [], edgeLabels: [] });

  useEffect(() => {
    if (mode === "custom" && geometryData) {
      setLabelData(computeLabelPositions(geometryData, size));
    } else {
      setLabelData({ vertexLabels: [], edgeLabels: [] });
    }
  }, [geometryData, mode, size]);

  // rAF loop: Project 3D vertex positions → 2D screen mỗi frame
  // QUAN TRỌNG: Phải dùng group.localToWorld() để lấy world-space position
  // sau khi group đã xoay — nếu không labels sẽ đứng yên khi hình xoay.
  const updateLabelPositions = useCallback(() => {
    const camera = cameraRef?.current;
    const group = customGroupRef?.current; // Group đang xoay trong scene
    const container = labelContainerRef.current;
    const canvas = canvasRef.current;
    if (!camera || !container || !canvas) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    container.querySelectorAll("[data-pos]").forEach((el) => {
      try {
        const raw = el.dataset.pos;
        if (!raw) return;
        const [x, y, z] = raw.split(",").map(Number);

        // Tạo vector ở LOCAL space của group (tọa độ gốc của đỉnh)
        const vec = new THREE.Vector3(x, y, z);

        // Chuyển từ LOCAL space → WORLD space theo rotation/position/scale hiện tại
        // Đây là bước then chốt: group.localToWorld() dùng matrixWorld của group
        if (group) {
          group.localToWorld(vec);
        }

        // Project WORLD space → NDC [-1,1] bằng camera Three.js thật
        vec.project(camera);

        // NDC → pixel coordinates
        const px = (vec.x + 1) / 2 * w;
        const py = (-vec.y + 1) / 2 * h; // flip Y axis

        // Ẩn label khi vertex nằm phía sau camera (z ndc > 1)
        const visible = vec.z < 1;
        el.style.display = visible ? "block" : "none";
        el.style.left = `${px}px`;
        el.style.top = `${py}px`;
      } catch (_) {}
    });
  }, [cameraRef, customGroupRef]);

  // Chạy loop khi ở custom mode và có label data
  useEffect(() => {
    if (mode !== "custom" || labelData.vertexLabels.length === 0) return;

    const loop = () => {
      updateLabelPositions();
      rafIdRef.current = requestAnimationFrame(loop);
    };
    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [mode, labelData, updateLabelPositions]);

  useEffect(() => {
    if (canvasRef.current) canvasRef.current.focus();
  }, []);

  return (
    <div style={styles.page}>
      <SectionHeader
        eyebrow="augmented reality"
        title="Trình xem AR hình học không gian"
        desc="Bật camera · Chọn bài toán · Điều khiển bằng cử chỉ tay"
      />

      <div style={styles.layout} className="ar-layout">
        {/* ── CỬA SỔ LỜI GIẢI (BÊN TRÁI) ─────────────────────────── */}
        <div style={styles.solutionCard}>
          <div style={styles.solutionHeader}>
            <span style={styles.solutionTitleIcon}>📝</span>
            <span style={styles.solutionTitle}>Lời giải & Chứng minh</span>
          </div>

          <div style={styles.solutionBody}>
            {isLoading ? (
              <TerminalLoader />
            ) : apiError ? (
              <div style={styles.solutionError}>
                <div style={styles.errorIcon}>⚠️</div>
                <div style={styles.errorTitle}>Lỗi xử lý hệ thống</div>
                <p style={styles.errorText}>{apiError}</p>
              </div>
            ) : mode === "custom" && geometryData ? (
              <>
                {/* Đề bài OCR */}
                {geometryData.problem && (
                  <div style={styles.problemBox}>
                    <div style={styles.boxLabel}>VĂN BẢN ĐỀ BÀI (OCR)</div>
                    <div style={styles.problemTextScanned}>{geometryData.problem}</div>
                  </div>
                )}

                {/* Lời giải toán chi tiết */}
                {geometryData.solution ? (
                  <div style={styles.solutionContentBox}>
                    <div style={styles.boxLabel}>LỜI GIẢI CHI TIẾT TỪNG BƯỚC</div>
                    <MathRenderer text={geometryData.solution} />
                  </div>
                ) : (
                  <div style={styles.noSolutionBox}>
                    <span style={{ fontSize: "28px", marginBottom: "10px" }}>💡</span>
                    <div style={{ fontWeight: 600 }}>Chưa có lời giải chi tiết.</div>
                    <p style={{ fontSize: "12px", color: "var(--text3)", marginTop: "4px" }}>
                      Hãy tải lên ảnh đề bài hình học của bạn để AI tự động trích xuất lời giải.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div style={styles.emptyStateBox}>
                <span style={{ fontSize: "36px", marginBottom: "12px" }}>📐</span>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>Bản giải toán hình học không gian</div>
                <p style={{ fontSize: "13px", color: "var(--text3)", marginTop: "6px", maxWidth: "300px" }}>
                  Hãy tải ảnh đề bài lên hoặc chọn bài toán để xem lời giải chi tiết và dựng mô hình 3D tương tác.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── CỬA SỔ VẼ HÌNH 3D (Ở GIỮA/PHẢI) ────────────────────── */}
        <div style={styles.viewerCard}>
          <div style={styles.viewerHeader}>
            <div>
              <div style={styles.shapeName}>
                {mode === "custom"
                  ? geometryData?.label || "Hình vẽ 3D tương tác"
                  : currentShape?.name}
              </div>
              <div style={styles.shapeInfo}>
                {mode === "custom"
                  ? "Interactive Geometry View"
                  : "AR Hand Tracking Active"}
              </div>
            </div>

            <div style={styles.statusWrap}>
              <div
                style={{
                  ...styles.statusDot,
                  background: cameraActive ? "#10ffa0" : "#666",
                  boxShadow: cameraActive
                    ? "0 0 8px #10ffa0"
                    : "none",
                }}
              />
              <span style={styles.statusText}>
                {cameraActive ? "Camera Active" : "Camera Off"}
              </span>
            </div>
          </div>

          <div style={styles.canvasWrapper}>
            {/* CAMERA VIDEO */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={styles.video}
            />

            {/* THREE.js WebGL canvas */}
            <canvas ref={canvasRef} style={styles.canvas} />

            {/* ── HTML Label Overlay (vertex names + edge lengths) ── */}
            {mode === "custom" && !xrSessionActive && (
              <div ref={labelContainerRef} style={styles.labelContainer}>
                {/* Vertex labels */}
                {labelData.vertexLabels.map((lbl) => (
                  <div
                    key={`v-${lbl.name}`}
                    data-pos={`${lbl.position.x},${lbl.position.y},${lbl.position.z}`}
                    style={{
                      ...styles.vertexLabel,
                      background: lbl.isHighlighted
                        ? "rgba(255,68,68,0.92)"
                        : "rgba(0,229,255,0.88)",
                      borderColor: lbl.isHighlighted ? "#ff4444" : "#00e5ff",
                      color: "#000",
                    }}
                  >
                    {lbl.name}
                  </div>
                ))}

                {/* Edge length labels */}
                {showEdgeLengths && labelData.edgeLabels.map((lbl) => (
                  <div
                    key={`e-${lbl.name}`}
                    data-pos={`${lbl.position.x},${lbl.position.y},${lbl.position.z}`}
                    style={styles.edgeLabel}
                  >
                    {lbl.label}
                  </div>
                ))}
              </div>
            )}

            {/* ── Placeholder khi camera chưa bật ──────────────── */}
            {!cameraActive && !xrSessionActive && (
              <div style={styles.overlay}>
                <div style={styles.overlayBox}>
                  <div style={styles.overlayIcon}>👁️</div>
                  <h3 style={styles.overlayTitle}>Interactive 3D Canvas</h3>
                  <p style={styles.overlayDesc}>
                    {mode === "custom" && geometryData
                      ? "Hình vẽ đã dựng. Bật camera để xem dưới dạng AR hoặc di chuột/cử chỉ bên trong khung này để tương tác."
                      : "Hãy tải ảnh đề bài lên hoặc chọn bài toán mẫu để bắt đầu."}
                  </p>
                </div>
              </div>
            )}

            {/* ── WebXR HUD Overlay (chỉ hiện khi đang chạy WebXR) ── */}
            {xrSessionActive && (
              <div style={styles.xrHud}>
                <button
                  style={styles.xrExitBtn}
                  className="no-gesture"
                  onClick={toggleXR}
                >
                  ✕ Thoát AR
                </button>
                <div style={styles.xrInstructions} className="no-gesture">
                  <div style={styles.xrInstructionsTitle}>Hướng dẫn tương tác:</div>
                  <div>• Quét camera quanh sàn/bàn để tìm bề mặt.</div>
                  <div>• Chạm điểm ngắm màu xanh để đặt hình.</div>
                  <div>• Vuốt 1 ngón tay để xoay, 2 ngón tay để thu phóng.</div>
                </div>
              </div>
            )}
          </div>

          {/* ── Meta: V, S, h ──────────────────────────────────── */}
          {mode === "custom" && geometryData?.meta && (
            <div style={styles.metaBar}>
              {geometryData.meta.volume !== undefined && (
                <MetaChip
                  label="Thể tích"
                  value={`${geometryData.meta.volume.toFixed(3)}`}
                  unit="đvtt"
                />
              )}
              {geometryData.meta.surface_area !== undefined && (
                <MetaChip
                  label="Diện tích TP"
                  value={`${geometryData.meta.surface_area.toFixed(2)}`}
                  unit="đvdt"
                />
              )}
              {geometryData.meta.height !== undefined && (
                <MetaChip
                  label="Chiều cao"
                  value={`${geometryData.meta.height}`}
                  unit="h"
                />
              )}
              {geometryData.meta.base_edge !== undefined && (
                <MetaChip
                  label="Cạnh đáy"
                  value={`${geometryData.meta.base_edge}`}
                  unit="a"
                />
              )}
            </div>
          )}
        </div>

        {/* ── BẢNG ĐIỀU KHIỂN (BÊN PHẢI) ────────────────────────── */}
        <div style={styles.controlsCol}>
          <div style={styles.controlsCard}>
            <div style={styles.panelTitle}>Điều khiển AR</div>
            <ARControls
              onToggleCamera={toggleCamera}
              cameraActive={cameraActive}
              onToggleXR={toggleXR}
              xrSessionActive={xrSessionActive}
              error={error}
            />
          </div>

          <div style={styles.helpCard}>
            <div style={styles.panelTitle}>Hand Gestures</div>
            <div style={styles.gestureList}>
              <GestureRow emoji="🖐" title="Open Palm" desc="Xoay object" />
              <GestureRow emoji="🤏" title="Pinch" desc="Di chuyển object" />
              <GestureRow
                emoji="🤏🤏"
                title="2 tay Pinch"
                desc="Phóng to / Thu nhỏ"
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { background-color: transparent }
          50% { background-color: #50fa7b }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────────────────────────────────────

function GestureRow({ emoji, title, desc }) {
  return (
    <div style={styles.gestureRow}>
      <div style={styles.gestureEmoji}>{emoji}</div>
      <div>
        <div style={styles.gestureTitle}>{title}</div>
        <div style={styles.gestureDesc}>{desc}</div>
      </div>
    </div>
  );
}

function MetaChip({ label, value, unit }) {
  return (
    <div style={styles.metaChip}>
      <span style={styles.metaLabel}>{label}</span>
      <span style={styles.metaValue}>
        {value}
        {unit && <span style={styles.metaUnit}> {unit}</span>}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = {
  page: {
    maxWidth: "1800px",
    margin: "0 auto",
    padding: "40px 24px 60px",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 2.2fr 240px",
    gap: "20px",
    alignItems: "stretch",
  },

  viewerCard: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "18px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: "780px",
  },

  viewerHeader: {
    padding: "18px 22px",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  shapeName: {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--text)",
  },

  shapeInfo: {
    fontSize: "11px",
    marginTop: "4px",
    color: "var(--text3)",
    fontFamily: "'Space Mono', monospace",
  },

  statusWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    transition: "background .3s ease",
  },

  statusText: {
    fontSize: "11px",
    color: "var(--text3)",
    fontFamily: "'Space Mono', monospace",
  },

  problemBanner: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    padding: "12px 20px",
    borderBottom: "1px solid var(--border)",
    background: "rgba(0,229,255,0.04)",
  },

  problemIcon: { fontSize: "16px", flexShrink: 0 },

  problemText: {
    fontSize: "13px",
    color: "var(--text2)",
    lineHeight: 1.6,
  },

  canvasWrapper: {
    position: "relative",
    flex: 1,
    overflow: "hidden",
    background: "#050505",
  },

  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 0,
  },

  canvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
    background: "transparent",
  },

  // Label container: absolute, full-size, không block mouse events
  labelContainer: {
    position: "absolute",
    inset: 0,
    zIndex: 3,
    pointerEvents: "none",
    overflow: "hidden",
  },

  // Vertex label: ô tên đỉnh (A, B, S...)
  vertexLabel: {
    position: "absolute",
    transform: "translate(-50%, -130%)", // Nổi lên trên điểm
    padding: "3px 9px",
    borderRadius: "7px",
    border: "1.5px solid",
    fontSize: "13px",
    fontWeight: 700,
    fontFamily: "'Space Mono', monospace",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    letterSpacing: "0.5px",
    // boxShadow để nổi bật trên background tối
    boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
  },

  // Edge label: độ dài cạnh ở giữa cạnh
  edgeLabel: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    padding: "2px 7px",
    borderRadius: "5px",
    background: "rgba(0,0,0,0.72)",
    border: "1px solid rgba(255,255,255,0.18)",
    fontSize: "11px",
    fontFamily: "'Space Mono', monospace",
    color: "rgba(255,255,200,0.9)",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
  },

  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(8px)",
    background: "rgba(0,0,0,.45)",
  },

  overlayBox: {
    textAlign: "center",
    padding: "32px",
  },

  overlayIcon: { fontSize: "52px", marginBottom: "18px" },

  overlayTitle: {
    fontSize: "30px",
    color: "var(--text)",
    marginBottom: "12px",
  },

  overlayDesc: {
    color: "var(--text2)",
    fontSize: "15px",
    lineHeight: 1.7,
    maxWidth: "420px",
  },

  metaBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    padding: "14px 20px",
    borderTop: "1px solid var(--border)",
    background: "rgba(0,229,255,0.02)",
  },

  metaChip: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "8px 14px",
    minWidth: "90px",
  },

  metaLabel: {
    fontSize: "10px",
    color: "var(--text3)",
    fontFamily: "'Space Mono', monospace",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  metaValue: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--cyan)",
    fontFamily: "'Space Mono', monospace",
  },

  metaUnit: {
    fontSize: "10px",
    color: "var(--text3)",
  },

  controlsCol: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  controlsCard: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    overflow: "hidden",
    padding: "14px",
  },

  helpCard: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "14px",
  },

  panelTitle: {
    fontSize: "10px",
    color: "var(--text3)",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "10px",
    fontFamily: "'Space Mono', monospace",
  },

  gestureList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  gestureRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px",
  },

  gestureEmoji: {
    fontSize: "18px",
    width: "30px",
    textAlign: "center",
  },

  gestureTitle: {
    color: "var(--text)",
    fontSize: "12px",
    fontWeight: 500,
  },

  gestureDesc: {
    color: "var(--text3)",
    fontSize: "11px",
    marginTop: "1px",
  },

  solutionCard: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "18px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: "780px",
  },

  solutionHeader: {
    padding: "18px 22px",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  solutionTitleIcon: {
    fontSize: "18px",
  },

  solutionTitle: {
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--text)",
  },

  solutionBody: {
    padding: "20px",
    flex: 1,
    overflowY: "auto",
    maxHeight: "710px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  problemBox: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "14px 16px",
  },

  boxLabel: {
    fontSize: "10px",
    color: "var(--text3)",
    fontFamily: "'Space Mono', monospace",
    fontWeight: 600,
    letterSpacing: "0.5px",
    marginBottom: "8px",
  },

  problemTextScanned: {
    fontSize: "13.5px",
    color: "var(--text2)",
    lineHeight: "1.6",
    fontStyle: "italic",
  },

  solutionContentBox: {
    background: "rgba(0, 229, 255, 0.01)",
    border: "1px solid rgba(0, 229, 255, 0.08)",
    borderRadius: "12px",
    padding: "16px 18px",
  },

  noSolutionBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "var(--text2)",
    padding: "40px 20px",
    background: "rgba(255,255,255,0.01)",
    border: "1px dashed var(--border)",
    borderRadius: "12px",
    flex: 1,
  },

  emptyStateBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    flex: 1,
    padding: "40px 20px",
  },

  solutionError: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "30px 20px",
    border: "1px solid rgba(255,0,0,0.15)",
    background: "rgba(255,0,0,0.02)",
    borderRadius: "12px",
    color: "#ff8a8a",
    flex: 1,
  },

  errorIcon: {
    fontSize: "32px",
    marginBottom: "10px",
  },

  errorTitle: {
    fontWeight: 600,
    fontSize: "15px",
    marginBottom: "6px",
  },

  errorText: {
    fontSize: "12.5px",
    opacity: 0.85,
    lineHeight: 1.5,
  },

  terminal: {
    background: "#0c0f1d",
    border: "1px solid #1a223f",
    borderRadius: "10px",
    fontFamily: "'Space Mono', Consolas, monospace",
    fontSize: "12px",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: "360px",
  },

  terminalHeader: {
    background: "#14192b",
    padding: "10px 14px",
    borderBottom: "1px solid #1a223f",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  terminalDotRed: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#ff5f56",
  },

  terminalDotYellow: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#ffbd2e",
  },

  terminalDotGreen: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#27c93f",
  },

  terminalTitle: {
    color: "#8c9fc2",
    fontSize: "11px",
    marginLeft: "10px",
  },

  terminalBody: {
    padding: "16px",
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    background: "#0c0f1d",
  },

  terminalLine: {
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },

  terminalPrompt: {
    color: "#50fa7b",
    marginRight: "6px",
    fontWeight: "bold",
  },

  terminalCursor: {
    display: "inline-block",
    width: "8px",
    height: "14px",
    background: "#50fa7b",
    animation: "blink 1s step-end infinite",
    marginTop: "4px",
  },

  xrHud: {
    position: "absolute",
    inset: 0,
    zIndex: 10,
    pointerEvents: "none",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "20px",
  },

  xrExitBtn: {
    alignSelf: "flex-end",
    padding: "10px 18px",
    borderRadius: "10px",
    background: "rgba(220, 53, 69, 0.85)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    pointerEvents: "auto",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)",
    transition: "background 0.2s",
  },

  xrInstructions: {
    alignSelf: "center",
    background: "rgba(0, 0, 0, 0.75)",
    border: "1px solid rgba(0, 229, 255, 0.25)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "#fff",
    fontSize: "12px",
    lineHeight: "1.6",
    maxWidth: "340px",
    pointerEvents: "auto",
    boxShadow: "0 4px 15px rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
  },

  xrInstructionsTitle: {
    fontWeight: 700,
    color: "var(--cyan)",
    marginBottom: "4px",
    textTransform: "uppercase",
    fontSize: "10px",
    letterSpacing: "0.5px",
  },
};
