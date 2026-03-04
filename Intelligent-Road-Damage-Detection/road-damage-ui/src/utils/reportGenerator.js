const PRIORITY_COLORS = {
  LOW:      { bg: "#eafaf1", border: "#27ae60", text: "#27ae60" },
  MEDIUM:   { bg: "#fefae6", border: "#f39c12", text: "#f39c12" },
  HIGH:     { bg: "#fef5ec", border: "#e67e22", text: "#e67e22" },
  CRITICAL: { bg: "#fdecea", border: "#c0392b", text: "#c0392b" },
  CLEAR:    { bg: "#eafaf1", border: "#27ae60", text: "#27ae60" },
};

export function generateReportHTML({ batchReport, imageResults, citizen, location }) {
  const pKey = batchReport?.overall_priority || "CLEAR";
  const pCfg = PRIORITY_COLORS[pKey] || PRIORITY_COLORS["CLEAR"];
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const API_BASE = "http://localhost:8000";

  const imageRowsHtml = imageResults.map((result, idx) => {
    const ir = result.image_report;
    const isClear = !ir;
    const iPKey = ir?.priority_level || "CLEAR";
    const iPCfg = PRIORITY_COLORS[iPKey] || PRIORITY_COLORS["CLEAR"];
    return `
    <div class="img-result">
      <div class="img-result-header" style="background:${iPCfg.border}">
        <span>Image ${idx+1} of ${imageResults.length}: ${result.filename}</span>
        <span class="img-priority-tag">${isClear ? "CLEAR ROAD" : ir.priority_level}</span>
      </div>
      <div class="img-result-body">
        <div class="img-pair">
          <div class="img-box"><div class="img-label">📷 Original</div>
            <img src="${API_BASE}${result.image_url}" alt="Original" onerror="this.style.display='none'"/></div>
          <div class="img-box"><div class="img-label">🤖 AI Detection</div>
            <img src="${API_BASE}${result.processed_image_url}" alt="Processed" onerror="this.style.display='none'"/></div>
        </div>
        ${ir ? `
        <div class="img-stats">
          <div class="istat"><div class="istat-label">Potholes</div><div class="istat-val">${ir.detected_potholes}</div></div>
          <div class="istat"><div class="istat-label">Severity</div><div class="istat-val">${ir.highest_severity}</div></div>
          <div class="istat"><div class="istat-label">Confidence</div><div class="istat-val">${(parseFloat(ir.confidence_level)*100).toFixed(1)}%</div></div>
          <div class="istat"><div class="istat-label">Priority</div><div class="istat-val" style="color:${iPCfg.text};font-weight:800">${ir.priority_level}</div></div>
          <div class="istat full"><div class="istat-label">Recommended Action</div><div class="istat-val" style="color:${iPCfg.text}">${ir.recommended_action}</div></div>
        </div>` : `
        <div class="clear-box">✅ No road damage detected in this image (confidence threshold: 60%)</div>`}
      </div>
    </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Road Damage Report — ${batchReport?.report_id}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Serif:wght@700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans',sans-serif;background:#f5f5f5;color:#1a1a2e}
.page{max-width:900px;margin:0 auto;background:white}
.report-header{background:#003366;color:white;padding:1.75rem 2rem;display:flex;align-items:center;gap:1.5rem}
.header-icon{font-size:2.5rem}
.header-title{font-size:1.25rem;font-weight:700;font-family:'Noto Serif',serif;line-height:1.3}
.header-sub{font-size:0.8rem;color:#aac4e8;margin-top:0.2rem}
.header-accent{height:4px;background:linear-gradient(90deg,#FF9933 33%,white 33%,white 66%,#138808 66%)}
.rid-banner{background:${pCfg.bg};border-left:6px solid ${pCfg.border};padding:1.25rem 2rem;display:flex;justify-content:space-between;align-items:center}
.rid-label{font-size:0.7rem;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.25rem}
.rid-value{font-size:1.5rem;font-weight:800;color:#003366;font-family:monospace;letter-spacing:2px}
.rid-date{font-size:0.75rem;color:#888;margin-top:0.2rem}
.rid-priority{background:${pCfg.border};color:white;padding:0.5rem 1.5rem;border-radius:30px;font-weight:800;font-size:0.85rem;letter-spacing:1.5px}
.body{padding:2rem}
.section{margin-bottom:2rem}
.sec-title{font-size:0.75rem;font-weight:700;color:#003366;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:0.9rem;padding-bottom:0.4rem;border-bottom:2px solid #FF6600;display:inline-block}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#eee;border:1px solid #eee;border-radius:8px;overflow:hidden}
.info-cell{background:white;padding:0.8rem 1rem}
.info-cell.full{grid-column:1/-1}
.info-label{font-size:0.67rem;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.2rem}
.info-value{font-size:0.9rem;font-weight:600;color:#1a1a2e}
.summary-box{background:${pCfg.bg};border:2px solid ${pCfg.border};border-radius:10px;padding:1.25rem 1.5rem;display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;text-align:center;margin-bottom:0.75rem}
.sbox-label{font-size:0.67rem;color:#666;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.3rem}
.sbox-val{font-size:1.4rem;font-weight:800;color:#003366}
.sbox-val.p{color:${pCfg.text}}
.action-box{background:#fef5ec;border:1px solid #fad7a0;border-radius:6px;padding:0.65rem 1rem;font-size:0.88rem;color:#e67e22;font-weight:600;margin-bottom:0.75rem}
.status-row{display:flex;gap:0.75rem;flex-wrap:wrap}
.sbadge{padding:0.35rem 0.9rem;border-radius:20px;font-size:0.78rem;font-weight:700;border:1px solid}
.img-result{border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;margin-bottom:1rem}
.img-result-header{color:white;padding:0.65rem 1rem;font-size:0.83rem;font-weight:600;display:flex;align-items:center;justify-content:space-between}
.img-priority-tag{background:rgba(255,255,255,0.25);padding:0.15rem 0.6rem;border-radius:10px;font-size:0.72rem;font-weight:700}
.img-result-body{padding:1rem}
.img-pair{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem}
.img-box{border:1px solid #ddd;border-radius:6px;overflow:hidden}
.img-label{background:#f0f2f5;padding:0.35rem 0.6rem;font-size:0.68rem;font-weight:600;color:#555;border-bottom:1px solid #ddd}
.img-box img{width:100%;height:160px;object-fit:cover;display:block}
.img-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem}
.istat{background:#f8f9fa;border-radius:5px;padding:0.55rem}
.istat.full{grid-column:1/-1}
.istat-label{font-size:0.63rem;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.2rem}
.istat-val{font-size:0.85rem;font-weight:700;color:#1a1a2e}
.clear-box{background:#eafaf1;border:1px solid #a9dfbf;border-radius:6px;padding:0.85rem;font-size:0.85rem;color:#27ae60;text-align:center;font-weight:600}
.report-footer{background:#f8f9fa;border-top:3px solid #003366;padding:1rem 2rem;display:flex;justify-content:space-between;font-size:0.72rem;color:#888}
.footer-project{font-weight:600;color:#003366}
.watermark{text-align:center;font-size:0.65rem;color:#ccc;padding:0.4rem}
@media print{
  body{background:white}
  .page{max-width:100%;box-shadow:none}
  @page{margin:1cm}
}
</style></head>
<body><div class="page">

<div class="report-header">
  <div class="header-icon">🛣️</div>
  <div>
    <div class="header-title">Intelligent Road Damage Detection and Prioritization</div>
    <div class="header-sub">Official Damage Assessment Report • ${now}</div>
  </div>
</div>
<div class="header-accent"></div>

<div class="rid-banner">
  <div>
    <div class="rid-label">Report ID</div>
    <div class="rid-value">${batchReport?.report_id}</div>
    <div class="rid-date">Generated: ${now} • ${imageResults.length} Image(s) Analyzed</div>
  </div>
  <div class="rid-priority">${pKey} PRIORITY</div>
</div>

<div class="body">

  <div class="section">
    <div class="sec-title">Citizen Information</div>
    <div class="info-grid">
      <div class="info-cell"><div class="info-label">Full Name</div><div class="info-value">${citizen?.name||"—"}</div></div>
      <div class="info-cell"><div class="info-label">Email</div><div class="info-value">${citizen?.email||"Not provided"}</div></div>
      <div class="info-cell"><div class="info-label">Phone</div><div class="info-value">${citizen?.phone||"—"}</div></div>
      <div class="info-cell"><div class="info-label">Date &amp; Time</div><div class="info-value">${now}</div></div>
      <div class="info-cell full"><div class="info-label">Damage Location</div><div class="info-value">${location||"—"}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="sec-title">Overall Assessment (${imageResults.length} Image${imageResults.length>1?"s":""})</div>
    ${batchReport?.has_detection ? `
    <div class="summary-box">
      <div><div class="sbox-label">Total Potholes</div><div class="sbox-val">${batchReport.total_potholes}</div></div>
      <div><div class="sbox-label">Worst Severity</div><div class="sbox-val">${batchReport.worst_severity}</div></div>
      <div><div class="sbox-label">Overall Priority</div><div class="sbox-val p">${batchReport.overall_priority}</div></div>
      <div><div class="sbox-label">Max Confidence</div><div class="sbox-val">${(parseFloat(batchReport.max_confidence)*100).toFixed(1)}%</div></div>
    </div>
    <div class="action-box">⚡ Recommended Action: ${batchReport.recommended_action}</div>
    ` : `<div class="clear-box" style="font-size:0.95rem;padding:1.25rem">✅ No road damage detected across all ${imageResults.length} submitted image(s). Road section appears to be in good condition.</div>`}
    <div class="status-row">
      <div class="sbadge" style="background:#fff3e0;border-color:#ffcc02;color:#e65100">Status: OPEN</div>
      ${citizen?.email
        ? `<div class="sbadge" style="background:#e8f5e9;border-color:#a5d6a7;color:#2e7d32">✅ Email sent to ${citizen.email}</div>`
        : `<div class="sbadge" style="background:#f5f5f5;border-color:#ddd;color:#888">No email provided</div>`}
    </div>
  </div>

  <div class="section">
    <div class="sec-title">Per-Image Detection Results</div>
    ${imageRowsHtml}
  </div>

</div>

<div class="report-footer">
  <div class="footer-project">Intelligent Road Damage Detection and Prioritization — Capstone 2026</div>
  <div>Report ID: ${batchReport?.report_id} • CSE VI Semester</div>
</div>
<div class="watermark">System-generated report • ${now} • Academic project — not for commercial use</div>

</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
}

export function printReportAsPDF({ batchReport, imageResults, citizen, location }) {
  const html = generateReportHTML({ batchReport, imageResults, citizen, location });
  const win = window.open("", "_blank", "width=1050,height=850");
  if (!win) {
    alert("Please allow popups in your browser to download the PDF report.");
    return;
  }
  win.document.write(html);
  win.document.close();
}
