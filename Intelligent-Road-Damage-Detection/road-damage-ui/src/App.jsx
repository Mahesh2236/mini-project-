import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GovHeader from "./components/GovHeader";
import NavBar from "./components/NavBar";
import GovFooter from "./components/GovFooter";
import HomePage from "./pages/HomePage";
import DetectPage from "./pages/DetectPage";
import ReportPage from "./pages/ReportPage";
import AboutPage from "./pages/AboutPage";
import "./index.css";

export default function App() {
  const [lang, setLang] = useState("en");
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [screenReader, setScreenReader] = useState(false);

  return (
    <BrowserRouter>
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
          </Routes>
        </div>
        <GovFooter />
      </div>
    </BrowserRouter>
  );
}
