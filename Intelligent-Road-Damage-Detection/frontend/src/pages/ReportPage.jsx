import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Printer, Mail, AlertTriangle } from 'lucide-react';
import ReportCard from '../components/ReportCard';

const ReportPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // We get the results forwarded via React Router State
    const { results, citizen } = location.state || {};
    const [sendingEmails, setSendingEmails] = useState(false);

    if (!results) {
        return (
            <main className="container px-6 py-20 text-center flex flex-col justify-center items-center" style={{ minHeight: '60vh' }}>
                <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                <h2 className="text-2xl font-bold mb-4">No Assessment Found</h2>
                <p className="text-slate mb-8">It seems you have not run an AI assessment yet.</p>
                <button
                    onClick={() => navigate('/')}
                    className="btn-detect"
                >
                    RETURN TO UPLOAD PAGE
                </button>
            </main>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    const handleSendConfirmations = async () => {
        if (!window.confirm(`Are you sure you want to send confirmation emails for these reports back to ${citizen?.email || 'your email'}?`)) return;

        setSendingEmails(true);
        try {
            // Find valid reports 
            const validReports = results.filter(r => r.report !== null).map(r => r.report);

            for (const r of validReports) {
                // Post to backend to trigger email logic (currently simulated)
                await fetch(`http://localhost:8000/send-email/${r.report_id}`, {
                    method: 'POST'
                });
            }
            alert("Confirmation emails securely sent via backend simulator!");
        } catch (error) {
            console.error(error);
            alert("Failed to send some emails.");
        } finally {
            setSendingEmails(false);
        }
    };

    return (
        <main className="container px-6 py-10" style={{ position: 'relative', zIndex: 20 }}>
            <div className="flex gap-10" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div className="flex-col gap-6" style={{ flex: '1 1 800px', maxWidth: '1000px', display: 'flex' }}>

                    <div className="flex justify-between items-center no-print">
                        <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                            <FileText size={24} /> Official Output Report
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrint}
                                className="btn-detect flex items-center gap-2"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            >
                                <Printer size={16} /> PRINT OFFICIAL REPORT
                            </button>
                            <button
                                onClick={handleSendConfirmations}
                                disabled={sendingEmails}
                                className="btn-detect flex items-center gap-2"
                                style={{ background: 'var(--accent)', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            >
                                <Mail size={16} /> {sendingEmails ? "SENDING..." : "SEND CONFIRMATION EMAIL"}
                            </button>
                        </div>
                    </div>

                    <div className="animate-in flex flex-col gap-6" id="printable-content">
                        {results.map((res, index) => {
                            if (!res.report) {
                                return (
                                    <div key={index} style={{ background: '#fff', border: '1px solid #1e293b', padding: '2rem', textAlign: 'center' }}>
                                        <h4 style={{ fontSize: '1.125rem', fontWeight: 900 }}>File: {res.filename}</h4>
                                        <br />
                                        <p style={{ fontWeight: 700, color: '#ef4444' }}>No road damage detected.</p>
                                    </div>
                                );
                            }

                            // Pass down the URLs we got from backend
                            return (
                                <ReportCard
                                    key={index}
                                    reportData={res.report}
                                    citizen={citizen}
                                    originalImageUrl={res.image_url}
                                    processedImageUrl={res.processed_image_url}
                                />
                            );
                        })}
                    </div>

                </div>
            </div>
            <div className="flex justify-center mt-10 no-print">
                <button
                    onClick={() => navigate('/')}
                    style={{ padding: '0.5rem 1rem', background: '#f1f5f9', color: '#0f172a', fontWeight: 'bold', borderRadius: '0.5rem' }}
                >
                    &larr; Start New Assessment
                </button>
            </div>
        </main>
    );
};

export default ReportPage;
