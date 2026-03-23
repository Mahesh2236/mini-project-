import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, under_review: 0, resolved: 0 });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/stats`),
        axios.get(`${API_BASE_URL}/admin/reports`)
      ]);
      setStats(statsRes.data);
      setReports(reportsRes.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = (report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setAdminNote(report.admin_note || "");
  };

  const handleUpdateReport = async () => {
    setUpdateLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}/admin/reports/${selectedReport.report_id}`, {
        status: newStatus,
        admin_note: adminNote
      });
      // Refresh local data
      await fetchData();
      setSelectedReport(null);
    } catch (err) {
      alert("Failed to update report: " + (err.response?.data?.detail || err.message));
    } finally {
      setUpdateLoading(false);
    }
  };
  const handleDeleteReport = async (reportId) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE report ${reportId}? This action cannot be undone.`)) {
      return;
    }
    
    setDeleteLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/admin/reports/${reportId}`);
      await fetchData();
      if (selectedReport?.report_id === reportId) {
        setSelectedReport(null);
      }
    } catch (err) {
      alert("Failed to delete report: " + (err.response?.data?.detail || err.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <div className="admin-loading">Initializing Dashboard...</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Road Authority Command Center</h1>
        <div className="admin-user-info">
          <span>Welcome, {localStorage.getItem("adminName") || "Officer"}</span>
          <button className="btn-logout" onClick={() => { localStorage.clear(); window.location.href = "/admin/login"; }}>Logout</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-morphism">
          <span className="stat-icon">📋</span>
          <div className="stat-val">{stats.total}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card glass-morphism pending">
          <span className="stat-icon">⏳</span>
          <div className="stat-val">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card glass-morphism review">
          <span className="stat-icon">🔍</span>
          <div className="stat-val">{stats.under_review}</div>
          <div className="stat-label">Under Review</div>
        </div>
        <div className="stat-card glass-morphism resolved">
          <span className="stat-icon">✅</span>
          <div className="stat-val">{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card glass-morphism rejected">
          <span className="stat-icon">❌</span>
          <div className="stat-val">{stats.rejected || 0}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <div className="reports-section glass-morphism">
        <h2>Report Management</h2>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Citizen</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.report_id}>
                  <td><strong>{r.report_id}</strong></td>
                  <td>{r.citizen_name}</td>
                  <td>{r.location?.address || (typeof r.location === 'string' ? r.location : "") || "N/A"}</td>
                  <td>
                    <span className={`priority-badge ${r.overall_priority}`}>
                      {r.overall_priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${r.status.toLowerCase().replace(" ", "-")}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div style={{display:"flex", gap:"0.5rem"}}>
                      <button className="btn-view" onClick={() => handleOpenReport(r)}>View</button>
                      <button 
                        className="btn-reject" 
                        onClick={() => handleDeleteReport(r.report_id)}
                        disabled={deleteLoading}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReport && (
        <div className="modal-overlay">
          <div className="report-modal glass-morphism">
            <div className="modal-header">
              <h3>Report Detail: {selectedReport.report_id}</h3>
              <button className="btn-close" onClick={() => setSelectedReport(null)}>✕</button>
            </div>
            
            <div className="modal-content">
              <div className="detail-grid">
                <div className="detail-info">
                  <div className="info-item">
                    <label>Citizen:</label>
                    <p>{selectedReport.citizen_name} ({selectedReport.citizen_email})</p>
                  </div>
                  <div className="info-item">
                    <label>Location (Geocoded):</label>
                    <p>{selectedReport.location?.address || (typeof selectedReport.location === 'string' ? selectedReport.location : "") || selectedReport.address || "N/A"}</p>
                    {selectedReport.latitude && (
                      <div className="coords-detail" style={{fontSize:"0.75rem", color:"#666", marginTop:"4px"}}>
                        📍 Coordinates: {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
                        <a 
                          href={`https://www.openstreetmap.org/?mlat=${selectedReport.latitude}&mlon=${selectedReport.longitude}#map=17/${selectedReport.latitude}/${selectedReport.longitude}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{marginLeft:"8px", color:"#003366", textDecoration:"underline"}}
                        >
                          View on Map
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="info-item">
                    <label>AI Findings:</label>
                    <p>{selectedReport.total_potholes} pothole(s) detected. Worst severity: {selectedReport.worst_severity}</p>
                  </div>
                  
                  <div className="admin-actions">
                    <div className="form-group">
                      <label>Update Status</label>
                      <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Repair Scheduled">Repair Scheduled</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Admin Notes</label>
                      <textarea 
                        value={adminNote} 
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Add internal notes about repair status..."
                      />
                    </div>
                    <button className="btn-save" onClick={handleUpdateReport} disabled={updateLoading}>
                      {updateLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>

                <div className="detail-images">
                  <label>Analyzed Images:</label>
                  <div className="image-scroll">
                    {selectedReport.processed_image_paths.map((p, i) => (
                      <img key={i} src={`${API_BASE_URL}/${p}`} alt="Detection" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-dashboard {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .admin-header h1 {
          font-size: 1.8rem;
          color: #003366;
        }

        .admin-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .btn-logout {
          background: #c0392b;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          padding: 1.5rem;
          text-align: center;
          border-radius: 12px;
        }

        .stat-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .stat-val {
          font-size: 2rem;
          font-weight: 800;
          color: #003366;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .reports-section {
          padding: 2rem;
          border-radius: 12px;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }

        .admin-table th {
          text-align: left;
          padding: 1rem;
          border-bottom: 2px solid rgba(0,0,0,0.05);
          color: #666;
        }

        .admin-table td {
          padding: 1rem;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .priority-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .priority-badge.CRITICAL { background: #fee2e2; color: #991b1b; }
        .priority-badge.HIGH { background: #ffedd5; color: #9a3412; }
        .priority-badge.MEDIUM { background: #fef9c3; color: #854d0e; }
        .priority-badge.LOW { background: #dcfce7; color: #166534; }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .status-badge.pending { background: #f3f4f6; color: #374151; }
        .status-badge.under-review { background: #dbeafe; color: #1e40af; }
        .status-badge.repair-scheduled { background: #fef3c7; color: #92400e; }
        .status-badge.resolved { background: #dcfce7; color: #166534; }
        .status-badge.rejected { background: #fee2e2; color: #991b1b; }

        .btn-view {
          background: #003366;
          color: white;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          flex: 1;
        }

        .btn-reject {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
          padding: 0.4rem 0.6rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 800;
          transition: all 0.2s;
        }

        .btn-reject:hover {
          background: #fecaca;
        }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .report-modal {
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 12px;
          padding: 2rem;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-header h3 { color: #003366; }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .info-item {
          margin-bottom: 1rem;
        }

        .info-item label {
          font-weight: 700;
          color: #666;
          font-size: 0.8rem;
          display: block;
        }

        .image-scroll {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .image-scroll img {
          width: 100%;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .admin-actions {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 1.5rem;
        }

        .admin-actions select, .admin-actions textarea {
          width: 100%;
          padding: 0.5rem;
          margin-top: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .admin-actions textarea {
          height: 100px;
        }

        .btn-save {
          width: 100%;
          margin-top: 1rem;
          background: #138808;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 4px;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          font-weight: 700;
          color: #003366;
        }
      `}</style>
    </div>
  );
}
