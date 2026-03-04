import React from 'react';
import { User, MapPin, Mail } from 'lucide-react';

const CitizenForm = ({ citizen, onChange }) => {
    return (
        <div className="animate-in" style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <User size={20} /> Step 2: Citizen Details
            </h3>
            <div className="input-group">
                <label><MapPin size={12} style={{ marginRight: '4px' }} /> Precise Location</label>
                <input
                    name="location"
                    value={citizen.location}
                    onChange={onChange}
                    placeholder="e.g. NH-44, near Sector 5 crossing"
                />
            </div>
            <div className="input-group">
                <label><User size={12} style={{ marginRight: '4px' }} /> Full Name</label>
                <input
                    name="name"
                    value={citizen.name}
                    onChange={onChange}
                    placeholder="Enter your name"
                />
            </div>
            <div className="input-group">
                <label><Mail size={12} style={{ marginRight: '4px' }} /> Email</label>
                <input
                    name="email"
                    value={citizen.email}
                    onChange={onChange}
                    placeholder="email@address.com"
                />
            </div>
        </div>
    );
};

export default CitizenForm;
