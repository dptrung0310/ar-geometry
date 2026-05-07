import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeGeo, makeMaterial, makeEdges } from "../utils/geometry";

export default function useThreeViewer(containerRef, shape, options = {}) {
  const {
    wireframe = false,
    autoRotate = true,
    size = 1.0,
    opacity = 1.0,
  } = options;

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const edgesRef = useRef(null);
  const rafRef = useRef(null);
  const isDragRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const rotRef = useRef({ x: 0.3, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const { clientWidth: w, clientHeight: h } = container;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 4);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 5, 5);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0x8888ff, 0.3);
    dir2.position.set(-5, -3, -5);
    scene.add(dir2);

    // Grid helper
    const grid = new THREE.GridHelper(8, 20, 0x1e2a4a, 0x1e2a4a);
    grid.position.y = -1.5;
    scene.add(grid);

    return () => {
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !shape) return;

    // Xóa mesh cũ
    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      meshRef.current.material.dispose();
    }
    if (edgesRef.current) {
      scene.remove(edgesRef.current);
      edgesRef.current.geometry.dispose();
      edgesRef.current.material.dispose();
    }

    // Tạo mesh mới
    const geo = makeGeo(shape.geo);
    const mat = makeMaterial(shape.color, wireframe, opacity);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.setScalar(size);
    scene.add(mesh);
    meshRef.current = mesh;

    // Edges overlay
    const edges = makeEdges(geo, shape.color);
    edges.scale.setScalar(size);
    scene.add(edges);
    edgesRef.current = edges;

    // Reset rotation
    rotRef.current = { x: 0.3, y: 0 };
    mesh.rotation.set(0.3, 0, 0);
    edges.rotation.set(0.3, 0, 0);
  }, [shape]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.material.wireframe = wireframe;
    mesh.material.transparent = opacity < 1;
    mesh.material.opacity = opacity;
    mesh.material.needsUpdate = true;
  }, [wireframe, opacity]);

  useEffect(() => {
    const mesh = meshRef.current;
    const edges = edgesRef.current;
    if (!mesh) return;
    mesh.scale.setScalar(size);
    if (edges) edges.scale.setScalar(size);
  }, [size]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    let autoRotateRef = autoRotate;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      const mesh = meshRef.current;
      const edges = edgesRef.current;

      if (mesh && autoRotateRef && !isDragRef.current) {
        rotRef.current.y += 0.008;
        mesh.rotation.y = rotRef.current.y;
        mesh.rotation.x = rotRef.current.x;
        if (edges) {
          edges.rotation.y = rotRef.current.y;
          edges.rotation.x = rotRef.current.x;
        }
      }
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      autoRotateRef = autoRotate;
      cancelAnimationFrame(rafRef.current);
    };
  }, [autoRotate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseDown = (e) => {
      isDragRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e) => {
      if (!isDragRef.current) return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };

      rotRef.current.y += dx * 0.01;
      rotRef.current.x += dy * 0.01;

      const mesh = meshRef.current;
      const edges = edgesRef.current;
      if (mesh) {
        mesh.rotation.y = rotRef.current.y;
        mesh.rotation.x = rotRef.current.x;
      }
      if (edges) {
        edges.rotation.y = rotRef.current.y;
        edges.rotation.x = rotRef.current.x;
      }
    };
    const onMouseUp = () => {
      isDragRef.current = false;
    };

    // Touch support
    const onTouchStart = (e) => {
      isDragRef.current = true;
      prevMouseRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };
    const onTouchMove = (e) => {
      if (!isDragRef.current) return;
      const dx = e.touches[0].clientX - prevMouseRef.current.x;
      const dy = e.touches[0].clientY - prevMouseRef.current.y;
      prevMouseRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      rotRef.current.y += dx * 0.01;
      rotRef.current.x += dy * 0.01;
      const mesh = meshRef.current;
      const edges = edgesRef.current;
      if (mesh) {
        mesh.rotation.y = rotRef.current.y;
        mesh.rotation.x = rotRef.current.x;
      }
      if (edges) {
        edges.rotation.y = rotRef.current.y;
        edges.rotation.x = rotRef.current.x;
      }
    };
    const onTouchEnd = () => {
      isDragRef.current = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!container || !renderer || !camera) return;

    const observer = new ResizeObserver(() => {
      const { clientWidth: w, clientHeight: h } = container;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const resetCamera = () => {
    rotRef.current = { x: 0.3, y: 0 };
    const mesh = meshRef.current;
    const edges = edgesRef.current;
    if (mesh) {
      mesh.rotation.set(0.3, 0, 0);
    }
    if (edges) {
      edges.rotation.set(0.3, 0, 0);
    }
  };

  const takeScreenshot = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.render(sceneRef.current, cameraRef.current);
    const url = renderer.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${shape?.id || "shape"}.png`;
    link.click();
  };

  return { resetCamera, takeScreenshot };
}
