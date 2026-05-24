import Navbar from "./components/layout/Navbar";
import PageWrapper from "./components/layout/PageWrapper";
import ARPage from "./pages/ARPage";

export default function App() {
  return (
    <>
      <Navbar />
      <PageWrapper>
        <ARPage />
      </PageWrapper>
    </>
  );
}

