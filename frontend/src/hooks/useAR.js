import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { makeGeo, makeMaterial, makeEdges } from "../utils/geometry";
import { buildCustomGeometry } from "../utils/buildCustomGeometry";

import { useHandTracking } from "./useHandTracking";
import { getDistance } from "../utils/gestures";
import useViewerStore from "../store/useViewerStore";

// ── Phát hiện cử chỉ chụm ngón (Pinch) ──────────────────────────────────────
// Ngưỡng 0.08: đủ nhạy khi tay gần cam, không nhận nhầm tay mở bình thường
function isPinching(hand) {
  const thumbTip = hand[4];
  const indexTip = hand[8];
  const dx = thumbTip.x - indexTip.x;
  const dy = thumbTip.y - indexTip.y;
  return Math.sqrt(dx * dx + dy * dy) < 0.08;
}

// ── Phát hiện lòng bàn tay mở (Open Palm) ───────────────────────────────────
// Yêu cầu: KHÔNG đang pinch VÀ ít nhất 3 ngón tay duỗi thẳng
function isOpenPalm(hand) {
  if (isPinching(hand)) return false;
  // Ngón trỏ, giữa, áp út duỗi: tip.y < pip.y (trục Y của Mediapipe: 0=trên, 1=dưới)
  const indexExtended  = hand[8].y  < hand[6].y;
  const middleExtended = hand[12].y < hand[10].y;
  const ringExtended   = hand[16].y < hand[14].y;
  return indexExtended && middleExtended && ringExtended;
}

