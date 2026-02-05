import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import AppRoutes from "./routes";

export default function App() {
  return (
    <>
      <Header />
      <main>
        <AppRoutes />
      </main>
      <Footer />
    </>
  );
}
