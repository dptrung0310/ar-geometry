import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { makeGeo, makeMaterial, makeEdges } from "../utils/geometry";
import { buildCustomGeometry } from "../utils/buildCustomGeometry";

import { useHandTracking } from "./useHandTracking";
import { getDistance } from "../utils/gestures";
import { isPinching, isOpenPalm } from "../utils/gestureDetection";

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
  const animationIdRef = useRef(null);

  // ── Delta-based gesture refs ───────────────────────────────────────────────
  // Tất cả 3 gesture đều dùng delta + velocity + momentum damping
  // giống cơ chế kéo/xoay trong các 3D editor chuyên nghiệp.

  // ROTATION (Open Palm)
  const prevWristRef = useRef(null);
  const rotVelocityRef = useRef({ x: 0, y: 0 });

  // MOVE (Pinch 1 tay)
  const prevPinchWristRef = useRef(null);
  const posVelocityRef = useRef({ x: 0, y: 0 });

  // SCALE (Pinch 2 tay)
  const twoHandDistanceRef = useRef(null);
  const scaleVelocityRef = useRef(0);

  // ─ Tùy chỉnh độ nhạy & quán tính (Tuned) ──────────────────────────────────
  const ROT_SENSITIVITY  = 2.5;   // Giảm mạnh độ nhạy (từ 6.0 xuống 2.5)
  const ROT_DAMPING      = 0.75;  // Dừng nhanh hơn (từ 0.82)
  const ROT_DEADZONE     = 0.005; // Lọc rung tay

  const MOVE_SENSITIVITY = 2.0;   // Giảm độ nhạy di chuyển (từ 5.0 xuống 2.0)
  const MOVE_DAMPING     = 0.75;  // Dừng nhanh hơn (từ 0.80)
  const MOVE_DEADZONE    = 0.005; // Lọc rung tay

  const SCALE_SENSITIVITY = 3.0;  // Giảm nhạy phóng to/nhỏ (từ 8.0 xuống 3.0)
  const SCALE_DAMPING     = 0.70; // Dừng nhanh hơn (từ 0.78)
  const SCALE_DEADZONE    = 0.005;
  const SCALE_MIN         = 0.3;
  const SCALE_MAX         = 6.0;

  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [handDetected, setHandDetected] = useState(false);

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
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xff00ff, 0.5);
    pointLight.position.set(-5, -5, 5);
    scene.add(pointLight);

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
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // ── Xoá objects cũ khỏi scene ─────────────────────────────
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
        scaleFactor: size,
        showPoints: true,
        showConstraints: showConstraints,
      });
      scene.add(group);
      customGroupRef.current = group;
      return;
    }

    // ── PRESET MODE ─────────────────
    if (!shape) return;

    const geometry = makeGeo(shape.geo);
    const material = makeMaterial(shape.color, wireframe, opacity);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(size, size, size);
    scene.add(mesh);
    meshRef.current = mesh;

    const edges = makeEdges(geometry, 0xffffff);
    edges.scale.set(size, size, size);
    scene.add(edges);
    edgesRef.current = edges;
  }, [geometryData, shape, size, opacity, wireframe, showConstraints]);

  useEffect(() => {
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const obj = customGroupRef.current || meshRef.current;
      const edges = customGroupRef.current ? null : edgesRef.current;

      // ── Auto-rotate (khi không có tay) ────────────────────────────
      if (obj && autoRotate && !handDetected) {
        obj.rotation.x += 0.005;
        obj.rotation.y += 0.008;
        if (edges) { edges.rotation.x += 0.005; edges.rotation.y += 0.008; }
      }

      // ── Momentum: ROTATION ───────────────────────────────────────
      const rv = rotVelocityRef.current;
      if (obj && (Math.abs(rv.x) > 0.0001 || Math.abs(rv.y) > 0.0001)) {
        obj.rotation.x += rv.x;
        obj.rotation.y += rv.y;
        if (edges) { edges.rotation.x += rv.x; edges.rotation.y += rv.y; }
        rv.x *= ROT_DAMPING;  if (Math.abs(rv.x) < 0.0001) rv.x = 0;
        rv.y *= ROT_DAMPING;  if (Math.abs(rv.y) < 0.0001) rv.y = 0;
      }

      // ── Momentum: POSITION (Move) ──────────────────────────────
      const pv = posVelocityRef.current;
      if (obj && (Math.abs(pv.x) > 0.0001 || Math.abs(pv.y) > 0.0001)) {
        obj.position.x += pv.x;
        obj.position.y += pv.y;
        if (edges) { edges.position.x += pv.x; edges.position.y += pv.y; }
        pv.x *= MOVE_DAMPING;  if (Math.abs(pv.x) < 0.0001) pv.x = 0;
        pv.y *= MOVE_DAMPING;  if (Math.abs(pv.y) < 0.0001) pv.y = 0;
      }

      // ── Momentum: SCALE ─────────────────────────────────────────
      const sv = scaleVelocityRef;
      if (obj && Math.abs(sv.current) > 0.0001) {
        const newScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX,
          obj.scale.x + sv.current
        ));
        obj.scale.setScalar(newScale);
        if (edges) edges.scale.copy(obj.scale);
        sv.current *= SCALE_DAMPING;
        if (Math.abs(sv.current) < 0.0001) sv.current = 0;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    };
  }, [autoRotate, handDetected]);

  useHandTracking(videoRef, cameraActive, (results) => {
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

      // ── PINCH (1 tay) → DI CHUYỂN delta-based + momentum ──────────────
      if (pinch && target) {
        const curX = wrist.x;
        const curY = wrist.y;

        if (prevPinchWristRef.current !== null) {
          const dx =  curX - prevPinchWristRef.current.x;
          const dy = -curY + prevPinchWristRef.current.y; // flip Y (camera vs world)

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

      // ── OPEN PALM → XOAY delta-based + momentum ─────────────────────
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

      // ── PINCH 2 TAY → SCALE delta-based + momentum ───────────────────
      if (hand1Pinch && hand2Pinch && target) {
        // Dùng ngón trỏ (landmark 8) thay vì cổ tay — chính xác hơn cho pinch distance
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
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
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

  return {
    cameraActive,
    toggleCamera,
    error,
    videoRef,
    cameraRef,
    customGroupRef,
    meshRef,
  };
}