export function useAR(
  canvasRef,
  shape,
  { size, opacity, wireframe, autoRotate, showConstraints = true },
  geometryData = null,
) {
  const sceneRef       = useRef(null);
  const cameraRef      = useRef(null);
  const rendererRef    = useRef(null);
  const meshRef        = useRef(null);
  const edgesRef       = useRef(null);
  const customGroupRef = useRef(null);
  const videoRef       = useRef(null);
  const streamRef      = useRef(null);

  // ── WebXR Refs & State ────────────────────────────────────────────────────
  const [xrSessionActive, setXrSessionActive] = useState(false);
  const xrHitTestSourceRef = useRef(null);
  const xrRefSpaceRef      = useRef(null);
  const reticleRef         = useRef(null);

  // ── Touch Gesture Refs ────────────────────────────────────────────────────
  const touchStartRef      = useRef({ x: 0, y: 0 });
  const touchStartDistRef  = useRef(0);
  const touchStartScaleRef = useRef(1);
  const isDraggingRef      = useRef(false);
  const touchActiveRef     = useRef(false);

  // ── Hand Gesture Refs ─────────────────────────────────────────────────────
  // Xoay: open palm momentum
  const prevWristRef     = useRef(null);
  const rotVelocityRef   = useRef({ x: 0, y: 0 });
  // Di chuyển: 1-tay pinch
  const prevPinchRef     = useRef(null);   // {x, y} vị trí wrist frame trước
  // Phóng to/Thu nhỏ: 2-tay pinch
  const prevDistRef      = useRef(null);   // khoảng cách 2 ngón trỏ frame trước
  // Trạng thái tay hiện tại (dùng ref để không trigger re-render)
  const handActiveRef    = useRef(false);

  // ── Constants ─────────────────────────────────────────────────────────────
  const ROT_SENSITIVITY   = 3.0;
  const ROT_DAMPING       = 0.80;
  const ROT_DEADZONE      = 0.003;
  const MOVE_SCALE        = 4.5;   // hệ số nhạy kéo
  const SCALE_SCALE       = 3.5;   // hệ số nhạy zoom
  const SCALE_DEADZONE    = 0.003;
  const SCALE_MIN         = 0.3;
  const SCALE_MAX         = 6.0;

  const arAnchored = useViewerStore((state) => state.arAnchored);
  const arAnchoredRef = useRef(arAnchored);
  useEffect(() => { arAnchoredRef.current = arAnchored; }, [arAnchored]);

  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  // handDetected chỉ dùng để điều khiển auto-rotate UI, KHÔNG ảnh hưởng gesture logic
  const [handDetected, setHandDetected] = useState(false);

  // ── Initialize Scene, Camera, Renderer ───────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const width  = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 2.5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.xr.enabled = true;
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
    const ptLight = new THREE.PointLight(0xff00ff, 0.5);
    ptLight.position.set(-5, -5, 5);
    scene.add(ptLight);

    // Reticle cho WebXR
    const reticleGeo = new THREE.RingGeometry(0.1, 0.12, 32);
    reticleGeo.rotateX(-Math.PI / 2);
    const reticle = new THREE.Mesh(reticleGeo, new THREE.MeshBasicMaterial({
      color: 0x00e5ff, side: THREE.DoubleSide, transparent: true, opacity: 0.8,
    }));
    reticle.visible = false;
    reticle.matrixAutoUpdate = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    const onSessionStart = () => {
      setXrSessionActive(true);
      renderer.setPixelRatio(1.0);
    };
    const onSessionEnd = () => {
      setXrSessionActive(false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      xrHitTestSourceRef.current = null;
      xrRefSpaceRef.current = null;
      if (reticleRef.current) reticleRef.current.visible = false;
    };
    renderer.xr.addEventListener("sessionstart", onSessionStart);
    renderer.xr.addEventListener("sessionend",   onSessionEnd);

    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.xr.removeEventListener("sessionstart", onSessionStart);
      renderer.xr.removeEventListener("sessionend",   onSessionEnd);
      renderer.dispose();
    };
  }, []);

  // ── Touch Controls (Cam sau / WebXR) ─────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getTarget = () => customGroupRef.current || meshRef.current;

    const onTouchStart = (e) => {
      const tagName = e.target.tagName?.toLowerCase();
      if (tagName === "button" || tagName === "select" || tagName === "input" ||
          e.target.closest(".no-gesture")) {
        touchActiveRef.current = false;
        return;
      }
      if (!canvas.contains(e.target) && !xrSessionActive) {
        touchActiveRef.current = false;
        return;
      }
      touchActiveRef.current = true;
      isDraggingRef.current  = false;

      if (e.touches.length === 1) {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
        const target = getTarget();
        if (target) touchStartScaleRef.current = target.scale.x;
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
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) isDraggingRef.current = true;

        if (xrSessionActive && !arAnchoredRef.current) {
          const tempCamQ = new THREE.Quaternion();
          cameraRef.current.getWorldQuaternion(tempCamQ);
          const right   = new THREE.Vector3(1, 0, 0).applyQuaternion(tempCamQ);
          right.y = 0; right.normalize();
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(tempCamQ);
          forward.y = 0; forward.normalize();
          target.position.addScaledVector(right,    dx * 0.0015);
          target.position.addScaledVector(forward, -dy * 0.0015);
          const edges = customGroupRef.current ? null : edgesRef.current;
          if (edges) edges.position.copy(target.position);
        } else {
          target.rotation.y += dx * 0.007;
          if (!xrSessionActive) target.rotation.x += dy * 0.007;
          const edges = customGroupRef.current ? null : edgesRef.current;
          if (edges) edges.rotation.copy(target.rotation);
        }
        touchStartRef.current = { x: curX, y: curY };

      } else if (e.touches.length === 2) {
        isDraggingRef.current = true;
        const dx   = e.touches[0].clientX - e.touches[1].clientX;
        const dy   = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (touchStartDistRef.current > 0) {
          const ratio    = dist / touchStartDistRef.current;
          const newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX,
            touchStartScaleRef.current * ratio));
          target.scale.setScalar(newScale);
          const edges = customGroupRef.current ? null : edgesRef.current;
          if (edges) edges.scale.copy(target.scale);
        }
      }
    };

    const onTouchEnd = () => { touchActiveRef.current = false; };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: true });
    window.addEventListener("touchend",   onTouchEnd,   { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("touchend",   onTouchEnd);
    };
  }, [xrSessionActive]);

  // ── Cập nhật hình học 3D ──────────────────────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (meshRef.current)        { scene.remove(meshRef.current);        meshRef.current = null; }
    if (edgesRef.current)       { scene.remove(edgesRef.current);       edgesRef.current = null; }
    if (customGroupRef.current) { scene.remove(customGroupRef.current); customGroupRef.current = null; }

    if (geometryData) {
      const group = buildCustomGeometry(geometryData, {
        opacity,
        scaleFactor: xrSessionActive ? size * 0.18 : size,
        showPoints: true,
        showConstraints,
        show3DLabels: xrSessionActive,
      });
      if (xrSessionActive) group.visible = false;
      scene.add(group);
      customGroupRef.current = group;
      return;
    }

    if (!shape) return;

    const geometry  = makeGeo(shape.geo);
    const material  = makeMaterial(shape.color, wireframe, opacity);
    const mesh      = new THREE.Mesh(geometry, material);
    const targetSize = xrSessionActive ? size * 0.18 : size;
    mesh.scale.set(targetSize, targetSize, targetSize);
    if (xrSessionActive) mesh.visible = false;
    scene.add(mesh);
    meshRef.current = mesh;

    const edges = makeEdges(geometry, 0xffffff);
    edges.scale.set(targetSize, targetSize, targetSize);
    if (xrSessionActive) edges.visible = false;
    scene.add(edges);
    edgesRef.current = edges;
  }, [geometryData, shape, size, opacity, wireframe, showConstraints, xrSessionActive]);

  // ── WebXR Select Listener ─────────────────────────────────────────────────
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const onSelect = () => {
      if (isDraggingRef.current) { isDraggingRef.current = false; return; }
      const reticle = reticleRef.current;
      const obj     = customGroupRef.current || meshRef.current;
      const edges   = customGroupRef.current ? null : edgesRef.current;
      if (reticle && reticle.visible && obj) {
        if (obj.visible && arAnchoredRef.current) return;
        obj.position.setFromMatrixPosition(reticle.matrix);
        obj.visible = true;
        const camPos = new THREE.Vector3();
        cameraRef.current.getWorldPosition(camPos);
        camPos.y = obj.position.y;
        obj.lookAt(camPos);
        if (edges) { edges.visible = true; edges.position.copy(obj.position); edges.rotation.copy(obj.rotation); }
        if (reticle.material) {
          const old = reticle.material.color.getHex();
          reticle.material.color.setHex(0x10ffa0);
          setTimeout(() => { if (reticle.material) reticle.material.color.setHex(old); }, 300);
        }
      }
    };

    const sessionStartListener = () => {
      const session = renderer.xr.getSession();
      if (session) session.addEventListener("select", onSelect);
    };
    renderer.xr.addEventListener("sessionstart", sessionStartListener);

    return () => {
      renderer.xr.removeEventListener("sessionstart", sessionStartListener);
      const session = renderer.xr.getSession();
      if (session) session.removeEventListener("select", onSelect);
    };
  }, [geometryData, shape]);

  // ── Animation Loop (60 FPS) ───────────────────────────────────────────────
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const animate = () => {
      const obj   = customGroupRef.current || meshRef.current;
      const edges = customGroupRef.current ? null : edgesRef.current;

      // WebXR Hit Test
      if (xrSessionActive) {
        const frame         = renderer.xr.getFrame();
        const hitTestSource = xrHitTestSourceRef.current;
        const refSpace      = renderer.xr.getReferenceSpace();
        if (frame && hitTestSource && refSpace) {
          const hits = frame.getHitTestResults(hitTestSource);
          if (hits.length > 0) {
            const pose = hits[0].getPose(refSpace);
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

      // Auto rotate khi không có tay
      if (obj && autoRotate && !handActiveRef.current && !xrSessionActive) {
        obj.rotation.x += 0.005;
        obj.rotation.y += 0.008;
        if (edges) { edges.rotation.x += 0.005; edges.rotation.y += 0.008; }
      }

      // Momentum xoay (open palm)
      const rv = rotVelocityRef.current;
      if (obj && (Math.abs(rv.x) > 0.0001 || Math.abs(rv.y) > 0.0001)) {
        obj.rotation.x += rv.x;
        obj.rotation.y += rv.y;
        if (edges) { edges.rotation.x += rv.x; edges.rotation.y += rv.y; }
        rv.x *= ROT_DAMPING; if (Math.abs(rv.x) < 0.0001) rv.x = 0;
        rv.y *= ROT_DAMPING; if (Math.abs(rv.y) < 0.0001) rv.y = 0;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    renderer.setAnimationLoop(animate);
    return () => { renderer.setAnimationLoop(null); };
  }, [autoRotate, xrSessionActive]);

  // ── Hand Tracking Callback ────────────────────────────────────────────────
  useHandTracking(videoRef, cameraActive && !xrSessionActive, (results) => {
    const landmarks = results.multiHandLandmarks;

    // Không có tay: reset toàn bộ trạng thái gesture
    if (!landmarks || landmarks.length === 0) {
      if (handActiveRef.current) {
        handActiveRef.current = false;
        setHandDetected(false);
        prevWristRef.current = null;
        prevPinchRef.current = null;
        prevDistRef.current  = null;
        rotVelocityRef.current = { x: 0, y: 0 };
      }
      return;
    }

    // Có tay
    if (!handActiveRef.current) {
      handActiveRef.current = true;
      setHandDetected(true);
    }

    const getTarget = () => customGroupRef.current || meshRef.current;
    const numHands  = landmarks.length;

    // ════════════════════════════════════════════════
    // 1 TAY: Pinch → Kéo di chuyển | Open Palm → Xoay
    // ════════════════════════════════════════════════
    if (numHands === 1) {
      // Reset trạng thái 2-tay
      prevDistRef.current = null;

      const hand   = landmarks[0];
      const wrist  = hand[0];
      const pinch  = isPinching(hand);
      const target = getTarget();

      if (pinch && target) {
        // ── Kéo di chuyển ──
        prevWristRef.current = null; // Reset palm tracking
        if (prevPinchRef.current !== null) {
          const dx =  wrist.x - prevPinchRef.current.x;
          const dy = -wrist.y + prevPinchRef.current.y;
          target.position.x += dx * MOVE_SCALE;
          target.position.y += dy * MOVE_SCALE;
          const edges = customGroupRef.current ? null : edgesRef.current;
          if (edges) edges.position.copy(target.position);
        }
        prevPinchRef.current = { x: wrist.x, y: wrist.y };

      } else {
        prevPinchRef.current = null; // Reset pinch tracking

        // ── Xoay bằng lòng bàn tay ──
        const openPalm = isOpenPalm(hand);
        if (openPalm && target) {
          if (prevWristRef.current !== null) {
            const dx = wrist.x - prevWristRef.current.x;
            const dy = wrist.y - prevWristRef.current.y;
            if (Math.abs(dx) > ROT_DEADZONE || Math.abs(dy) > ROT_DEADZONE) {
              rotVelocityRef.current.y += dx * ROT_SENSITIVITY;
              rotVelocityRef.current.x += dy * ROT_SENSITIVITY;
              rotVelocityRef.current.y  = Math.max(-0.15, Math.min(0.15, rotVelocityRef.current.y));
              rotVelocityRef.current.x  = Math.max(-0.15, Math.min(0.15, rotVelocityRef.current.x));
            }
          }
          prevWristRef.current = { x: wrist.x, y: wrist.y };
        } else {
          prevWristRef.current = null;
        }
      }
    }

    // ════════════════════════════════════════════════
    // 2 TAY: Cả 2 Pinch → Phóng to / Thu nhỏ
    // ════════════════════════════════════════════════
    if (numHands === 2) {
      // Reset trạng thái 1-tay
      prevPinchRef.current = null;
      prevWristRef.current = null;

      const hand1 = landmarks[0];
      const hand2 = landmarks[1];
      const p1    = isPinching(hand1);
      const p2    = isPinching(hand2);
      const target = getTarget();

      if (p1 && p2 && target) {
        // Dùng khoảng cách giữa 2 ngón trỏ (index tip = landmark 8)
        const tip1 = hand1[8];
        const tip2 = hand2[8];
        const dist = getDistance(tip1, tip2);

        if (prevDistRef.current !== null) {
          const delta = dist - prevDistRef.current;
          if (Math.abs(delta) > SCALE_DEADZONE) {
            const newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX,
              target.scale.x + delta * SCALE_SCALE));
            target.scale.setScalar(newScale);
            const edges = customGroupRef.current ? null : edgesRef.current;
            if (edges) edges.scale.copy(target.scale);
          }
        }
        prevDistRef.current = dist;
      } else {
        // Một trong 2 tay nhả pinch → khóa tỷ lệ hiện tại
        prevDistRef.current = null;
      }
    }
  });

  // ── Toggle Camera ─────────────────────────────────────────────────────────
  const toggleCamera = async () => {
    try {
      if (cameraActive) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
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
      setError(err.name === "NotAllowedError"
        ? "Bạn cần cấp quyền camera"
        : "Không thể truy cập camera: " + err.message);
      setCameraActive(false);
    }
  };

  // ── Toggle WebXR ──────────────────────────────────────────────────────────
  const toggleXR = async () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (renderer.xr.isPresenting) {
      const session = renderer.xr.getSession();
      if (session) await session.end();
      return;
    }

    try {
      setError(null);
      if (cameraActive) await toggleCamera();

      if (!canvasRef.current || !canvasRef.current.parentElement)
        throw new Error("Không tìm thấy canvas wrapper element.");

      const session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["local", "local-floor", "dom-overlay"],
        domOverlay: { root: canvasRef.current.parentElement },
      });

      await renderer.xr.setSession(session);

      const viewerSpace   = await session.requestReferenceSpace("viewer");
      const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
      xrHitTestSourceRef.current = hitTestSource;

      const refSpace = await session.requestReferenceSpace("local");
      xrRefSpaceRef.current = refSpace;

      session.addEventListener("end", () => {
        xrHitTestSourceRef.current = null;
        xrRefSpaceRef.current      = null;
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
