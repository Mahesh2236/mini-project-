import React from 'react';

const ReportCard = ({ reportData, citizen, processedImageUrl, originalImageUrl }) => {
    if (!reportData) return null;

    return (
        <div style={{ background: '#fff', border: '1px solid #1e293b', padding: '2rem', boxShadow: 'var(--shadow)', pageBreakInside: 'avoid', marginBottom: '2rem' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 900, textTransform: 'uppercase' }}>Report ID: {reportData.report_id}</h4>
            </div>

            <div className="report-monospaced" style={{ fontSize: '13px' }}>
                <div>Detected Potholes: {reportData.detected_potholes}</div>
                <div>Highest Severity: {reportData.highest_severity}</div>
                <div>Priority Level: {reportData.priority_level}</div>
                <div style={{ marginTop: '0.75rem' }}>Recommended Action:</div>
                <div style={{ marginLeft: '1rem', fontWeight: 800 }}>- {reportData.recommended_action}</div>
                <div style={{ marginTop: '0.75rem' }}>Confidence Level: {reportData.confidence_level}</div>
                <div>Generated At: {reportData.generated_at}</div>
                <div style={{ marginTop: '0.75rem' }}>Location: {citizen?.location || "Not specified"}</div>
                <div>Submitted By: {citizen?.name || "Anonymous"}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', marginTop: '1.5rem' }} className="no-print">
                <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', color: '#64748b' }}>Original Image</p>
                    <img
                        src={`http://localhost:8000${originalImageUrl}`}
                        alt="Original"
                        style={{ width: '100%', borderRadius: '0.25rem' }}
                    />
                </div>
                <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', color: '#64748b' }}>Detected Damage</p>
                    <img
                        src={`http://localhost:8000${processedImageUrl}`}
                        alt="Detected"
                        style={{ width: '100%', borderRadius: '0.25rem' }}
                    />
                </div>
            </div>

            {/* For Print exclusively */}
            <div className="print-only" style={{ display: 'none' }}>
                <img src={`http://localhost:8000${processedImageUrl}`} alt="Detected Print" style={{ width: '100%', marginTop: '1rem' }} />
            </div>
        </div>
    );
};

export default ReportCard;
