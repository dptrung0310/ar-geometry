import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { makeGeo, makeMaterial, makeEdges } from "../utils/geometry";

import { useHandTracking } from "./useHandTracking";

import { getDistance, smooth } from "../utils/gestures";

import { isPinching, isOpenPalm } from "../utils/gestureDetection";

export function useAR(
  canvasRef,
  shape,
  { size, opacity, wireframe, autoRotate },
) {
  const sceneRef = useRef(null);

  const cameraRef = useRef(null);

  const rendererRef = useRef(null);

  const meshRef = useRef(null);

  const edgesRef = useRef(null);

  const videoRef = useRef(null);

  const streamRef = useRef(null);

  const animationIdRef = useRef(null);

  const rotationRef = useRef({
    x: 0,
    y: 0,
  });

  const positionRef = useRef({
    x: 0,
    y: 0,
  });

  const twoHandDistanceRef = useRef(null);

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
    if (!sceneRef.current || !shape) return;

    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
    }

    if (edgesRef.current) {
      sceneRef.current.remove(edgesRef.current);
    }

    const geometry = makeGeo(shape.geo);

    const material = makeMaterial(shape.color, wireframe, opacity);

    const mesh = new THREE.Mesh(geometry, material);

    mesh.scale.set(size, size, size);

    sceneRef.current.add(mesh);

    meshRef.current = mesh;

    const edges = makeEdges(geometry, 0xffffff);

    edges.scale.set(size, size, size);

    sceneRef.current.add(edges);

    edgesRef.current = edges;
  }, [shape, size, opacity, wireframe]);

  useEffect(() => {
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (meshRef.current && autoRotate && !handDetected) {
        meshRef.current.rotation.x += 0.005;

        meshRef.current.rotation.y += 0.008;
      }

      if (edgesRef.current && autoRotate && !handDetected) {
        edgesRef.current.rotation.x += 0.005;

        edgesRef.current.rotation.y += 0.008;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [autoRotate, handDetected]);

  useHandTracking(videoRef, cameraActive, (results) => {
    if (!results.multiHandLandmarks?.length) {
      setHandDetected(false);

      return;
    }

    setHandDetected(true);

    if (results.multiHandLandmarks.length === 1) {
      const hand = results.multiHandLandmarks[0];

      const wrist = hand[0];

      const pinch = isPinching(hand);

      const openPalm = isOpenPalm(hand);

      if (pinch && meshRef.current) {
        const targetX = (wrist.x - 0.5) * 6;

        const targetY = -(wrist.y - 0.5) * 4;

        positionRef.current.x = smooth(positionRef.current.x, targetX, 0.2);

        positionRef.current.y = smooth(positionRef.current.y, targetY, 0.2);

        meshRef.current.position.x = positionRef.current.x;

        meshRef.current.position.y = positionRef.current.y;

        if (edgesRef.current) {
          edgesRef.current.position.copy(meshRef.current.position);
        }
      }

      if (openPalm && meshRef.current) {
        const targetRotY = wrist.x * Math.PI * 2;

        const targetRotX = wrist.y * Math.PI * 2;

        rotationRef.current.y = smooth(rotationRef.current.y, targetRotY, 0.15);

        rotationRef.current.x = smooth(rotationRef.current.x, targetRotX, 0.15);

        meshRef.current.rotation.y +=
          (rotationRef.current.y - meshRef.current.rotation.y) * 0.1;

        meshRef.current.rotation.x +=
          (rotationRef.current.x - meshRef.current.rotation.x) * 0.1;

        if (edgesRef.current) {
          edgesRef.current.rotation.copy(meshRef.current.rotation);
        }
      }
    }

    if (results.multiHandLandmarks.length === 2) {
      const hand1 = results.multiHandLandmarks[0];

      const hand2 = results.multiHandLandmarks[1];

      const hand1Pinch = isPinching(hand1);

      const hand2Pinch = isPinching(hand2);

      if (hand1Pinch && hand2Pinch && meshRef.current) {
        const center1 = hand1[0];

        const center2 = hand2[0];

        const handDistance = getDistance(center1, center2);

        if (twoHandDistanceRef.current !== null) {
          const delta = handDistance - twoHandDistanceRef.current;

          if (Math.abs(delta) > 0.002) {
            const scale = meshRef.current.scale.x + delta * 3;

            const clamped = Math.max(0.5, Math.min(5, scale));

            meshRef.current.scale.setScalar(clamped);

            if (edgesRef.current) {
              edgesRef.current.scale.copy(meshRef.current.scale);
            }
          }
        }

        twoHandDistanceRef.current = handDistance;
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
        video: {
          facingMode: "environment",

          width: {
            ideal: 1280,
          },

          height: {
            ideal: 720,
          },
        },

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
  };
}
