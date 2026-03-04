import { useEffect } from "react";

export const translations = {
  en: {
    projectTitle: "Intelligent Road Damage Detection and Prioritization",
    projectSub: "AI-Powered Road Infrastructure Assessment System",
    dept: "Computer Science & Engineering",
    nav_home: "Home", nav_detect: "Report Damage", nav_report: "Track Report", nav_about: "About",
    hero_badge: "🎓 Academic Capstone Project — VI Semester CSE",
    hero_title_line1: "Intelligent Road Damage",
    hero_title_line2: "Detection and Prioritization",
    hero_sub: "AI-powered real-time road damage detection and automated maintenance prioritization using YOLOv8 deep learning — making roads safer for everyone.",
    btn_report: "📸 Report Road Damage", btn_track: "🔍 Track Your Report",
    tag1: "✅ YOLOv8 AI Model", tag2: "✅ Real-time Detection", tag3: "✅ Auto Email Alerts", tag4: "✅ Free to Use",
    stat1: "Reports Filed", stat2: "Roads Assessed", stat3: "States Covered", stat4: "Potholes Detected",
    notice: "🔴 System Live: IRDDP v2.0 now supports batch upload of up to 10 images per report | 🟠 New: Camera capture with GPS auto-location now available | 🟢 Demo: Try uploading a road image to see live AI detection results",
    how_title: "How It Works", how_sub: "Simple 4-step process to report road damage and help improve infrastructure",
    step1_t: "Upload or Capture Image", step1_d: "Take a live photo using your camera or upload an existing road image. GPS location is captured automatically.",
    step2_t: "AI Detection", step2_d: "YOLOv8 model analyzes the image in real-time, detecting potholes and road damage with bounding box precision.",
    step3_t: "Priority Assessment", step3_d: "The system calculates severity score and assigns maintenance priority from LOW to CRITICAL automatically.",
    step4_t: "Report Generated", step4_d: "A unique Report ID is created, confirmation email sent, and a detailed report is available for download.",
    pri_title: "Automated Priority System", pri_sub: "Our AI doesn't just detect — it intelligently prioritizes repairs based on damage severity",
    cta_title: "Report a Road Damage Near You", cta_sub: "Every report helps prioritize road maintenance. Upload a photo and generate an official damage report in seconds.",
    cta_btn: "🚀 Start Reporting Now",
    capstone: "Capstone 2026", semester: "VI Semester CSE",
  },
  ta: {
    projectTitle: "சாலைப் பழுதுகளைக் கண்டறிந்து முன்னுரிமைப்படுத்தும் நுண்ணறிவு அமைப்பு",
    projectSub: "AI-மூலம் இயங்கும் சாலைக் கட்டமைப்பு மதிப்பீட்டு முறைமை",
    dept: "கணினி அறிவியல் மற்றும் பொறியியல் துறை",
    nav_home: "முகப்பு", 
    nav_detect: "பழுதுகளைப் புகாரளி", 
    nav_report: "புகாரைக் கண்காணி", 
    nav_about: "திட்டம் பற்றி",
    hero_badge: "🎓 கல்விசார் ஆய்வுத் திட்டம் (Capstone) — ஆறாம் பருவம் (VI Sem)",
    hero_title_line1: "சாலைப் பழுதுகளைக் கண்டறிந்து",
    hero_title_line2: "முன்னுரிமைப்படுத்தும் நுண்ணறிவு முறை",
    hero_sub: "YOLOv8 ஆழ் கற்றல் (Deep Learning) தொழில்நுட்பத்தைப் பயன்படுத்தி, சாலைச் சேதங்களை உடனுக்குடன் கண்டறிந்து, பராமரிப்புப் பணிகளைத் தானாகவே வரிசைப்படுத்தும் AI அமைப்பு.",
    btn_report: "📸 சாலைப் பழுதைப் புகாரளிக்கவும்", 
    btn_track: "🔍 உங்கள் புகாரைத் தேடுக",
    tag1: "✅ YOLOv8 AI மாதிரி", 
    tag2: "✅ உடனுக்குடன் கண்டறிதல்", 
    tag3: "✅ தானியங்கி மின்னஞ்சல் தகவல்", 
    tag4: "✅ இலவச சேவை",
    stat1: "பதிவு செய்யப்பட்ட புகார்கள்", 
    stat2: "ஆய்வு செய்யப்பட்ட சாலைகள்", 
    stat3: "உள்ளடக்கிய மாநிலங்கள்", 
    stat4: "கண்டறியப்பட்ட குழிகள்",
    notice: "🔴 சிஸ்டம் நேரலை: IRDDP v2.0 இப்போது ஒரே நேரத்தில் 10 படங்கள் வரை பதிவேற்றுவதை ஆதரிக்கிறது | 🟠 புதியது: GPS இருப்பிடத்துடன் கூடிய கேமரா வசதி | 🟢 டெமோ: AI-இன் செயல்பாட்டைப் பார்க்க ஒரு படத்தைப் பதிவேற்றவும்",
    how_title: "செயல்படும் முறை", 
    how_sub: "சாலைப் பழுதுகளைப் புகாரளித்து கட்டமைப்பை மேம்படுத்த 4 எளிய நிலைகள்",
    step1_t: "படத்தைப் பதிவேற்றவும்", 
    step1_d: "நேரடியாகப் படம் எடுக்கவும் அல்லது பதிவேற்றவும். உங்கள் GPS இருப்பிடம் தானாகவே எடுத்துக்கொள்ளப்படும்.",
    step2_t: "AI பகுப்பாய்வு", 
    step2_d: "YOLOv8 தொழில்நுட்பம் அந்தப் படத்தை ஆய்வு செய்து, குழிகள் மற்றும் சேதங்களைத் துல்லியமாகக் கண்டறியும்.",
    step3_t: "முன்னுரிமை மதிப்பீடு", 
    step3_d: "சேதத்தின் தீவிரத்தைப் பொறுத்து, பராமரிப்புப் பணிக்கான முன்னுரிமை (குறைந்த பட்சம் முதல் மிக அவசரம் வரை) தானாகவே கணக்கிடப்படும்.",
    step4_t: "அறிக்கை உருவாக்கம்", 
    step4_d: "தனித்துவமான புகார் எண் உருவாக்கப்பட்டு, விரிவான அறிக்கை மின்னஞ்சல் மூலம் உங்களுக்கு அனுப்பப்படும்.",
    pri_title: "தானியங்கி முன்னுரிமை முறைமை", 
    pri_sub: "எங்கள் AI வெறும் சேதத்தைக் கண்டறிவதுடன் நிற்காமல், அதன் தீவிரத்தைப் பொறுத்து பழுதுபார்க்கும் பணிகளை வரிசைப்படுத்துகிறது.",
    cta_title: "உங்கள் அருகில் உள்ள சாலைப் பழுதுகளைப் புகாரளியுங்கள்", 
    cta_sub: "ஒவ்வொரு புகாரும் பாதுகாப்பான பயணத்தை உறுதி செய்ய உதவும். நொடிகளில் அதிகாரப்பூர்வ அறிக்கையைப் பெற்றிடுங்கள்.",
    cta_btn: "🚀 இப்போது புகாரளிக்கத் தொடங்குங்கள்",
    capstone: "கேப்ஸ்டோன் 2026", 
    semester: "ஆறாம் பருவம் (CSE)",
  },
  hi: {
    projectTitle: "बुद्धिमान सड़क क्षति पहचान और प्राथमिकता",
    projectSub: "AI-संचालित सड़क अवसंरचना मूल्यांकन प्रणाली",
    dept: "कंप्यूटर विज्ञान और इंजीनियरिंग",
    nav_home: "होम", nav_detect: "क्षति रिपोर्ट", nav_report: "रिपोर्ट ट्रैक", nav_about: "परियोजना",
    hero_badge: "🎓 शैक्षणिक परियोजना — VI सेमेस्टर",
    hero_title_line1: "बुद्धिमान सड़क क्षति",
    hero_title_line2: "पहचान और प्राथमिकता",
    hero_sub: "YOLOv8 डीप लर्निंग का उपयोग करके AI-संचालित रीयल-टाइम सड़क क्षति का पता लगाना और रखरखाव प्राथमिकता।",
    btn_report: "📸 सड़क क्षति रिपोर्ट करें", btn_track: "🔍 रिपोर्ट ट्रैक करें",
    tag1: "✅ YOLOv8 AI मॉडल", tag2: "✅ रीयल-टाइम पहचान", tag3: "✅ ईमेल अलर्ट", tag4: "✅ निःशुल्क",
    stat1: "रिपोर्ट दर्ज", stat2: "सड़क मूल्यांकन", stat3: "राज्य शामिल", stat4: "गड्ढे पहचाने",
    notice: "🔴 सिस्टम लाइव: IRDDP v2.0 अब 10 छवियों तक बैच अपलोड का समर्थन करता है | 🟠 नया: GPS ऑटो-लोकेशन के साथ कैमरा कैप्चर | 🟢 डेमो: लाइव AI पहचान परिणाम देखें",
    how_title: "यह कैसे काम करता है", how_sub: "सड़क क्षति की रिपोर्ट करने के लिए सरल 4-चरण प्रक्रिया",
    step1_t: "छवि अपलोड या कैप्चर", step1_d: "कैमरे से लाइव फोटो लें या मौजूदा छवि अपलोड करें। GPS स्थान स्वचालित रूप से कैप्चर होता है।",
    step2_t: "AI पहचान", step2_d: "YOLOv8 मॉडल रीयल-टाइम में छवि का विश्लेषण करता है और सड़क क्षति का पता लगाता है।",
    step3_t: "प्राथमिकता आकलन", step3_d: "सिस्टम गंभीरता स्कोर की गणना करता है और LOW से CRITICAL तक रखरखाव प्राथमिकता असाइन करता है।",
    step4_t: "रिपोर्ट तैयार", step4_d: "एक अनूठी रिपोर्ट ID बनाई जाती है और विस्तृत रिपोर्ट डाउनलोड के लिए उपलब्ध होती है।",
    pri_title: "स्वचालित प्राथमिकता प्रणाली", pri_sub: "हमारा AI केवल पहचान नहीं करता — यह क्षति की गंभीरता के आधार पर मरम्मत को बुद्धिमानी से प्राथमिकता देता है",
    cta_title: "अपने पास सड़क क्षति रिपोर्ट करें", cta_sub: "प्रत्येक रिपोर्ट सड़क रखरखाव को प्राथमिकता देने में मदद करती है।",
    cta_btn: "🚀 अभी रिपोर्टिंग शुरू करें",
    capstone: "कैपस्टोन 2026", semester: "VI सेमेस्टर",
  }
};

