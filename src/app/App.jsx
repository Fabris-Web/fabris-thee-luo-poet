import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import AppRoutes from "./routes";
import { ToastProvider } from "../context/ToastProvider";

export default function App() {
  return (
    <ToastProvider>
      <Header />
      <main>
        <AppRoutes />
      </main>
      <Footer />
    </ToastProvider>
  );
}
