import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { translations } from "../components/GovHeader";

function AnimatedCounter({ target, suffix }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 25);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

const priorityData = [
  { level: "CRITICAL", color: "#c0392b", bg: "#fdecea", border: "#f1948a", icon: "🚨", en: "Emergency Response Required", hi: "आपातकालीन प्रतिक्रिया आवश्यक" },
  { level: "HIGH",     color: "#e67e22", bg: "#fef5ec", border: "#fad7a0", icon: "⚠️", en: "Immediate Maintenance Needed", hi: "तत्काल रखरखाव आवश्यक" },
  { level: "MEDIUM",   color: "#f39c12", bg: "#fefae6", border: "#f9e79f", icon: "🔧", en: "Schedule Repair Soon", hi: "जल्द मरम्मत शेड्यूल करें" },
  { level: "LOW",      color: "#27ae60", bg: "#eafaf1", border: "#a9dfbf", icon: "👁️", en: "Monitor Regularly", hi: "नियमित निगरानी करें" },
];

export default function HomePage({ lang }) {
  const t = translations[lang];
  const stats = [
    { label: t.stat1, value: 12847, suffix: "+" },
    { label: t.stat2, value: 3421,  suffix: "km" },
    { label: t.stat3, value: 28,    suffix: "" },
    { label: t.stat4, value: 94210, suffix: "+" },
  ];
  const steps = [
    { icon: "📸", title: t.step1_t, desc: t.step1_d },
    { icon: "🤖", title: t.step2_t, desc: t.step2_d },
    { icon: "📊", title: t.step3_t, desc: t.step3_d },
    { icon: "📧", title: t.step4_t, desc: t.step4_d },
  ];

  return (
    <main id="main-content">

      {/* Hero */}
      <section className="hero-section" aria-label="Hero">
        <div className="hero-content">
          <div className="hero-badge">{t.hero_badge}</div>
          <h1 className="hero-title">
            {t.hero_title_line1}<br/>
            <span className="hero-highlight">{t.hero_title_line2}</span>
          </h1>
          <p className="hero-subtitle">{t.hero_sub}</p>
          <div className="hero-buttons">
            <Link to="/detect" className="btn-primary-hero">{t.btn_report}</Link>
            <Link to="/report" className="btn-secondary-hero">{t.btn_track}</Link>
          </div>
          <div className="hero-tags">
            <span>{t.tag1}</span><span>{t.tag2}</span><span>{t.tag3}</span><span>{t.tag4}</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-bar" aria-label="Project statistics">
        {stats.map((s, i) => (
          <div className="stat-item" key={i}>
            <div className="stat-value"><AnimatedCounter target={s.value} suffix={s.suffix}/></div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Notice */}
      <section className="notice-section" aria-label="Announcements">
        <div className="notice-inner">
          <div className="notice-label">📢 {lang === "hi" ? "सूचना" : "Updates"}</div>
          <div className="notice-scroll"><span>{t.notice}</span></div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section how-it-works" aria-labelledby="how-title">
        <div className="section-inner">
          <div className="section-badge">{lang === "hi" ? "प्रक्रिया" : "Process"}</div>
          <h2 className="section-title" id="how-title">{t.how_title}</h2>
          <p className="section-subtitle">{t.how_sub}</p>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div className="step-card" key={i}>
                <div className="step-number">0{i+1}</div>
                <div className="step-icon">{s.icon}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Priority System */}
      <section className="section priority-section" aria-labelledby="pri-title">
        <div className="section-inner">
          <div className="section-badge">{lang === "hi" ? "बुद्धिमत्ता" : "Intelligence"}</div>
          <h2 className="section-title" id="pri-title">{t.pri_title}</h2>
          <p className="section-subtitle">{t.pri_sub}</p>
          <div className="priority-grid">
            {priorityData.map((p, i) => (
              <div className="priority-card" key={i} style={{borderColor:p.border, background:p.bg}}>
                <div className="priority-icon">{p.icon}</div>
                <div className="priority-badge-label" style={{color:p.color,borderColor:p.color}}>{p.level}</div>
                <div className="priority-desc">{lang === "hi" ? p.hi : p.en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" aria-labelledby="cta-title">
        <div className="cta-inner">
          <h2 className="cta-title" id="cta-title">{t.cta_title}</h2>
          <p className="cta-desc">{t.cta_sub}</p>
          <Link to="/detect" className="btn-primary-hero" style={{fontSize:"1.1rem",padding:"1rem 2.5rem"}}>{t.cta_btn}</Link>
        </div>
      </section>

    </main>
  );
}
