import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

const ImageUploader = ({ previews, onFileChange }) => {
    const fileInputRef = useRef(null);

    return (
        <div
            onClick={() => fileInputRef.current?.click()}
            className="drop-zone"
            style={{ minHeight: '200px', cursor: 'pointer' }}
        >
            <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={onFileChange}
                accept="image/*"
                multiple
            />
            {previews.length === 0 ? (
                <>
                    <Upload size={32} style={{ color: '#94a3b8', marginBottom: '0.5rem' }} />
                    <p className="font-semibold text-sm">Upload Road Damage Images (up to 10)</p>
                </>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                    {previews.map((preview, i) => (
                        <img
                            key={i}
                            src={preview}
                            alt={`Preview ${i}`}
                            style={{ height: '80px', borderRadius: '0.25rem', objectFit: 'cover' }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
