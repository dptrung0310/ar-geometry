export default function PageWrapper({ children }) {
  return (
    <div style={{ paddingTop: "60px", minHeight: "100vh" }}>{children}</div>
  );
}
