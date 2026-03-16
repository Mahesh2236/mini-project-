import React, { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon issue in React
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const defaultCenter = [11.0168, 76.9558]; // Coimbatore

// Component to handle map clicks and marker updates
function MapEvents({ onMapClick, markerPos }) {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (markerPos) {
      map.panTo(markerPos);
    }
  }, [markerPos, map]);

  return null;
}

const LocationPicker = ({ onLocationSelect }) => {
  const [marker, setMarker] = useState(null);
  const [address, setAddress] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  const getAddress = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
           headers: {
             'Accept-Language': 'en',
             'User-Agent': 'RoadDamageDetectionApp/1.0'
           }
        }
      );
      const data = await response.json();
      if (data && data.display_name) {
        const formattedAddress = data.display_name;
        setAddress(formattedAddress);
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: formattedAddress
        });
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
    }
  }, [onLocationSelect]);

  const handleLocationUpdate = useCallback((lat, lng) => {
    setMarker([lat, lng]);
    getAddress(lat, lng);
  }, [getAddress]);

  const onMapClick = useCallback((lat, lng) => {
    handleLocationUpdate(lat, lng);
  }, [handleLocationUpdate]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleLocationUpdate(latitude, longitude);
        setGpsLoading(false);
      },
      (error) => {
        console.error("Error detecting location:", error);
        alert("Unable to detect your location. Please check permissions or select manually on the map.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="location-picker-wrapper">
      <div className="picker-controls">
        <button 
          className="btn-gps" 
          onClick={(e) => { e.preventDefault(); useCurrentLocation(); }}
          disabled={gpsLoading}
        >
          {gpsLoading ? "⌛ Detecting..." : "📍 Use My Current Location"}
        </button>
      </div>

      <div style={{ height: "350px", width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)" }}>
        <MapContainer 
          center={marker || defaultCenter} 
          zoom={15} 
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {marker && <Marker position={marker} />}
          <MapEvents onMapClick={onMapClick} markerPos={marker} />
        </MapContainer>
      </div>
      
      {address && (
        <div className="selected-address-box">
          <div className="address-label">📍 Selected Location</div>
          <div className="address-text">{address}</div>
          <div className="coords-text">
            Lat: {marker?.[0].toFixed(6)} | Lng: {marker?.[1].toFixed(6)}
          </div>
        </div>
      )}

      <style>{`
        .location-picker-wrapper {
          margin-top: 1rem;
          width: 100%;
        }
        .picker-controls {
          margin-bottom: 0.75rem;
        }
        .btn-gps {
          background: #003366;
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-gps:hover { background: #002244; }
        .btn-gps:disabled { background: #ccc; cursor: not-allowed; }
        
        .selected-address-box {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(0, 51, 102, 0.05);
          border-radius: 8px;
          border-left: 4px solid #003366;
        }
        .address-label {
          font-weight: 700;
          font-size: 0.8rem;
          color: #003366;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }
        .address-text {
          font-size: 0.95rem;
          color: #333;
          line-height: 1.4;
        }
        .coords-text {
          font-size: 0.75rem;
          color: #777;
          margin-top: 0.5rem;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
};

export default LocationPicker;
