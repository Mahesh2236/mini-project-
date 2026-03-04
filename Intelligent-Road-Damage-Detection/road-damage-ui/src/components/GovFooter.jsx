export default function GovFooter() {
  return (
    <footer className="gov-footer" role="contentinfo">
      <div className="footer-top">
        <div className="footer-col">
          <div className="footer-logo-row">
            <div className="footer-emblem">🛣️</div>
            <div>
              <div className="footer-ministry">Intelligent Road Damage Detection and Prioritization</div>
              <div className="footer-gov">VI Semester Capstone Project — CSE</div>
            </div>
          </div>
          <p className="footer-desc">An AI-powered system that uses YOLOv8 deep learning to detect road damage from images and automatically assigns maintenance priority — helping authorities make faster, data-driven repair decisions.</p>
        </div>
        <div className="footer-col">
          <div className="footer-heading">Quick Links</div>
          <ul className="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="/detect">Report Road Damage</a></li>
            <li><a href="/report">Track Your Report</a></li>
            <li><a href="/about">About the Project</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <div className="footer-heading">Technology</div>
          <ul className="footer-links">
            <li><a href="https://ultralytics.com" target="_blank" rel="noreferrer">Ultralytics YOLOv8</a></li>
            <li><a href="https://fastapi.tiangolo.com" target="_blank" rel="noreferrer">FastAPI Backend</a></li>
            <li><a href="https://react.dev" target="_blank" rel="noreferrer">React + Vite Frontend</a></li>
            <li><a href="https://pytorch.org" target="_blank" rel="noreferrer">PyTorch</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <div className="footer-heading">Project Team</div>
          <div className="footer-contact-item">👨‍💻 727823TUCS101 — Hari Kesavan M</div>
          <div className="footer-contact-item">👨‍💻 727823TUCS145 — Mahesh P</div>
          <div className="footer-contact-item">👨‍💻 727823TUCS146 — Mahmood Sakeen N</div>
          <div className="footer-contact-item" style={{marginTop:"0.75rem"}}>📧 harikesavan360@gmail.com</div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span>© 2026 Intelligent Road Damage Detection and Prioritization — Capstone Project. All Rights Reserved.</span>
          <div className="footer-bottom-links">
            <a href="/about">About</a>
            <a href="/detect">Report Damage</a>
            <a href="/report">Track Report</a>
          </div>
        </div>
        <div className="footer-nic">
          Built with YOLOv8 + FastAPI + React &nbsp;|&nbsp; Base Paper: POT-YOLO, IEEE Sensors Journal 2024 &nbsp;|&nbsp; Academic Project — Not for commercial use
        </div>
      </div>
    </footer>
  );
}
