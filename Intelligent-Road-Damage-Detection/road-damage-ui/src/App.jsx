import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GovHeader from "./components/GovHeader";
import NavBar from "./components/NavBar";
import GovFooter from "./components/GovFooter";
import HomePage from "./pages/HomePage";
import DetectPage from "./pages/DetectPage";
import ReportPage from "./pages/ReportPage";
import AboutPage from "./pages/AboutPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import CitizenTracking from "./pages/CitizenTracking";
import "./index.css";

export default function App() {
  const [lang, setLang] = useState("en");
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [screenReader, setScreenReader] = useState(false);

  // Simple auth guard for admin
  const ProtectedAdmin = ({ children }) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return <AdminLogin />;
    return children;
  };

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app-wrapper">
        <GovHeader
          lang={lang} setLang={setLang}
          highContrast={highContrast} setHighContrast={setHighContrast}
          fontSize={fontSize} setFontSize={setFontSize}
          screenReader={screenReader} setScreenReader={setScreenReader}
        />
        <NavBar lang={lang} />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<HomePage lang={lang} />} />
            <Route path="/detect" element={<DetectPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/track" element={<CitizenTracking />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
          </Routes>
        </div>
        <GovFooter />
      </div>
    </BrowserRouter>
  );
}
