import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { makeGeo, makeMaterial, makeEdges } from "../utils/geometry";
import { buildCustomGeometry } from "../utils/buildCustomGeometry";

import { useHandTracking } from "./useHandTracking";
import { getDistance } from "../utils/gestures";
import { isPinching, isOpenPalm } from "../utils/gestureDetection";
import useViewerStore from "../store/useViewerStore";

export function useAR(
  canvasRef,
  shape,
  { size, opacity, wireframe, autoRotate, showConstraints = true },
  geometryData = null,
) {
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const edgesRef = useRef(null);
  const customGroupRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // ── WebXR Refs & State ───────────────────────────────────────────────────
  const [xrSessionActive, setXrSessionActive] = useState(false);
  const xrHitTestSourceRef = useRef(null);
  const xrRefSpaceRef = useRef(null);
  const reticleRef = useRef(null);

  // ── Touch Gesture Refs ───────────────────────────────────────────────────
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef(0);
  const touchStartScaleRef = useRef(1);
  const isDraggingRef = useRef(false);
  const touchActiveRef = useRef(false);

  // ── Hand Gesture Refs (Open Palm & Pinch) ─────────────────────────────────
  const prevWristRef = useRef(null);
  const rotVelocityRef = useRef({ x: 0, y: 0 });
  const prevPinchWristRef = useRef(null);
  const posVelocityRef = useRef({ x: 0, y: 0 });
  const twoHandDistanceRef = useRef(null);
  const scaleVelocityRef = useRef(0);

  // ── Sensitivity & Damping Constants ──────────────────────────────────────
  const ROT_SENSITIVITY  = 2.5;
  const ROT_DAMPING      = 0.75;
  const ROT_DEADZONE     = 0.005;

  const MOVE_SENSITIVITY = 2.0;
  const MOVE_DAMPING     = 0.75;
  const MOVE_DEADZONE    = 0.005;

  const SCALE_SENSITIVITY = 3.0;
  const SCALE_DAMPING     = 0.70;
  const SCALE_DEADZONE    = 0.005;
  const SCALE_MIN         = 0.3;
  const SCALE_MAX         = 6.0;

  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [handDetected, setHandDetected] = useState(false);

  // ── Initialize Scene, Camera, Renderer, and WebXR Event Listeners ──────────
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 2.5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false, // Tắt khử răng cưa để tiết kiệm dung lượng tính toán của GPU trên di động
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    
    // Giới hạn pixelRatio mặc định là 1.5
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    // Enable WebXR inside Three.js
    renderer.xr.enabled = true;

    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xff00ff, 0.5);
    pointLight.position.set(-5, -5, 5);
    scene.add(pointLight);

    // Create Reticle (Vòng ngắm quét sàn) for WebXR
    const reticleGeo = new THREE.RingGeometry(0.1, 0.12, 32);
    reticleGeo.rotateX(-Math.PI / 2);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const reticle = new THREE.Mesh(reticleGeo, reticleMat);
    reticle.visible = false;
    reticle.matrixAutoUpdate = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    // WebXR Session Listeners
    const onSessionStart = () => {
      setXrSessionActive(true);
      renderer.setPixelRatio(1.0); // Ép hiệu năng tối đa bằng cách đặt pixelRatio = 1.0 trong WebXR
    };
    const onSessionEnd = () => {
      setXrSessionActive(false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Trả lại 1.5 khi về màn hình thường
      xrHitTestSourceRef.current = null;
      xrRefSpaceRef.current = null;
      if (reticleRef.current) reticleRef.current.visible = false;
    };

    renderer.xr.addEventListener("sessionstart", onSessionStart);
    renderer.xr.addEventListener("sessionend", onSessionEnd);

    const handleResize = () => {
      if (!canvasRef.current) return;
      const newWidth = canvasRef.current.clientWidth;
      const newHeight = canvasRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.xr.removeEventListener("sessionstart", onSessionStart);
      renderer.xr.removeEventListener("sessionend", onSessionEnd);
      renderer.dispose();
    };
  }, []);

  // ── Touch controls (Xoay/Thu phóng) bằng vuốt chạm trực tiếp ──────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getTarget = () => customGroupRef.current || meshRef.current;

    const onTouchStart = (e) => {
      // Tránh cướp click của nút bấm hoặc các phần tử giao diện khác trong overlay
      const tagName = e.target.tagName?.toLowerCase();
      if (
        tagName === "button" ||
        tagName === "select" ||
        tagName === "input" ||
        e.target.closest(".no-gesture")
      ) {
        touchActiveRef.current = false;
        return;
      }

      // Chỉ nhận touch nếu chạm vào canvas hoặc đang chạy WebXR
      if (!canvas.contains(e.target) && !xrSessionActive) {
        touchActiveRef.current = false;
        return;
      }
      touchActiveRef.current = true;
      isDraggingRef.current = false;

      if (e.touches.length === 1) {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
        const target = getTarget();
        if (target) {
          touchStartScaleRef.current = target.scale.x;
        }
      }
    };

    const onTouchMove = (e) => {
      if (!touchActiveRef.current) return;
      const target = getTarget();
      if (!target) return;

      if (e.touches.length === 1) {
        const curX = e.touches[0].clientX;
        const curY = e.touches[0].clientY;
        const dx = curX - touchStartRef.current.x;
        const dy = curY - touchStartRef.current.y;

        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          isDraggingRef.current = true;
        }

        // Xoay hình 3D
        target.rotation.y += dx * 0.007;
        target.rotation.x += dy * 0.007;

        const edges = customGroupRef.current ? null : edgesRef.current;
        if (edges) {
          edges.rotation.copy(target.rotation);
        }

        touchStartRef.current = { x: curX, y: curY };
      } else if (e.touches.length === 2) {
        isDraggingRef.current = true;

        // Thu phóng hình 3D (Pinch to scale)
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (touchStartDistRef.current > 0) {
          const ratio = dist / touchStartDistRef.current;
          const newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, touchStartScaleRef.current * ratio));
          target.scale.setScalar(newScale);
          const edges = customGroupRef.current ? null : edgesRef.current;
          if (edges) {
            edges.scale.copy(target.scale);
          }
        }
      }
    };

    const onTouchEnd = () => {
      touchActiveRef.current = false;
    };

    // Đăng ký sự kiện vào window thay vì canvas để chạy được trong môi trường WebXR
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [xrSessionActive]);

  // ── Cập nhật và vẽ các hình học 3D ──────────────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current = null;
    }
    if (edgesRef.current) {
      scene.remove(edgesRef.current);
      edgesRef.current = null;
    }
    if (customGroupRef.current) {
      scene.remove(customGroupRef.current);
      customGroupRef.current = null;
    }

    // ── CUSTOM MODE ───────────────────
    if (geometryData) {
      const group = buildCustomGeometry(geometryData, {
        opacity,
        scaleFactor: xrSessionActive ? size * 0.18 : size, // Thu nhỏ bằng 18% khi quét sàn WebXR
        showPoints: true,
        showConstraints: showConstraints,
        show3DLabels: xrSessionActive, // Hiện nhãn 3D nổi khi trong chế độ WebXR
      });
      // Ẩn vật thể lúc mới khởi động WebXR cho tới khi đặt lên sàn
      if (xrSessionActive) {
        group.visible = false;
      }
      scene.add(group);
      customGroupRef.current = group;
      return;
    }

    // ── PRESET MODE ─────────────────
    if (!shape) return;

    const geometry = makeGeo(shape.geo);
    const material = makeMaterial(shape.color, wireframe, opacity);
    const mesh = new THREE.Mesh(geometry, material);
    const targetSize = xrSessionActive ? size * 0.18 : size;
    mesh.scale.set(targetSize, targetSize, targetSize);
    if (xrSessionActive) {
      mesh.visible = false;
    }
    scene.add(mesh);
    meshRef.current = mesh;

    const edges = makeEdges(geometry, 0xffffff);
    edges.scale.set(targetSize, targetSize, targetSize);
    if (xrSessionActive) {
      edges.visible = false;
    }
    scene.add(edges);
    edgesRef.current = edges;
  }, [geometryData, shape, size, opacity, wireframe, showConstraints, xrSessionActive]);

  // ── WebXR Touch Select Listener (Neo đậu vật thể xuống sàn) ───────────────────
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const onSelect = () => {
      // Nếu người dùng đang vuốt để xoay hoặc zoom, bỏ qua select
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        return;
      }

      const reticle = reticleRef.current;
      const obj = customGroupRef.current || meshRef.current;
      const edges = customGroupRef.current ? null : edgesRef.current;

      if (reticle && reticle.visible && obj) {
        // Đặt vật thể vào tọa độ quét được của Reticle
        obj.position.setFromMatrixPosition(reticle.matrix);

        // Hiện vật thể lên khi được đặt xuống sàn thành công
        obj.visible = true;

        // Quay mặt vật thể hướng về phía camera
        const camPos = new THREE.Vector3();
        cameraRef.current.getWorldPosition(camPos);
        camPos.y = obj.position.y; // giữ thăng bằng phẳng đứng
        obj.lookAt(camPos);

        if (edges) {
          edges.visible = true;
          edges.position.copy(obj.position);
          edges.rotation.copy(obj.rotation);
        }

        // Nháy xanh lá cây reticle để phản hồi đã đặt thành công
        if (reticle.material) {
          const oldColor = reticle.material.color.getHex();
          reticle.material.color.setHex(0x10ffa0);
          setTimeout(() => {
            if (reticle.material) reticle.material.color.setHex(oldColor);
          }, 300);
        }
      }
    };

    const sessionStartListener = () => {
      const session = renderer.xr.getSession();
      if (session) {
        session.addEventListener("select", onSelect);
      }
    };

    renderer.xr.addEventListener("sessionstart", sessionStartListener);

    return () => {
      renderer.xr.removeEventListener("sessionstart", sessionStartListener);
      const session = renderer.xr.getSession();
      if (session) {
        session.removeEventListener("select", onSelect);
      }
    };
  }, [geometryData, shape]);

  // ── Render & WebXR Hit-Testing Loop ───────────────────────────────────────
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const animate = () => {
      const obj = customGroupRef.current || meshRef.current;
      const edges = customGroupRef.current ? null : edgesRef.current;

      // ── Xử lý Hit Test để tìm sàn khi ở trong WebXR ──
      if (xrSessionActive) {
        const frame = renderer.xr.getFrame();
        const hitTestSource = xrHitTestSourceRef.current;
        const referenceSpace = renderer.xr.getReferenceSpace();

        if (frame && hitTestSource && referenceSpace) {
          const hitTestResults = frame.getHitTestResults(hitTestSource);
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            if (pose && reticleRef.current) {
              reticleRef.current.visible = true;
              reticleRef.current.matrix.fromArray(pose.transform.matrix);
            }
          } else {
            if (reticleRef.current) reticleRef.current.visible = false;
          }
        }
      } else {
        if (reticleRef.current) reticleRef.current.visible = false;
      }

      // ── Tự động xoay khi không có tay và không ở WebXR ──
      if (obj && autoRotate && !handDetected && !xrSessionActive) {
        obj.rotation.x += 0.005;
        obj.rotation.y += 0.008;
        if (edges) {
          edges.rotation.x += 0.005;
          edges.rotation.y += 0.008;
        }
      }

      // ── Momentum: ROTATION (Xoay theo quán tính) ──
      const rv = rotVelocityRef.current;
      if (obj && (Math.abs(rv.x) > 0.0001 || Math.abs(rv.y) > 0.0001)) {
        obj.rotation.x += rv.x;
        obj.rotation.y += rv.y;
        if (edges) {
          edges.rotation.x += rv.x;
          edges.rotation.y += rv.y;
        }
        rv.x *= ROT_DAMPING; if (Math.abs(rv.x) < 0.0001) rv.x = 0;
        rv.y *= ROT_DAMPING; if (Math.abs(rv.y) < 0.0001) rv.y = 0;
      }

      // ── Momentum: POSITION (Di chuyển theo quán tính - chỉ chạy ngoài WebXR) ──
      if (!xrSessionActive) {
        const pv = posVelocityRef.current;
        if (obj && (Math.abs(pv.x) > 0.0001 || Math.abs(pv.y) > 0.0001)) {
          obj.position.x += pv.x;
          obj.position.y += pv.y;
          if (edges) {
            edges.position.x += pv.x;
            edges.position.y += pv.y;
          }
          pv.x *= MOVE_DAMPING; if (Math.abs(pv.x) < 0.0001) pv.x = 0;
          pv.y *= MOVE_DAMPING; if (Math.abs(pv.y) < 0.0001) pv.y = 0;
        }
      }

      // ── Momentum: SCALE (Thu phóng theo quán tính) ──
      const sv = scaleVelocityRef;
      if (obj && Math.abs(sv.current) > 0.0001) {
        const newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, obj.scale.x + sv.current));
        obj.scale.setScalar(newScale);
        if (edges) edges.scale.copy(obj.scale);
        sv.current *= SCALE_DAMPING;
        if (Math.abs(sv.current) < 0.0001) sv.current = 0;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    renderer.setAnimationLoop(animate);

    return () => {
      renderer.setAnimationLoop(null);
    };
  }, [autoRotate, handDetected, xrSessionActive]);

  // ── Mediapipe Hand Tracking (Chỉ chạy khi bật camera thường và không ở WebXR) ──
  useHandTracking(videoRef, cameraActive && !xrSessionActive, (results) => {
    if (!results.multiHandLandmarks?.length) {
      setHandDetected(false);
      return;
    }

    setHandDetected(true);
    const getTarget = () => customGroupRef.current || meshRef.current;

    if (results.multiHandLandmarks.length === 1) {
      const hand = results.multiHandLandmarks[0];
      const wrist = hand[0];
      const pinch = isPinching(hand);
      const openPalm = isOpenPalm(hand);
      const target = getTarget();

      if (pinch && target) {
        const curX = wrist.x;
        const curY = wrist.y;
        if (prevPinchWristRef.current !== null) {
          const dx =  curX - prevPinchWristRef.current.x;
          const dy = -curY + prevPinchWristRef.current.y;

          if (Math.abs(dx) > MOVE_DEADZONE || Math.abs(dy) > MOVE_DEADZONE) {
            posVelocityRef.current.x += dx * MOVE_SENSITIVITY;
            posVelocityRef.current.y += dy * MOVE_SENSITIVITY;
            posVelocityRef.current.x = Math.max(-0.15, Math.min(0.15, posVelocityRef.current.x));
            posVelocityRef.current.y = Math.max(-0.15, Math.min(0.15, posVelocityRef.current.y));
          }
        }
        prevPinchWristRef.current = { x: curX, y: curY };
      } else {
        prevPinchWristRef.current = null;
      }

      if (openPalm && target) {
        const curX = wrist.x;
        const curY = wrist.y;
        if (prevWristRef.current !== null) {
          const dx = curX - prevWristRef.current.x;
          const dy = curY - prevWristRef.current.y;

          if (Math.abs(dx) > ROT_DEADZONE || Math.abs(dy) > ROT_DEADZONE) {
            rotVelocityRef.current.y += dx * ROT_SENSITIVITY;
            rotVelocityRef.current.x += dy * ROT_SENSITIVITY;
            rotVelocityRef.current.y = Math.max(-0.15, Math.min(0.15, rotVelocityRef.current.y));
            rotVelocityRef.current.x = Math.max(-0.15, Math.min(0.15, rotVelocityRef.current.x));
          }
        }
        prevWristRef.current = { x: curX, y: curY };
      } else {
        prevWristRef.current = null;
      }
    }

    if (results.multiHandLandmarks.length === 2) {
      const hand1 = results.multiHandLandmarks[0];
      const hand2 = results.multiHandLandmarks[1];
      const hand1Pinch = isPinching(hand1);
      const hand2Pinch = isPinching(hand2);
      const target = getTarget();

      if (hand1Pinch && hand2Pinch && target) {
        const p1 = hand1[8];
        const p2 = hand2[8];
        const handDistance = getDistance(p1, p2);

        if (twoHandDistanceRef.current !== null) {
          const delta = handDistance - twoHandDistanceRef.current;
          if (Math.abs(delta) > SCALE_DEADZONE) {
            scaleVelocityRef.current += delta * SCALE_SENSITIVITY;
            scaleVelocityRef.current = Math.max(-0.15, Math.min(0.15, scaleVelocityRef.current));
          }
        }
        twoHandDistanceRef.current = handDistance;
      } else {
        twoHandDistanceRef.current = null;
      }
    }
  });

  // ── Khởi động/Tắt luồng camera webcam thông thường ───────────────────────────
  const toggleCamera = async () => {
    try {
      if (cameraActive) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setCameraActive(false);
        setError(null);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setError(null);
    } catch (err) {
      const message =
        err.name === "NotAllowedError"
          ? "Bạn cần cấp quyền camera"
          : "Không thể truy cập camera: " + err.message;

      setError(message);
      setCameraActive(false);
    }
  };

  // ── Khởi động/Tắt WebXR AR session quét sàn ─────────────────────────────
  const toggleXR = async () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (renderer.xr.isPresenting) {
      const session = renderer.xr.getSession();
      if (session) {
        await session.end();
      }
      return;
    }

    try {
      setError(null);

      // Nếu đang mở camera thường, tắt đi để nhường quyền camera cho WebXR
      if (cameraActive) {
        await toggleCamera();
      }

      if (!canvasRef.current || !canvasRef.current.parentElement) {
        throw new Error("Không tìm thấy canvas wrapper element.");
      }

      const session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["local", "local-floor", "dom-overlay"],
        domOverlay: { root: canvasRef.current.parentElement },
      });

      await renderer.xr.setSession(session);

      // Thiết lập Hit Test Source
      const viewerSpace = await session.requestReferenceSpace("viewer");
      const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
      xrHitTestSourceRef.current = hitTestSource;

      const refSpace = await session.requestReferenceSpace("local");
      xrRefSpaceRef.current = refSpace;

      session.addEventListener("end", () => {
        xrHitTestSourceRef.current = null;
        xrRefSpaceRef.current = null;
      });
    } catch (err) {
      console.error("Lỗi khi mở phiên WebXR:", err);
      setError("Không hỗ trợ quét sàn WebXR trên trình duyệt này: " + err.message);
    }
  };

  return {
    cameraActive,
    toggleCamera,
    xrSessionActive,
    toggleXR,
    error,
    videoRef,
    cameraRef,
    customGroupRef,
    meshRef,
  };
}
