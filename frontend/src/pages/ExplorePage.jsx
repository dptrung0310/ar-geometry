import ThreeViewer from "../components/three/ThreeViewer";
import InfoPanel from "../components/ui/InfoPanel";
import SectionHeader from "../components/ui/SectionHeader";

export default function ExplorePage() {
  return (
    <div style={styles.page}>
      <SectionHeader
        eyebrow="khám phá 3D"
        title="Trình xem hình học 3D"
        desc="Kéo để xoay · Chọn hình từ danh sách · Tùy chỉnh hiển thị theo ý muốn"
      />
      <div style={styles.layout} className="explore-layout">
        <div style={styles.viewerCol}>
          <ThreeViewer />
        </div>
        <div style={styles.infoCol}>
          <InfoPanel />
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: "1400px", margin: "0 auto", padding: "40px 24px 60px" },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: "20px",
    height: "calc(100vh - 220px)",
    minHeight: "500px",
  },
  viewerCol: { minHeight: 0 },
  infoCol: { minHeight: 0, overflowY: "auto" },
};
