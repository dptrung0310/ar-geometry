import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import Navbar from "./components/layout/Navbar";
import PageWrapper from "./components/layout/PageWrapper";

const HomePage = lazy(() => import("./pages/HomePages"));
const LearnPage = lazy(() => import("./pages/LearnPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const ARPage = lazy(() => import("./pages/ARPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));

function PageLoader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        color: "var(--text3)",
        fontFamily: "'Space Mono', monospace",
        fontSize: "13px",
        letterSpacing: "2px",
      }}
    >
      loading...
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
