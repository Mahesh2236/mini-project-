import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPage from '../pages/UploadPage';
import ReportPage from '../pages/ReportPage';
import { Shield, Globe2 } from 'lucide-react';

const AppRouter = () => {
    return (
        <Router>
            <div className="app-root">
                {/* Global Print Styles inside AppRouter for easy sharing */}
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        #printable-content, #printable-content * { visibility: visible; }
                        #printable-content {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            border: none !important;
                            box-shadow: none !important;
                            padding: 1.5cm !important;
                            background: white !important;
                        }
                        .no-print { display: none !important; }
                        .print-only { display: block !important; }
                    }
                    .report-monospaced {
                        font-family: 'Courier New', Courier, monospace;
                        line-height: 1.6;
                        font-weight: 600;
                    }
                    .input-group {
                        margin-bottom: 1rem;
                    }
                    .input-group label {
                        display: block;
                        font-size: 0.75rem;
                        font-weight: 700;
                        color: #64748b;
                        margin-bottom: 0.25rem;
                        text-transform: uppercase;
                    }
                    .input-group input {
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid #e2e8f0;
                        border-radius: 0.5rem;
                        font-size: 0.875rem;
                        outline: none;
                        transition: border-color 0.2s;
                    }
                    .input-group input:focus {
                        border-color: var(--primary);
                    }
                `}</style>

                {/* Top Bar Shared Globally */}
                <div className="top-bar py-1 px-6 no-print">
                    <div className="container flex justify-between items-center">
                        <div className="flex gap-4">
                            <span className="font-medium">भारत सरकार | GOVERNMENT OF INDIA</span>
                        </div>
                        <div className="flex gap-4 hidden-mobile">
                            <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--primary)' }}><Globe2 size={12} /> HINDI</span>
                        </div>
                    </div>
                </div>

                {/* Header Shared Globally */}
                <header className="px-6 py-4 no-print">
                    <div className="container flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Shield className="w-10 h-10" style={{ color: 'var(--primary)' }} />
                            <div>
                                <h1 className="text-xl font-bold uppercase" style={{ color: 'var(--primary)', letterSpacing: '-0.025em', lineHeight: '1.2' }}>National Road Infrastructure Portal</h1>
                                <p className="text-xs text-slate" style={{ color: 'var(--text-slate)' }}>Ministry of Road Transport and Highways</p>
                            </div>
                        </div>
                    </div>
                </header>

                <Routes>
                    <Route path="/" element={<UploadPage />} />
                    <Route path="/report" element={<ReportPage />} />
                </Routes>

                {/* Footer Shared Globally */}
                <footer className="py-12 px-6 no-print">
                    <div className="container text-center">
                        <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>National Information Center (NIC) | Ministry of Road Transport and Highways</p>
                    </div>
                </footer>
            </div>
        </Router>
    );
};

export default AppRouter;
