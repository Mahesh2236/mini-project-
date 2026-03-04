import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import CitizenForm from '../components/CitizenForm';

const UploadPage = () => {
    const navigate = useNavigate();

    // State
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);

    const [citizen, setCitizen] = useState({
        name: '',
        email: '',
        location: ''
    });

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 0) {
            const validFiles = selectedFiles.slice(0, 10);
            setFiles(validFiles);
            setPreviews(validFiles.map(file => URL.createObjectURL(file)));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCitizen(prev => ({ ...prev, [name]: value }));
    };

    const detectDamage = async () => {
        if (files.length === 0) return;

        setLoading(true);
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        formData.append('citizen_name', citizen.name);
        formData.append('citizen_email', citizen.email);
        formData.append('location', citizen.location);

        try {
            const response = await fetch('http://localhost:8000/detect', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Assessment failed');

            const data = await response.json();

            // On successful operation, navigate to /report and pass the results object 
            navigate('/report', { state: { results: data.results, citizen } });
        } catch (error) {
            console.error('Error:', error);
            alert('Error during infrastructure assessment. Please ensure your backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Hero Section */}
            <section className="hero py-16 no-print">
                <div className="hero-overlay"></div>
                <div className="container hero-content px-6">
                    <h2 className="text-5xl font-extrabold mb-4" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>Infrastructure Complaint System</h2>
                    <p className="text-lg font-light mx-auto max-w-2xl mb-8" style={{ opacity: 0.9 }}>
                        Empowering citizens through AI-based damage assessment and automated official government correspondence.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <main className="container px-6 -mt-10 pb-20" style={{ position: 'relative', zIndex: 20 }}>
                <div className="main-card no-print">
                    <div className="flex gap-10" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <div className="flex-col gap-6" style={{ flex: '1 1 500px', maxWidth: '700px', display: 'flex' }}>

                            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                                <Camera size={24} /> Step 1: Surface Assessment
                            </h3>

                            <ImageUploader
                                previews={previews}
                                onFileChange={handleFileChange}
                            />

                            <CitizenForm
                                citizen={citizen}
                                onChange={handleInputChange}
                            />

                            <button
                                onClick={detectDamage}
                                disabled={files.length === 0 || loading}
                                className="btn-detect w-full"
                            >
                                {loading ? 'ANALYZING BATCH...' : 'RUN AI ASSESSMENT'}
                            </button>

                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default UploadPage;
