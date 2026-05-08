import { useRef } from "react";

import useViewerStore from "../../store/useViewerStore";

import { useAR } from "../../hooks/useAR";

export function ARViewer() {
  const canvasRef = useRef(null);

  const { currentShape, size, opacity, wireframe, autoRotate } =
    useViewerStore();

  const { cameraActive, videoRef } = useAR(canvasRef, currentShape, {
    size,
    opacity,
    wireframe,
    autoRotate,
  });

  return (
    <div className="ar-viewer-container">
      <div className="canvas-wrapper">
        {/* CAMERA */}
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          muted
          playsInline
        />

        {/* THREE */}
        <canvas ref={canvasRef} className="ar-canvas" />

        {/* OVERLAY */}
        {!cameraActive && (
          <div className="canvas-overlay">
            <div className="overlay-content">
              <div className="overlay-icon">🎯</div>

              <h2>AR Geometry Viewer</h2>

              <p>
                Chọn hình khối và bật camera để bắt đầu trải nghiệm AR tương tác
                bằng cử chỉ tay
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .ar-viewer-container {
          width: 100%;
          height: 100%;
          background: var(--bg2);
          overflow: hidden;
        }

        .canvas-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .camera-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
        }

        .ar-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          z-index: 1;
          background: transparent;
        }

        .canvas-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;

          display: flex;
          justify-content: center;
          align-items: center;

          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(8px);
        }

        .overlay-content {
          text-align: center;
          padding: 32px;
          max-width: 420px;
        }

        .overlay-icon {
          font-size: 52px;
          margin-bottom: 18px;
        }

        .overlay-content h2 {
          font-size: 28px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 14px;
          line-height: 1.2;
        }

        .overlay-content p {
          font-size: 14px;
          line-height: 1.8;
          color: var(--text2);
        }

        @media (max-width: 768px) {
          .overlay-content h2 {
            font-size: 22px;
          }

          .overlay-content p {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}
