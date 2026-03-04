import { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8000";
const PRIORITY_CONFIG = {
  LOW:      { color: "#27ae60", bg: "#eafaf1", icon: "👁️" },
  MEDIUM:   { color: "#f39c12", bg: "#fefae6", icon: "🔧" },
  HIGH:     { color: "#e67e22", bg: "#fef5ec", icon: "⚠️" },
  CRITICAL: { color: "#c0392b", bg: "#fdecea", icon: "🚨" },
};

export default function ReportPage() {
  const [reportId, setReportId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const handleSearch = async () => {
    if (!reportId.trim()) { setError("Please enter a Report ID."); return; }
    setLoading(true); setError(""); setReport(null); setEmailSent(false);
    try {
      const res = await axios.get(`${API_BASE}/report/${reportId.trim()}`);
      setReport(res.data);
    } catch {
      setError("Report not found. Please check the Report ID and try again.");
    } finally { setLoading(false); }
  };

  const handleSendEmail = async () => {
    setEmailLoading(true);
    try {
      await axios.post(`${API_BASE}/send-email/${report.report_id}`);
      setEmailSent(true);
    } catch {
      alert("Failed to send email. Please check email configuration in main.py.");
    } finally { setEmailLoading(false); }
  };

  const pCfg = report ? (PRIORITY_CONFIG[report.priority_level] || PRIORITY_CONFIG["LOW"]) : null;

  return (
    <main id="main-content" className="page-wrapper">
      <div className="page-header">
        <div className="breadcrumb">🏠 Home › Track Report</div>
        <h1 className="page-title">Track Your Report</h1>
        <p className="page-subtitle">Enter your Report ID to view the complete damage assessment and current status</p>
      </div>

      <div className="report-search-box">
        <div className="search-card">
          <div className="search-icon-big">🔍</div>
          <h2 className="search-title">Enter Report ID</h2>
          <p className="search-sub">Your Report ID was provided after submission (format: RD-YYYY-XXXXX)</p>
          <div className="search-input-row">
            <input type="text" className="search-input" placeholder="e.g. RD-2026-12345"
              value={reportId} onChange={e => setReportId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleSearch()} />
            <button className="btn-search" onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
          {error && <div className="error-box" style={{marginTop:"1rem"}}>{error}</div>}
        </div>
      </div>

      {report && pCfg && (
        <div className="report-result-wrapper">
          <div className="status-timeline-card">
            <div className="stl-title">Report Status</div>
            <div className="status-timeline">
              {["Submitted","Under Review","Assigned","In Progress","Resolved"].map((step, i) => (
                <div className={`stl-step ${i === 0 ? "active" : ""}`} key={i}>
                  <div className={`stl-dot ${i === 0 ? "active-dot" : ""}`}></div>
                  <div className="stl-label">{step}</div>
                  {i < 4 && <div className="stl-line"></div>}
                </div>
              ))}
            </div>
            <div className="stl-status-badge">Status: <strong>OPEN</strong> — Awaiting Assignment</div>
          </div>

          <div className="full-report-card">
            <div className="frc-header" style={{background: pCfg.color}}>
              <div className="frc-header-left">
                <div className="frc-report-id">{report.report_id}</div>
                <div className="frc-date">Generated: {report.generated_at}</div>
              </div>
              <div className="frc-priority-badge">{pCfg.icon} {report.priority_level} PRIORITY</div>
            </div>
            <div className="frc-body">
              <div className="frc-section">
                <div class="frc-section-title">👤 Citizen Information</div>
                <div className="frc-info-grid">
                  <div className="frc-info-item"><span className="frc-info-label">Name</span><span className="frc-info-value">{report.citizen_name || "—"}</span></div>
                  <div className="frc-info-item"><span className="frc-info-label">Email</span><span className="frc-info-value">{report.citizen_email || "Not provided"}</span></div>
                  <div className="frc-info-item frc-full"><span className="frc-info-label">Location</span><span className="frc-info-value">{report.location || "—"}</span></div>
                </div>
              </div>
              <div className="frc-section">
                <div className="frc-section-title">🤖 AI Detection Summary</div>
                <div className="frc-info-grid">
                  <div className="frc-info-item"><span className="frc-info-label">Potholes</span><span className="frc-info-value big">{report.detected_potholes}</span></div>
                  <div className="frc-info-item"><span className="frc-info-label">Severity</span><span className="frc-info-value big">{report.highest_severity}</span></div>
                  <div className="frc-info-item"><span className="frc-info-label">Priority</span><span className="frc-info-value" style={{color:pCfg.color,fontWeight:700}}>{report.priority_level}</span></div>
                  <div className="frc-info-item"><span className="frc-info-label">Confidence</span><span className="frc-info-value">{(parseFloat(report.confidence_level)*100).toFixed(1)}%</span></div>
                  <div className="frc-info-item frc-full"><span className="frc-info-label">Recommended Action</span><span className="frc-info-value" style={{color:pCfg.color}}>{report.recommended_action}</span></div>
                </div>
              </div>
              <div className="frc-section">
                <div className="frc-section-title">📸 Detection Images</div>
                <div className="frc-images">
                  <div className="frc-image-box"><div className="frc-image-label">Original</div><img src={`${API_BASE}${report.original_image_url}`} alt="Original"/></div>
                  <div className="frc-image-box"><div className="frc-image-label">AI Processed</div><img src={`${API_BASE}${report.processed_image_url}`} alt="Processed"/></div>
                </div>
              </div>
              <div className="frc-actions">
                <button className="btn-print" onClick={() => window.print()}>🖨️ Print Report</button>
                {report.citizen_email && (
                  <button className="btn-email" onClick={handleSendEmail} disabled={emailLoading || emailSent}>
                    {emailSent ? "✅ Email Sent!" : emailLoading ? "Sending..." : "📧 Resend Email"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
