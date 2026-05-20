import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";

import SectionHeader from "../components/ui/SectionHeader";
import { ARControls } from "../components/ar/ARControls";

import useViewerStore from "../store/useViewerStore";
import { useAR } from "../hooks/useAR";
import { computeLabelPositions } from "../utils/buildCustomGeometry";

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
  } = useViewerStore();

  const { cameraActive, toggleCamera, error, videoRef, cameraRef, customGroupRef } = useAR(
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
        {/* ── VIEWER ─────────────────────────────────────────────── */}
        <div style={styles.viewerCard}>
          <div style={styles.viewerHeader}>
            <div>
              <div style={styles.shapeName}>
                {mode === "custom"
                  ? geometryData?.label || "Bài toán hình học"
                  : currentShape?.name}
              </div>
              <div style={styles.shapeInfo}>
                {mode === "custom"
                  ? "Geometry Engine Output"
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

          {/* ── Mô tả bài toán ──────────────────────────────────── */}
          {mode === "custom" && geometryData?.problem && (
            <div style={styles.problemBanner}>
              <span style={styles.problemIcon}>📐</span>
              <span style={styles.problemText}>{geometryData.problem}</span>
            </div>
          )}

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
            {mode === "custom" && (
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

                {/* Edge length labels — chỉ hiện khi bật showEdgeLengths */}
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
            {!cameraActive && (
              <div style={styles.overlay}>
                <div style={styles.overlayBox}>
                  <div style={styles.overlayIcon}>🎯</div>
                  <h2 style={styles.overlayTitle}>AR Geometry Viewer</h2>
                  <p style={styles.overlayDesc}>
                    {mode === "custom" && geometryData
                      ? "Bài toán đã tải. Bật camera để xem hình 3D AR."
                      : "Chọn bài toán hoặc hình chuẩn, rồi bật camera."}
                  </p>
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

        {/* ── CONTROLS ─────────────────────────────────────────── */}
        <div style={styles.controlsCol}>
          <div style={styles.controlsCard}>
            <div style={styles.panelTitle}>Điều khiển AR</div>
            <ARControls
              onToggleCamera={toggleCamera}
              cameraActive={cameraActive}
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
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "40px 24px 60px",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
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
    minHeight: "720px",
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
    gap: "20px",
  },

  controlsCard: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "18px",
    overflow: "hidden",
    padding: "20px",
  },

  helpCard: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "18px",
    padding: "20px",
  },

  panelTitle: {
    fontSize: "11px",
    color: "var(--text3)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "18px",
    fontFamily: "'Space Mono', monospace",
  },

  gestureList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  gestureRow: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "12px",
  },

  gestureEmoji: {
    fontSize: "24px",
    width: "42px",
    textAlign: "center",
  },

  gestureTitle: {
    color: "var(--text)",
    fontSize: "13px",
    fontWeight: 500,
  },

  gestureDesc: {
    color: "var(--text3)",
    fontSize: "12px",
    marginTop: "3px",
  },
};
