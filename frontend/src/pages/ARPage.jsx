import { useRef, useEffect } from "react";

import SectionHeader from "../components/ui/SectionHeader";

import { ARControls } from "../components/ar/ARControls";

import useViewerStore from "../store/useViewerStore";

import { useAR } from "../hooks/useAR";

export default function ARPage() {
  const canvasRef = useRef(null);

  const { currentShape, size, opacity, wireframe, autoRotate } =
    useViewerStore();

  const { cameraActive, toggleCamera, error, videoRef } = useAR(
    canvasRef,
    currentShape,
    {
      size,
      opacity,
      wireframe,
      autoRotate,
    },
  );

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
  }, []);

  return (
    <div style={styles.page}>
      <SectionHeader
        eyebrow="augmented reality"
        title="Trình xem AR tương tác bằng cử chỉ tay"
        desc="Điều khiển hình khối 3D bằng hand tracking realtime · Move · Rotate"
      />

      <div style={styles.layout} className="ar-layout">
        {/* VIEWER */}
        <div style={styles.viewerCard}>
          <div style={styles.viewerHeader}>
            <div>
              <div style={styles.shapeName}>{currentShape?.name}</div>

              <div style={styles.shapeInfo}>AR Hand Tracking Active</div>
            </div>

            <div style={styles.statusWrap}>
              <div
                style={{
                  ...styles.statusDot,
                  background: cameraActive ? "#10ffa0" : "#666",
                }}
              />

              <span style={styles.statusText}>
                {cameraActive ? "Camera Active" : "Camera Off"}
              </span>
            </div>
          </div>

          <div style={styles.canvasWrapper}>
            {/* CAMERA */}
            <video
              ref={videoRef}
              className="camera-video"
              autoPlay
              muted
              playsInline
              style={styles.video}
            />

            {/* THREE */}
            <canvas ref={canvasRef} style={styles.canvas} />

            {/* OVERLAY */}
            {!cameraActive && (
              <div style={styles.overlay}>
                <div style={styles.overlayBox}>
                  <div style={styles.overlayIcon}>🎯</div>

                  <h2 style={styles.overlayTitle}>AR Geometry Viewer</h2>

                  <p style={styles.overlayDesc}>
                    Bật camera để bắt đầu trải nghiệm AR tương tác bằng cử chỉ
                    tay
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CONTROLS */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    boxShadow: "0 0 10px currentColor",
  },

  statusText: {
    fontSize: "11px",
    color: "var(--text3)",
    fontFamily: "'Space Mono', monospace",
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

  overlayIcon: {
    fontSize: "52px",
    marginBottom: "18px",
  },

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
    overflow: "hidden",
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
