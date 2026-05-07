export default function PageWrapper({ children }) {
  return (
    <div
      className="page-enter"
      style={{ paddingTop: "60px", minHeight: "100vh" }}
    >
      {children}
    </div>
  );
}
