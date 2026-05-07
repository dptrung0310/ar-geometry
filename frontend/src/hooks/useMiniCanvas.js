import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeGeo, makeMaterial } from "@/utils/geometry";

export default function useMiniCanvas(containerRef, shape) {
  const rafRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shape) return;

    // Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(3, 3, 3);
    scene.add(dir);

    // Mesh
    const geo = makeGeo(shape.geo);
    const mat = makeMaterial(shape.color);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = 0.4;
    scene.add(mesh);

    // Animate
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      mesh.rotation.y += 0.012;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [shape]);

  return null;
}
