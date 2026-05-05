import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const Placeholder = ({ name }) => (
  <div
    style={{
      padding: "100px 24px",
      color: "var(--cyan)",
      fontFamily: "Space Mono, monospace",
    }}
  >
    {name} - coming soon
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Placeholder name="Home" />} />
        <Route path="/learn" element={<Placeholder name="Learn" />} />
        <Route path="/explore" element={<Placeholder name="Explore" />} />
        <Route path="/ar" element={<Placeholder name="AR" />} />
        <Route path="/about" element={<Placeholder name="About" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
