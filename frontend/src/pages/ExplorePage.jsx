import ThreeViewer from "../components/three/ThreeViewer";

export default function ExplorePage() {
  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "700px",
        margin: "0 auto",
        height: "calc(100vh - 60px)",
      }}
    >
      <ThreeViewer />
    </div>
  );
}
