import * as THREE from "three";

export function makeGeo(geoType) {
  switch (geoType) {
    case "box":
      return new THREE.BoxGeometry(1.4, 1.4, 1.4);
    case "sphere":
      return new THREE.SphereGeometry(0.9, 32, 32);
    case "cylinder":
      return new THREE.CylinderGeometry(0.7, 0.7, 1.4, 32);
    case "cone":
      return new THREE.ConeGeometry(0.8, 15, 32);
    case "pyramid":
      return new THREE.ConeGeometry(1.0, 1.5, 4);
    case "torus":
      return new THREE.TorusGeometry(0.7, 0.28, 16, 60);
    case "prism":
      return new THREE.CylinderGeometry(0.9, 0.9, 1.4, 3);
    case "octa":
      return new THREE.OctahedronGeometry(1.0);
    default:
      return new THREE.BoxGeometry(1.4, 1.4, 1.4);
  }
}

export function makeMaterial(color, wireframe = false, opacity = 1) {
  return new THREE.MeshPhongMaterial({
    color,
    wireframe,
    transparent: opacity < 1,
    opacity,
    shininess: 80,
  });
}

export function makeEdges(geometry, color) {
  const edges = new THREE.EdgesGeometry(geometry);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.4,
  });
  return new THREE.LineSegments(edges, mat);
}
