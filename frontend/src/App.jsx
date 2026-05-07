import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import Navbar from "./components/layout/Navbar";
import PageWrapper from "./components/layout/PageWrapper";

const HomePage = lazy(() => import("./pages/HomePage"));
const LearnPage = lazy(() => import("./pages/LearnPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const ARPage = lazy(() => import("./pages/ARPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));

function PageLoader() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          border: "2px solid var(--border2)",
          borderTop: "2px solid var(--cyan)",
          borderRadius: "50%",
          animation: "spin .8s linear infinite",
        }}
      />
      <span
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "11px",
          color: "var(--text3)",
          letterSpacing: "2px",
        }}
      >
        loading...
      </span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <PageWrapper>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/ar" element={<ARPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </PageWrapper>
    </BrowserRouter>
  );
}
