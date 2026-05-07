import { useRef } from "react";
import useMiniCanvas from "../../hooks/useMiniCanvas";

export default function MiniCanvas({
  shape,
  width = "100%",
  height = "140px",
}) {
  const containerRef = useRef(null);
  useMiniCanvas(containerRef, shape);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        borderRadius: "8px",
        overflow: "hidden",
        cursor: "default",
        boxShadow: `0 0 20px ${hexColor(shape?.color)}22`,
      }}
    />
  );
}

function hexColor(num) {
  if (!num) return "#00e5ff";
  return "#" + num.toString(16).padStart(6, "0");
}