export default function GovHeader({ lang, setLang, highContrast, setHighContrast, fontSize, setFontSize, screenReader, setScreenReader }) {

  useEffect(() => {
    document.documentElement.style.fontSize = fontSize + "px";
  }, [fontSize]);

  useEffect(() => {
    document.body.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);

  useEffect(() => {
    let srEl = document.getElementById("sr-announcer");
    if (!srEl) {
      srEl = document.createElement("div");
      srEl.id = "sr-announcer";
      srEl.setAttribute("aria-live", "polite");
      srEl.setAttribute("aria-atomic", "true");
      srEl.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;";
      document.body.appendChild(srEl);
    }
    if (screenReader) {
      document.body.setAttribute("data-sr", "true");
      srEl.textContent = "Screen reader mode enabled. " + translations[lang].projectTitle;
    } else {
      document.body.removeAttribute("data-sr");
    }
  }, [screenReader, lang]);

  const announce = (msg) => {
    const el = document.getElementById("sr-announcer");
    if (el) { el.textContent = ""; setTimeout(() => { el.textContent = msg; }, 50); }
  };

  const t = translations[lang];

  return (
    <>
      {/* Accessibility Bar */}
      <div className="accessibility-bar" role="navigation" aria-label="Accessibility controls">
        <div className="acc-left">
          <button
            className={`acc-sr-btn ${screenReader ? "acc-active" : ""}`}
            onClick={() => { setScreenReader(v => !v); announce(screenReader ? "Screen reader off" : "Screen reader on"); }}
            aria-pressed={screenReader}
            title="Toggle screen reader announcements"
          >
            {screenReader ? "🔊 Screen Reader: ON" : "🔇 Screen Reader Access"}
          </button>
        </div>
        <div className="acc-right">
          <span className="acc-label">Text Size:</span>
          <button onClick={() => { setFontSize(14); announce("Small text size"); }} className={`acc-font-btn ${fontSize === 14 ? "acc-active" : ""}`} aria-label="Small text size" title="Small">A-</button>
          <button onClick={() => { setFontSize(16); announce("Normal text size"); }} className={`acc-font-btn ${fontSize === 16 ? "acc-active" : ""}`} aria-label="Normal text size" title="Normal">A</button>
          <button onClick={() => { setFontSize(19); announce("Large text size"); }} className={`acc-font-btn ${fontSize === 19 ? "acc-active" : ""}`} aria-label="Large text size" title="Large">A+</button>
          <span className="acc-divider">|</span>
          <button
            onClick={() => { setHighContrast(v => !v); announce(highContrast ? "Normal contrast" : "High contrast on"); }}
            className={`acc-contrast-btn ${highContrast ? "acc-active" : ""}`}
            aria-pressed={highContrast}
            title="Toggle high contrast"
          >
            {highContrast ? "☀️ Normal" : "🌙 High Contrast"}
          </button>
          <span className="acc-divider">|</span>
          <button onClick={() => { setLang("hi"); announce("हिन्दी भाषा चुनी गई"); }} className={`acc-lang-btn ${lang === "hi" ? "acc-active" : ""}`} aria-label="Switch to Hindi" lang="hi">हिन्दी</button>
          <span className="acc-divider">|</span>
          <button onClick={() => { setLang("ta"); announce("தமிழ் மொழி தேர்ந்தெடுக்கப்பட்டது"); }} className={`acc-lang-btn ${lang === "ta" ? "acc-active" : ""}`} aria-label="Switch to Tamil" lang="ta">தமிழ்</button>
          <span className="acc-divider">|</span>
          <button onClick={() => { setLang("en"); announce("English selected"); }} className={`acc-lang-btn ${lang === "en" ? "acc-active" : ""}`} aria-label="Switch to English">English</button>
        </div>
      </div>

      {/* Main Header */}
      <header className="gov-header" role="banner">
        <div className="gov-header-inner">
          <div className="emblem-section">
            <div className="emblem" aria-hidden="true">
              <svg viewBox="0 0 80 80" width="70" height="70">
                <circle cx="40" cy="40" r="38" fill="#FF6600" opacity="0.12"/>
                <circle cx="40" cy="40" r="34" fill="none" stroke="#FF6600" strokeWidth="1.5"/>
                <circle cx="40" cy="40" r="18" fill="none" stroke="#aac4e8" strokeWidth="1.5"/>
                <circle cx="40" cy="40" r="3" fill="#aac4e8"/>
                {[...Array(24)].map((_, i) => {
                  const a = (i * 15 * Math.PI) / 180;
                  return <line key={i} x1={40+5*Math.cos(a)} y1={40+5*Math.sin(a)} x2={40+16*Math.cos(a)} y2={40+16*Math.sin(a)} stroke="#aac4e8" strokeWidth="0.8"/>;
                })}
                <text x="40" y="33" textAnchor="middle" fontSize="14">🛣️</text>
                <text x="40" y="65" textAnchor="middle" fontSize="5.5" fill="#aac4e8" fontFamily="monospace">IRDDP</text>
              </svg>
            </div>
            <div className="ministry-text">
              <div className="gov-of-india">{t.dept}</div>
              <div className="ministry-name">{t.projectTitle}</div>
              <div className="dept-name">{t.projectSub}</div>
            </div>
          </div>
          <div className="header-right">
            <div className="helpline-box">
              <div className="helpline-label">Project</div>
              <div className="helpline-number" style={{fontSize:"1rem",letterSpacing:"0"}}>{t.capstone}</div>
              <div className="helpline-sub">{t.semester}</div>
            </div>
            <div className="header-flags" aria-hidden="true">
              <div className="flag-stripe orange"></div>
              <div className="flag-stripe white"><div className="chakra-small">☸</div></div>
              <div className="flag-stripe green"></div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
