import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000";
const WS_BASE_URL = "ws://localhost:8000";

export default function CitizenTracking() {
  const [reportId, setReportId] = useState("");
  const [email, setEmail] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    const emailParam = params.get("email");
    if (idParam && emailParam) {
      setReportId(idParam);
      setEmail(emailParam);
      autoTrack(idParam, emailParam);
    }
  }, []);

  const autoTrack = async (rid, mail) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/track/${rid.trim().toUpperCase()}`, {
        params: { email: mail.trim() }
      });
      setReport(response.data);
      setupWebSocket(response.data.report_id);
    } catch (err) {
      setError("Auto-tracking failed. Please enter details manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setReport(null);
    
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/track/${reportId.trim().toUpperCase()}`, {
        params: { email: email.trim() }
      });
      setReport(response.data);
      setupWebSocket(response.data.report_id);
    } catch (err) {
      setError(err.response?.data?.detail || "Report not found. Please double-check the ID and Email.");
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = (rid) => {
    const ws = new WebSocket(`${WS_BASE_URL}/ws/track/${rid}`);
    
    ws.onopen = () => {
      console.log("[WS] Connected for", rid);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("[WS] Status Update received:", data);
      // Update local report state with new data from admin
      setReport(prev => ({
        ...prev,
        status: data.status,
        admin_note: data.admin_note,
        updated_at: data.updated_at
      }));
    };

    ws.onclose = () => {
      console.log("[WS] Disconnected");
      setIsConnected(false);
    };

    socketRef.current = ws;
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  const getStatusStep = (status) => {
    const steps = ["Pending", "Under Review", "Repair Scheduled", "Resolved"];
    return steps.indexOf(status);
  };

  return (
    <div className="tracking-container">
      <div className="hero-blur pink"></div>
      <div className="hero-blur blue"></div>

      <div className="tracking-card glass-morphism">
        {!report ? (
          <div className="tracking-search">
            <h2>Track Your Report</h2>
            <p>Enter your details to see the live status of your road damage report.</p>
            
            <form onSubmit={handleTrack} className="tracking-form">
              {error && <div className="tracking-error">⚠️ {error}</div>}
              
              <div className="form-group">
                <label>Report ID</label>
                <input 
                  type="text" 
                  placeholder="e.g. RD-2026-XXXX" 
                  value={reportId}
                  onChange={(e) => setReportId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Registered Email</label>
                <input 
                  type="email" 
                  placeholder="your@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-track" disabled={loading}>
                {loading ? "Searching..." : "Track Status"}
              </button>
            </form>
          </div>
        ) : (
          <div className="tracking-result">
            <div className="result-header">
              <button className="btn-back" onClick={() => setReport(null)}>← New Search</button>
              <div className="live-indicator">
                <span className={`pulse ${isConnected ? "online" : "offline"}`}></span>
                {isConnected ? "Live Tracking Active" : "Offline"}
              </div>
            </div>

            <div className="status-hero">
              <span className="report-id-tag">{report.report_id}</span>
              <h2 style={{fontSize:"1.4rem", color:"#003366", marginBottom:"0.5rem"}}>{report.title}</h2>
              <h1>{report.status}</h1>
              <p className="location-text">📍 {report.location?.address || (typeof report.location === 'string' ? report.location : "") || "N/A"}</p>
              {report.location?.latitude && (
                <div style={{marginTop:"0.5rem", fontSize:"0.85rem", color:"#666"}}>
                  GPS: {report.location.latitude.toFixed(6)}, {report.location.longitude.toFixed(6)} 
                  <a href={`https://www.openstreetmap.org/?mlat=${report.location.latitude}&mlon=${report.location.longitude}#map=17/${report.location.latitude}/${report.location.longitude}`} target="_blank" rel="noreferrer" style={{marginLeft:"8px", color:"#003366", textDecoration:"underline"}}>View on Map</a>
                </div>
              )}
            </div>

            <div className="tracking-timeline">
              {["Reported", "Reviewed", "Scheduled", "Resolved"].map((step, idx) => {
                const currentStep = getStatusStep(report.status);
                let state = "pending";
                if (idx < currentStep) state = "completed";
                if (idx === currentStep) state = "active";
                if (report.status === "Resolved") state = "completed";

                return (
                  <div className={`timeline-step ${state}`} key={step}>
                    <div className="step-circle">{idx + 1}</div>
                    <div className="step-label">{step}</div>
                  </div>
                );
              })}
            </div>

            <div className="update-box">
              <h3>Latest Update</h3>
              <div className="update-content">
                <div className="update-time">
                  📅 {report.updated_at ? new Date(report.updated_at).toLocaleString() : new Date(report.created_at).toLocaleString()}
                </div>
                <p className="update-note">
                  {report.admin_note || "Your report has been received and is currently in the queue for authority review."}
                </p>
              </div>
            </div>

            <div className="report-summary-mini">
              <div className="summary-item">
                <span>Potholes Detected:</span>
                <strong>{report.total_potholes}</strong>
              </div>
              <div className="summary-item">
                <span>AI Priority:</span>
                <strong className={`prio-${report.overall_priority}`}>{report.overall_priority}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .tracking-container {
          min-height: calc(100vh - 200px);
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tracking-card {
          width: 100%;
          max-width: 600px;
          padding: 3rem;
          border-radius: 20px;
          z-index: 10;
        }

        .tracking-search h2 {
          font-size: 2rem;
          color: #003366;
          margin-bottom: 0.5rem;
        }

        .tracking-search p {
          color: #666;
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 700;
          color: #333;
        }

        .form-group input {
          width: 100%;
          padding: 1rem;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 10px;
          background: rgba(255,255,255,0.8);
          font-size: 1.1rem;
        }

        .btn-track {
          width: 100%;
          padding: 1.1rem;
          background: #003366;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 1rem;
        }

        .tracking-error {
          background: #fee2e2;
          color: #b91c1c;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .btn-back {
          background: none;
          border: none;
          color: #003366;
          font-weight: 700;
          cursor: pointer;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: #666;
        }

        .pulse {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .pulse.online { background: #138808; box-shadow: 0 0 8px #138808; }
        .pulse.offline { background: #999; }

        .status-hero {
          text-align: center;
          margin-bottom: 3rem;
        }

        .report-id-tag {
          background: rgba(0,51,102,0.1);
          color: #003366;
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 700;
          display: inline-block;
          margin-bottom: 1rem;
        }

        .status-hero h1 {
          font-size: 3rem;
          color: #003366;
          margin-bottom: 0.5rem;
        }

        .location-text {
          font-size: 1.1rem;
          color: #666;
        }

        .tracking-timeline {
          display: flex;
          justify-content: space-between;
          position: relative;
          margin-bottom: 3rem;
        }

        .tracking-timeline::before {
          content: '';
          position: absolute;
          top: 15px;
          left: 0;
          right: 0;
          height: 2px;
          background: #ddd;
          z-index: 1;
        }

        .timeline-step {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 80px;
        }

        .step-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #999;
          margin-bottom: 0.5rem;
        }

        .step-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #999;
          text-align: center;
        }

        .timeline-step.active .step-circle {
          background: #003366;
          border-color: #003366;
          color: #fff;
        }

        .timeline-step.active .step-label { color: #003366; }

        .timeline-step.completed .step-circle {
          background: #138808;
          border-color: #138808;
          color: #fff;
        }

        .timeline-step.completed .step-label { color: #138808; }

        .update-box {
          background: rgba(255,255,255,0.5);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.05);
          margin-bottom: 2rem;
        }

        .update-box h3 {
          font-size: 1rem;
          color: #003366;
          margin-bottom: 1rem;
        }

        .update-time {
          font-size: 0.8rem;
          color: #888;
          margin-bottom: 0.5rem;
        }

        .update-note {
          color: #333;
          line-height: 1.5;
        }

        .report-summary-mini {
          display: flex;
          justify-content: space-around;
          background: rgba(0,51,102,0.05);
          padding: 1rem;
          border-radius: 12px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .summary-item span { font-size: 0.75rem; color: #666; }
        .summary-item strong { font-size: 1.1rem; color: #003366; }
        .prio-CRITICAL { color: #b91c1c !important; }
        .prio-HIGH { color: #ea580c !important; }

        @media (max-width: 500px) {
          .tracking-timeline { flex-wrap: wrap; gap: 1rem; }
          .tracking-timeline::before { display: none; }
          .timeline-step { width: 45%; }
        }
      `}</style>
    </div>
  );
}
